from celery import Celery
from celery.schedules import crontab
from app.config import settings
import asyncio
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import Feed, Notification, Alert
from app.services import fetch_feed_content, AlertService, NotificationSender
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    "darkweb_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    beat_schedule={
        'check-feeds': {
            'task': 'app.tasks.celery_tasks.check_all_feeds',
            'schedule': 60.0,  # Check every 60 seconds
        },
        'send-pending-notifications': {
            'task': 'app.tasks.celery_tasks.send_pending_notifications',
            'schedule': 30.0,  # Check every 30 seconds
        },
    }
)


@celery_app.task(name="app.tasks.celery_tasks.check_all_feeds")
def check_all_feeds():
    """Check all enabled feeds that are due for fetching"""
    db = SessionLocal()
    try:
        from datetime import timezone
        now = datetime.now(timezone.utc)
        
        # Get all enabled feeds
        feeds = db.query(Feed).filter(Feed.enabled == True).all()
        
        for feed in feeds:
            # Check if feed is due for fetching
            if feed.last_fetched:
                # Make sure last_fetched is timezone-aware
                last_fetched = feed.last_fetched
                if last_fetched.tzinfo is None:
                    last_fetched = last_fetched.replace(tzinfo=timezone.utc)
                time_since_last_fetch = (now - last_fetched).total_seconds()
                if time_since_last_fetch < feed.fetch_interval:
                    continue  # Not due yet
            
            # Fetch feed asynchronously
            logger.info(f"Fetching feed: {feed.name} (ID: {feed.id})")
            check_feed.delay(feed.id)
    
    except Exception as e:
        logger.error(f"Error in check_all_feeds: {str(e)}")
    finally:
        db.close()


@celery_app.task(name="app.tasks.celery_tasks.check_feed")
def check_feed(feed_id: int):
    """Check a specific feed for new content and keyword matches"""
    db = SessionLocal()
    try:
        feed = db.query(Feed).filter(Feed.id == feed_id).first()
        if not feed or not feed.enabled:
            return
        
        # For API feeds, load template configuration
        metadata = feed.feed_metadata or {}
        if feed.feed_type.value == "api" and metadata.get('template_id'):
            from app.models.models import APITemplate
            template = db.query(APITemplate).filter(
                APITemplate.id == metadata['template_id'],
                APITemplate.enabled == True
            ).first()
            if template:
                # Merge template configuration into metadata
                metadata = {**metadata, 'configuration': template.configuration}
            else:
                logger.error(f"API template {metadata['template_id']} not found or disabled for feed {feed.name}")
                return
        
        # Fetch feed content
        result = asyncio.run(
            fetch_feed_content(
                feed.feed_type.value,
                feed.url,
                metadata
            )
        )
        
        # Store previous last_fetched time to check for new keywords
        from datetime import timezone
        previous_check_time = feed.last_fetched
        current_time = datetime.now(timezone.utc)
        
        if result["success"]:
            content = result.get("content", "")
            content_hash = result.get("hash", "")
            
            # Get all enabled keywords
            from app.models.models import Keyword
            all_keywords = db.query(Keyword).filter(Keyword.enabled == True).all()
            
            # Check if content has changed
            content_changed = feed.last_content_hash != content_hash
            
            if content_changed:
                # Content changed - check ALL keywords
                logger.info(f"Feed {feed.name} content changed - checking all keywords")
                feed.last_content_hash = content_hash
                
                if all_keywords:
                    logger.info(f"Checking {len(all_keywords)} keywords for feed {feed.name}")
                    alerts = AlertService.create_alerts(db, feed, content, all_keywords)
                    
                    if alerts:
                        logger.info(f"Created {len(alerts)} alerts for feed {feed.name}")
            else:
                # Content unchanged - check only NEW keywords created since last feed check
                if previous_check_time and all_keywords:
                    new_keywords = [kw for kw in all_keywords if kw.created_at > previous_check_time]
                    
                    if new_keywords:
                        logger.info(f"Feed {feed.name} content unchanged, but checking {len(new_keywords)} new keywords")
                        alerts = AlertService.create_alerts(db, feed, content, new_keywords)
                        
                        if alerts:
                            logger.info(f"Created {len(alerts)} alerts from new keywords for feed {feed.name}")
                    else:
                        logger.info(f"Feed {feed.name} content unchanged and no new keywords")
                else:
                    logger.info(f"Feed {feed.name} content unchanged")
            
            # Update last_fetched time after checking
            feed.last_fetched = current_time
            feed.last_error = None
            feed.last_error_at = None
            feed.consecutive_failures = 0
            db.commit()
        else:
            error_msg = result.get('error', 'Unknown error')
            logger.error(f"Failed to fetch feed {feed.name}: {error_msg}")
            # Track error and update last_fetched to avoid repeatedly checking failed feeds
            feed.last_error = error_msg
            feed.last_error_at = current_time
            feed.consecutive_failures = (feed.consecutive_failures or 0) + 1
            feed.last_fetched = current_time
            db.commit()
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error checking feed {feed_id}: {error_msg}")
        try:
            # Update feed with error info
            if feed:
                feed.last_error = error_msg
                feed.last_error_at = datetime.now(timezone.utc)
                feed.consecutive_failures = (feed.consecutive_failures or 0) + 1
                db.commit()
        except:
            db.rollback()
        db.rollback()
    finally:
        db.close()


@celery_app.task(name="app.tasks.celery_tasks.send_pending_notifications")
def send_pending_notifications():
    """Send all pending notifications"""
    db = SessionLocal()
    try:
        # Get all pending notifications
        notifications = db.query(Notification).filter(
            Notification.sent == False
        ).limit(100).all()  # Process in batches
        
        for notification in notifications:
            send_notification_task.delay(notification.id)
    
    except Exception as e:
        logger.error(f"Error in send_pending_notifications: {str(e)}")
    finally:
        db.close()


@celery_app.task(name="app.tasks.celery_tasks.send_notification_task")
def send_notification_task(notification_id: int):
    """Send a specific notification"""
    db = SessionLocal()
    try:
        notification = db.query(Notification).filter(
            Notification.id == notification_id
        ).first()
        
        if not notification or notification.sent:
            return
        
        # Send notification
        result = asyncio.run(
            NotificationSender.send_notification(
                notification.notification_type,
                notification.destination,
                notification.alert,
                db
            )
        )
        
        if result["success"]:
            notification.sent = True
            from datetime import timezone
            notification.sent_at = datetime.now(timezone.utc)
            logger.info(f"Sent notification {notification_id} via {notification.notification_type.value}")
        else:
            notification.error = result.get("error", "Unknown error")
            logger.error(f"Failed to send notification {notification_id}: {notification.error}")
        
        db.commit()
    
    except Exception as e:
        logger.error(f"Error sending notification {notification_id}: {str(e)}")
        db.rollback()
    finally:
        db.close()

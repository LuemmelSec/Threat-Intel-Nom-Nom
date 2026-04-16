import re
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Feed, Keyword, Alert, Notification, NotificationConfig, AlertType
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class KeywordMatcher:
    """Service to match keywords in content"""
    
    @staticmethod
    def find_matches(content: str, keywords: List[Keyword]) -> List[Dict[str, Any]]:
        """
        Find all keyword matches in content
        Returns list of matches with context
        """
        matches = []
        
        logger.debug(f"Searching for {len(keywords)} keywords in content (length: {len(content)})")
        
        for keyword in keywords:
            if not keyword.enabled:
                continue
            
            keyword_text = keyword.keyword
            
            if keyword.regex_pattern:
                # Use regex pattern
                try:
                    flags = 0 if keyword.case_sensitive else re.IGNORECASE
                    pattern = re.compile(keyword_text, flags)
                    
                    for match in pattern.finditer(content):
                        context = KeywordMatcher._extract_context(content, match.start(), match.end())
                        matches.append({
                            "keyword": keyword,
                            "matched_text": match.group(),
                            "context": context,
                            "position": match.start()
                        })
                except re.error as e:
                    # Invalid regex pattern
                    continue
            else:
                # Simple text search
                search_content = content if keyword.case_sensitive else content.lower()
                search_keyword = keyword_text if keyword.case_sensitive else keyword_text.lower()
                
                position = 0
                while True:
                    position = search_content.find(search_keyword, position)
                    if position == -1:
                        break
                    
                    context = KeywordMatcher._extract_context(
                        content, 
                        position, 
                        position + len(search_keyword)
                    )
                    
                    matches.append({
                        "keyword": keyword,
                        "matched_text": content[position:position + len(search_keyword)],
                        "context": context,
                        "position": position
                    })
                    
                    position += len(search_keyword)
        
        return matches
    
    @staticmethod
    def _extract_context(content: str, start: int, end: int, context_size: int = 200) -> str:
        """Extract context around matched keyword"""
        context_start = max(0, start - context_size)
        context_end = min(len(content), end + context_size)
        
        context = content[context_start:context_end]
        
        # Add ellipsis if truncated
        if context_start > 0:
            context = "..." + context
        if context_end < len(content):
            context = context + "..."
        
        return context


class AlertService:
    """Service to create and manage alerts"""
    
    @staticmethod
    def create_alerts(
        db: Session,
        feed: Feed,
        content: str,
        keywords: List[Keyword],
        api_metadata: List[Dict[str, Any]] = None
    ) -> List[Alert]:
        """
        Create alerts for matched keywords and queue notifications
        Only creates ONE alert per keyword per feed check (deduplicates multiple occurrences)
        api_metadata: Optional list of metadata dicts (one per content item from API feeds)
        """
        matches = KeywordMatcher.find_matches(content, keywords)
        created_alerts = []
        
        logger.info(f"Found {len(matches)} keyword matches for feed {feed.name}")
        
        # Deduplicate: only create ONE alert per keyword (take first match)
        keyword_matches = {}
        for match in matches:
            keyword_id = match["keyword"].id
            if keyword_id not in keyword_matches:
                keyword_matches[keyword_id] = match
        
        for match in keyword_matches.values():
            # Check if an alert for this keyword/feed combination already exists recently (within last hour)
            # This prevents duplicate alerts when feed is checked multiple times simultaneously
            from datetime import timedelta
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            existing_alert = db.query(Alert).filter(
                Alert.feed_id == feed.id,
                Alert.keyword_id == match["keyword"].id,
                Alert.triggered_at >= one_hour_ago
            ).first()
            
            if existing_alert:
                continue  # Skip creating duplicate alert
            
            # Find matching metadata for this alert (if from API feed)
            alert_metadata = {}
            if api_metadata:
                # Try to match the alert content to the source item
                matched_text = match["matched_text"]
                for item_meta in api_metadata:
                    # Check if any metadata values contain the matched text
                    for value in item_meta.values():
                        if matched_text.lower() in str(value).lower():
                            alert_metadata = item_meta
                            break
                    if alert_metadata:
                        break
            
            # Create alert with criticality from keyword
            alert = Alert(
                feed_id=feed.id,
                keyword_id=match["keyword"].id,
                matched_content=match["matched_text"],
                context=match["context"],
                api_metadata=alert_metadata,
                criticality=match["keyword"].criticality,
                triggered_at=datetime.utcnow(),
                read=False
            )
            db.add(alert)
            db.flush()  # Flush to get alert.id
            
            # Get notification configs and create notifications
            notification_configs = db.query(NotificationConfig).filter(
                NotificationConfig.enabled == True
            ).all()
            
            for config in notification_configs:
                notification = Notification(
                    alert_id=alert.id,
                    notification_type=config.notification_type,
                    destination=config.destination,
                    sent=False
                )
                db.add(notification)
            
            created_alerts.append(alert)
        
        db.commit()
        
        return created_alerts
    
    @staticmethod
    def mark_as_read(db: Session, alert_id: int) -> bool:
        """Mark alert as read"""
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.read = True
            db.commit()
            return True
        return False
    
    @staticmethod
    def mark_as_unread(db: Session, alert_id: int) -> bool:
        """Mark alert as unread"""
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.read = False
            db.commit()
            return True
        return False
    
    @staticmethod
    def mark_all_as_read(db: Session) -> int:
        """Mark all alerts as read, returns count of affected alerts"""
        count = db.query(Alert).filter(Alert.read == False).update({"read": True})
        db.commit()
        return count

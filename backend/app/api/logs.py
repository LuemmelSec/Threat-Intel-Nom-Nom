from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Feed
from typing import List, Dict, Any

router = APIRouter()


@router.get("/health")
def get_system_health(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get overall system health status"""
    
    # Get all feeds with error information
    feeds = db.query(Feed).all()
    
    total_feeds = len(feeds)
    healthy_feeds = sum(1 for f in feeds if f.enabled and (f.consecutive_failures == 0 or f.consecutive_failures is None))
    warning_feeds = sum(1 for f in feeds if f.enabled and f.consecutive_failures in [1, 2])
    error_feeds = sum(1 for f in feeds if f.enabled and f.consecutive_failures and f.consecutive_failures >= 3)
    disabled_feeds = sum(1 for f in feeds if not f.enabled)
    
    return {
        "total_feeds": total_feeds,
        "healthy_feeds": healthy_feeds,
        "warning_feeds": warning_feeds,
        "error_feeds": error_feeds,
        "disabled_feeds": disabled_feeds,
        "overall_status": "error" if error_feeds > 0 else "warning" if warning_feeds > 0 else "healthy"
    }


@router.get("/feed-errors")
def get_feed_errors(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get all feeds with error information"""
    
    feeds = db.query(Feed).order_by(Feed.consecutive_failures.desc().nullslast(), Feed.last_error_at.desc().nullslast()).all()
    
    results = []
    for feed in feeds:
        # Determine status
        if not feed.enabled:
            status = "disabled"
        elif not feed.consecutive_failures or feed.consecutive_failures == 0:
            status = "healthy"
        elif feed.consecutive_failures <= 2:
            status = "warning"
        else:
            status = "error"
        
        results.append({
            "id": feed.id,
            "name": feed.name,
            "feed_type": feed.feed_type.value,
            "url": feed.url,
            "enabled": feed.enabled,
            "status": status,
            "last_fetched": feed.last_fetched.isoformat() if feed.last_fetched else None,
            "last_error": feed.last_error,
            "last_error_at": feed.last_error_at.isoformat() if feed.last_error_at else None,
            "consecutive_failures": feed.consecutive_failures or 0,
        })
    
    return results

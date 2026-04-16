from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Feed, Keyword, Alert, StatisticsResponse

router = APIRouter(prefix="/stats", tags=["statistics"])


@router.get("/", response_model=StatisticsResponse)
def get_statistics(db: Session = Depends(get_db)):
    """Get system statistics"""
    
    # Total and active feeds
    total_feeds = db.query(func.count(Feed.id)).scalar()
    active_feeds = db.query(func.count(Feed.id)).filter(Feed.enabled == True).scalar()
    
    # Total and active keywords
    total_keywords = db.query(func.count(Keyword.id)).scalar()
    active_keywords = db.query(func.count(Keyword.id)).filter(Keyword.enabled == True).scalar()
    
    # Total and unread alerts
    total_alerts = db.query(func.count(Alert.id)).scalar()
    unread_alerts = db.query(func.count(Alert.id)).filter(Alert.read == False).scalar()
    
    # Alerts in last 24 hours
    time_threshold = datetime.utcnow() - timedelta(hours=24)
    alerts_last_24h = db.query(func.count(Alert.id)).filter(
        Alert.triggered_at >= time_threshold
    ).scalar()
    
    return StatisticsResponse(
        total_feeds=total_feeds or 0,
        active_feeds=active_feeds or 0,
        total_keywords=total_keywords or 0,
        active_keywords=active_keywords or 0,
        total_alerts=total_alerts or 0,
        unread_alerts=unread_alerts or 0,
        alerts_last_24h=alerts_last_24h or 0
    )

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Alert, AlertResponse, AlertUpdate, Criticality, SuppressedAlert
from app.services import AlertService

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=List[AlertResponse])
def get_alerts(
    skip: int = 0,
    limit: int = 100,
    read: Optional[bool] = None,
    criticality: Optional[Criticality] = None,
    feed_id: Optional[int] = None,
    keyword_id: Optional[int] = None,
    hours: Optional[int] = Query(None, description="Filter alerts from last N hours"),
    db: Session = Depends(get_db)
):
    """Get all alerts with optional filters"""
    query = db.query(Alert).order_by(desc(Alert.triggered_at))
    
    if read is not None:
        query = query.filter(Alert.read == read)
    
    if criticality is not None:
        query = query.filter(Alert.criticality == criticality.value)
    
    if feed_id is not None:
        query = query.filter(Alert.feed_id == feed_id)
    
    if keyword_id is not None:
        query = query.filter(Alert.keyword_id == keyword_id)
    
    if hours is not None:
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(Alert.triggered_at >= time_threshold)
    
    alerts = query.offset(skip).limit(limit).all()
    return alerts


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    """Get a specific alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.put("/{alert_id}/read")
def mark_alert_as_read(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as read"""
    success = AlertService.mark_as_read(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"message": "Alert marked as read", "alert_id": alert_id}


@router.put("/{alert_id}/unread")
def mark_alert_as_unread(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as unread"""
    success = AlertService.mark_as_unread(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"message": "Alert marked as unread", "alert_id": alert_id}


@router.put("/{alert_id}")
def update_alert(alert_id: int, alert_update: AlertUpdate, db: Session = Depends(get_db)):
    """Update alert properties (criticality, read status)"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    update_data = alert_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == 'criticality' and value is not None:
            setattr(alert, field, value.value)
        else:
            setattr(alert, field, value)
    
    db.commit()
    db.refresh(alert)
    return alert


@router.put("/read-all")
def mark_all_alerts_as_read(db: Session = Depends(get_db)):
    """Mark all alerts as read"""
    count = AlertService.mark_all_as_read(db)
    return {"message": f"Marked {count} alerts as read", "count": count}


@router.delete("/cleanup")
def cleanup_old_alerts(
    days: int = Query(..., description="Delete alerts older than this many days", ge=1),
    db: Session = Depends(get_db)
):
    """Delete alerts older than specified number of days and suppress them"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Query alerts older than cutoff date
    old_alerts = db.query(Alert).filter(Alert.triggered_at < cutoff_date).all()
    count = len(old_alerts)
    
    # Record suppressions then delete
    for alert in old_alerts:
        db.add(SuppressedAlert(
            feed_id=alert.feed_id,
            article_hash=alert.article_hash,
            context_hash=alert.context_hash,
            keyword_id=alert.keyword_id,
        ))
        db.delete(alert)
    
    db.commit()
    
    return {
        "message": f"Deleted {count} alerts older than {days} days",
        "count": count,
        "cutoff_date": cutoff_date.isoformat()
    }


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    """Delete an alert and suppress it from re-triggering"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Record suppression so this alert is never recreated
    db.add(SuppressedAlert(
        feed_id=alert.feed_id,
        article_hash=alert.article_hash,
        context_hash=alert.context_hash,
        keyword_id=alert.keyword_id,
    ))
    
    db.delete(alert)
    db.commit()
    return None

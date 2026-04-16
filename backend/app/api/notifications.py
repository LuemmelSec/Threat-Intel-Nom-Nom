from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import (
    NotificationConfig, NotificationConfigCreate,
    NotificationConfigUpdate, NotificationConfigResponse
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationConfigResponse])
def get_notification_configs(
    skip: int = 0,
    limit: int = 100,
    enabled: bool = None,
    db: Session = Depends(get_db)
):
    """Get all notification configurations"""
    query = db.query(NotificationConfig)
    
    if enabled is not None:
        query = query.filter(NotificationConfig.enabled == enabled)
    
    configs = query.offset(skip).limit(limit).all()
    return configs


@router.get("/{config_id}", response_model=NotificationConfigResponse)
def get_notification_config(config_id: int, db: Session = Depends(get_db)):
    """Get a specific notification configuration"""
    config = db.query(NotificationConfig).filter(NotificationConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Notification configuration not found")
    return config


@router.post("/", response_model=NotificationConfigResponse, status_code=status.HTTP_201_CREATED)
def create_notification_config(
    config: NotificationConfigCreate,
    db: Session = Depends(get_db)
):
    """Create a new notification configuration"""
    db_config = NotificationConfig(
        name=config.name,
        notification_type=config.notification_type,
        destination=config.destination,
        enabled=config.enabled
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


@router.put("/{config_id}", response_model=NotificationConfigResponse)
def update_notification_config(
    config_id: int,
    config_update: NotificationConfigUpdate,
    db: Session = Depends(get_db)
):
    """Update a notification configuration"""
    config = db.query(NotificationConfig).filter(NotificationConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Notification configuration not found")
    
    update_data = config_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    return config


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification_config(config_id: int, db: Session = Depends(get_db)):
    """Delete a notification configuration"""
    config = db.query(NotificationConfig).filter(NotificationConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Notification configuration not found")
    
    db.delete(config)
    db.commit()
    return None

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import (
    Feed, FeedCreate, FeedUpdate, FeedResponse,
    FeedKeywordAssociation
)
from app.tasks import check_feed

router = APIRouter(prefix="/feeds", tags=["feeds"])


@router.get("/", response_model=List[FeedResponse])
def get_feeds(
    skip: int = 0,
    limit: int = 100,
    enabled: bool = None,
    db: Session = Depends(get_db)
):
    """Get all feeds"""
    query = db.query(Feed)
    
    if enabled is not None:
        query = query.filter(Feed.enabled == enabled)
    
    feeds = query.offset(skip).limit(limit).all()
    return feeds


@router.get("/{feed_id}", response_model=FeedResponse)
def get_feed(feed_id: int, db: Session = Depends(get_db)):
    """Get a specific feed"""
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    return feed


@router.post("/", response_model=FeedResponse, status_code=status.HTTP_201_CREATED)
def create_feed(feed: FeedCreate, db: Session = Depends(get_db)):
    """Create a new feed"""
    db_feed = Feed(
        name=feed.name,
        feed_type=feed.feed_type,
        url=feed.url,
        enabled=feed.enabled,
        fetch_interval=feed.fetch_interval,
        feed_metadata=feed.feed_metadata
    )
    db.add(db_feed)
    db.commit()
    db.refresh(db_feed)
    return db_feed


@router.put("/{feed_id}", response_model=FeedResponse)
def update_feed(
    feed_id: int,
    feed_update: FeedUpdate,
    db: Session = Depends(get_db)
):
    """Update a feed"""
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    update_data = feed_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(feed, field, value)
    
    db.commit()
    db.refresh(feed)
    return feed


@router.delete("/{feed_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feed(feed_id: int, db: Session = Depends(get_db)):
    """Delete a feed"""
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    db.delete(feed)
    db.commit()
    return None


@router.post("/{feed_id}/keywords")
def assign_keywords_to_feed(
    feed_id: int,
    association: FeedKeywordAssociation,
    db: Session = Depends(get_db)
):
    """Assign keywords to a feed"""
    from app.models import Keyword
    
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    # Clear existing keywords
    feed.keywords.clear()
    
    # Add new keywords
    keywords = db.query(Keyword).filter(Keyword.id.in_(association.keyword_ids)).all()
    feed.keywords.extend(keywords)
    
    db.commit()
    db.refresh(feed)
    
    return {
        "message": f"Assigned {len(keywords)} keywords to feed",
        "feed_id": feed_id,
        "keyword_ids": [k.id for k in keywords]
    }


@router.post("/{feed_id}/check")
def trigger_feed_check(feed_id: int, db: Session = Depends(get_db)):
    """Manually trigger a feed check"""
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    # Trigger Celery task
    task = check_feed.delay(feed_id)
    
    return {
        "message": "Feed check triggered",
        "feed_id": feed_id,
        "task_id": task.id
    }

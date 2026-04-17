from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import (
    Tag, Feed, Keyword, Alert,
    TagCreate, TagUpdate, TagResponse, TagAssignment
)

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=List[TagResponse])
def get_tags(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all tags"""
    tags = db.query(Tag).offset(skip).limit(limit).all()
    return tags


@router.get("/{tag_id}", response_model=TagResponse)
def get_tag(tag_id: int, db: Session = Depends(get_db)):
    """Get a specific tag"""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.post("/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    """Create a new tag"""
    # Check if tag already exists
    existing = db.query(Tag).filter(Tag.name == tag.name).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Tag already exists"
        )
    
    db_tag = Tag(
        name=tag.name,
        color=tag.color,
        description=tag.description
    )
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


@router.put("/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: int,
    tag_update: TagUpdate,
    db: Session = Depends(get_db)
):
    """Update a tag"""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    update_data = tag_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tag, field, value)
    
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    """Delete a tag"""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    db.delete(tag)
    db.commit()
    return None


# Feed tag assignment endpoints
@router.post("/feeds/{feed_id}/tags", response_model=dict)
def assign_tags_to_feed(
    feed_id: int,
    assignment: TagAssignment,
    db: Session = Depends(get_db)
):
    """Assign tags to a feed"""
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    # Get all tags
    tags = db.query(Tag).filter(Tag.id.in_(assignment.tag_ids)).all()
    if len(tags) != len(assignment.tag_ids):
        raise HTTPException(status_code=404, detail="One or more tags not found")
    
    # Replace existing tags
    feed.tags = tags
    db.commit()
    
    return {"message": f"Assigned {len(tags)} tags to feed"}


@router.delete("/feeds/{feed_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_tag_from_feed(
    feed_id: int,
    tag_id: int,
    db: Session = Depends(get_db)
):
    """Remove a tag from a feed"""
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    if tag in feed.tags:
        feed.tags.remove(tag)
        db.commit()
    
    return None


# Keyword tag assignment endpoints
@router.post("/keywords/{keyword_id}/tags", response_model=dict)
def assign_tags_to_keyword(
    keyword_id: int,
    assignment: TagAssignment,
    db: Session = Depends(get_db)
):
    """Assign tags to a keyword"""
    keyword = db.query(Keyword).filter(Keyword.id == keyword_id).first()
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    
    # Get all tags
    tags = db.query(Tag).filter(Tag.id.in_(assignment.tag_ids)).all()
    if len(tags) != len(assignment.tag_ids):
        raise HTTPException(status_code=404, detail="One or more tags not found")
    
    # Replace existing tags
    keyword.tags = tags
    db.commit()
    
    return {"message": f"Assigned {len(tags)} tags to keyword"}


@router.delete("/keywords/{keyword_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_tag_from_keyword(
    keyword_id: int,
    tag_id: int,
    db: Session = Depends(get_db)
):
    """Remove a tag from a keyword"""
    keyword = db.query(Keyword).filter(Keyword.id == keyword_id).first()
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    if tag in keyword.tags:
        keyword.tags.remove(tag)
        db.commit()
    
    return None


# Alert tag assignment endpoints
@router.post("/alerts/{alert_id}/tags", response_model=dict)
def assign_tags_to_alert(
    alert_id: int,
    assignment: TagAssignment,
    db: Session = Depends(get_db)
):
    """Assign tags to an alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Get all tags
    tags = db.query(Tag).filter(Tag.id.in_(assignment.tag_ids)).all()
    if len(tags) != len(assignment.tag_ids):
        raise HTTPException(status_code=404, detail="One or more tags not found")
    
    # Replace existing tags
    alert.tags = tags
    db.commit()
    
    return {"message": f"Assigned {len(tags)} tags to alert"}


@router.delete("/alerts/{alert_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_tag_from_alert(
    alert_id: int,
    tag_id: int,
    db: Session = Depends(get_db)
):
    """Remove a tag from an alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    if tag in alert.tags:
        alert.tags.remove(tag)
        db.commit()
    
    return None

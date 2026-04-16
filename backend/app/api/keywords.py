from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import (
    Keyword, KeywordCreate, KeywordUpdate, KeywordResponse
)

router = APIRouter(prefix="/keywords", tags=["keywords"])


@router.get("/", response_model=List[KeywordResponse])
def get_keywords(
    skip: int = 0,
    limit: int = 100,
    enabled: bool = None,
    db: Session = Depends(get_db)
):
    """Get all keywords"""
    query = db.query(Keyword)
    
    if enabled is not None:
        query = query.filter(Keyword.enabled == enabled)
    
    keywords = query.offset(skip).limit(limit).all()
    return keywords


@router.get("/{keyword_id}", response_model=KeywordResponse)
def get_keyword(keyword_id: int, db: Session = Depends(get_db)):
    """Get a specific keyword"""
    keyword = db.query(Keyword).filter(Keyword.id == keyword_id).first()
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    return keyword


@router.post("/", response_model=KeywordResponse, status_code=status.HTTP_201_CREATED)
def create_keyword(keyword: KeywordCreate, db: Session = Depends(get_db)):
    """Create a new keyword"""
    # Check if keyword already exists
    existing = db.query(Keyword).filter(Keyword.keyword == keyword.keyword).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Keyword already exists"
        )
    
    db_keyword = Keyword(
        keyword=keyword.keyword,
        case_sensitive=keyword.case_sensitive,
        regex_pattern=keyword.regex_pattern,
        enabled=keyword.enabled,
        criticality=keyword.criticality.value
    )
    db.add(db_keyword)
    db.commit()
    db.refresh(db_keyword)
    return db_keyword


@router.put("/{keyword_id}", response_model=KeywordResponse)
def update_keyword(
    keyword_id: int,
    keyword_update: KeywordUpdate,
    db: Session = Depends(get_db)
):
    """Update a keyword"""
    keyword = db.query(Keyword).filter(Keyword.id == keyword_id).first()
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    
    update_data = keyword_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == 'criticality' and value is not None:
            setattr(keyword, field, value.value)
        else:
            setattr(keyword, field, value)
    
    db.commit()
    db.refresh(keyword)
    return keyword


@router.delete("/{keyword_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_keyword(keyword_id: int, db: Session = Depends(get_db)):
    """Delete a keyword"""
    keyword = db.query(Keyword).filter(Keyword.id == keyword_id).first()
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    
    db.delete(keyword)
    db.commit()
    return None

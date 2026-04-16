from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import models, schemas
from app.services.feed_fetcher import APIFetcher
import httpx

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("/", response_model=List[schemas.APITemplateResponse])
def get_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all API templates"""
    templates = db.query(models.APITemplate).offset(skip).limit(limit).all()
    return templates


@router.get("/{template_id}", response_model=schemas.APITemplateResponse)
def get_template(template_id: int, db: Session = Depends(get_db)):
    """Get a specific API template"""
    template = db.query(models.APITemplate).filter(models.APITemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/", response_model=schemas.APITemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(template: schemas.APITemplateCreate, db: Session = Depends(get_db)):
    """Create a new API template"""
    # Check if template with same name already exists
    existing = db.query(models.APITemplate).filter(models.APITemplate.name == template.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Template with this name already exists")
    
    db_template = models.APITemplate(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@router.put("/{template_id}", response_model=schemas.APITemplateResponse)
def update_template(
    template_id: int,
    template: schemas.APITemplateUpdate,
    db: Session = Depends(get_db)
):
    """Update an API template"""
    db_template = db.query(models.APITemplate).filter(models.APITemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Don't allow modifying system templates' system status
    update_data = template.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_template, field, value)
    
    db.commit()
    db.refresh(db_template)
    return db_template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: int, db: Session = Depends(get_db)):
    """Delete an API template (cannot delete system templates)"""
    db_template = db.query(models.APITemplate).filter(models.APITemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if db_template.is_system:
        raise HTTPException(status_code=403, detail="Cannot delete system templates")
    
    db.delete(db_template)
    db.commit()
    return None


@router.post("/{template_id}/test", response_model=schemas.APITemplateTestResponse)
async def test_template(template_id: int, db: Session = Depends(get_db)):
    """Test an API template by making a live API call"""
    db_template = db.query(models.APITemplate).filter(models.APITemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Get configuration
    config = db_template.configuration
    endpoint = config.get('endpoint', '')
    
    if not endpoint:
        return schemas.APITemplateTestResponse(
            success=False,
            error="Template has no endpoint configured"
        )
    
    # Prepare metadata for APIFetcher
    metadata = {
        "configuration": config
    }
    
    # Use APIFetcher to test the template
    try:
        result = await APIFetcher.fetch(endpoint, metadata)
        
        if result.get('success'):
            # Get sample data (first 3 items)
            sample_data = result.get('raw_data', [])[:3]
            
            # Get first item's mapped fields as example
            api_metadata = result.get('api_metadata', [])
            mapped_fields = api_metadata[0] if api_metadata else {}
            
            return schemas.APITemplateTestResponse(
                success=True,
                status_code=200,
                records_found=result.get('item_count', 0),
                sample_data=sample_data,
                mapped_fields=mapped_fields
            )
        else:
            return schemas.APITemplateTestResponse(
                success=False,
                error=result.get('error', 'Unknown error')
            )
    
    except Exception as e:
        return schemas.APITemplateTestResponse(
            success=False,
            error=f"Test failed: {str(e)}"
        )

from pydantic import BaseModel, Field, HttpUrl, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.models import FeedType, AlertType, Criticality


# Feed Schemas
class FeedBase(BaseModel):
    name: str
    feed_type: FeedType
    url: str
    enabled: bool = True
    fetch_interval: int = Field(default=300, ge=60)  # min 60 seconds
    feed_metadata: Dict[str, Any] = {}


class FeedCreate(FeedBase):
    pass


class FeedUpdate(BaseModel):
    name: Optional[str] = None
    feed_type: Optional[FeedType] = None
    url: Optional[str] = None
    enabled: Optional[bool] = None
    fetch_interval: Optional[int] = Field(default=None, ge=60)
    feed_metadata: Optional[Dict[str, Any]] = None


class FeedResponse(FeedBase):
    id: int
    last_fetched: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    keywords: List['KeywordResponse'] = []
    tags: List['TagResponse'] = []
    
    class Config:
        from_attributes = True


# Keyword Schemas
class KeywordBase(BaseModel):
    keyword: str
    case_sensitive: bool = False
    regex_pattern: bool = False
    enabled: bool = True
    criticality: Criticality = Criticality.MEDIUM


class KeywordCreate(KeywordBase):
    pass


class KeywordUpdate(BaseModel):
    keyword: Optional[str] = None
    case_sensitive: Optional[bool] = None
    regex_pattern: Optional[bool] = None
    enabled: Optional[bool] = None
    criticality: Optional[Criticality] = None


class KeywordResponse(KeywordBase):
    id: int
    created_at: datetime
    tags: List['TagResponse'] = []
    
    class Config:
        from_attributes = True


# Alert Schemas
class AlertUpdate(BaseModel):
    criticality: Optional[Criticality] = None
    read: Optional[bool] = None


class AlertResponse(BaseModel):
    id: int
    feed_id: int
    keyword_id: int
    matched_content: str
    context: Optional[str]
    api_metadata: Dict[str, Any] = {}
    criticality: Criticality
    triggered_at: datetime
    read: bool
    feed: 'FeedBasicResponse'
    keyword: KeywordResponse
    tags: List['TagResponse'] = []
    
    class Config:
        from_attributes = True


class FeedBasicResponse(BaseModel):
    id: int
    name: str
    feed_type: FeedType
    url: str
    
    class Config:
        from_attributes = True


# Notification Config Schemas
class NotificationConfigBase(BaseModel):
    name: str
    notification_type: AlertType
    destination: str
    enabled: bool = True


class NotificationConfigCreate(NotificationConfigBase):
    pass


class NotificationConfigUpdate(BaseModel):
    name: Optional[str] = None
    destination: Optional[str] = None
    enabled: Optional[bool] = None


class NotificationConfigResponse(NotificationConfigBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Feed-Keyword Association Schema
class FeedKeywordAssociation(BaseModel):
    feed_id: int
    keyword_ids: List[int]


# Statistics Schema
class StatisticsResponse(BaseModel):
    total_feeds: int
    active_feeds: int
    healthy_feeds: int
    total_keywords: int
    active_keywords: int
    total_alerts: int
    unread_alerts: int
    alerts_last_24h: int


# API Template Schemas
class APITemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    configuration: Dict[str, Any]
    enabled: bool = True


class APITemplateCreate(APITemplateBase):
    is_system: bool = False


class APITemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    enabled: Optional[bool] = None


class APITemplateResponse(APITemplateBase):
    id: int
    is_system: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class APITemplateTestResponse(BaseModel):
    success: bool
    status_code: Optional[int] = None
    records_found: Optional[int] = None
    sample_data: Optional[List[Dict[str, Any]]] = None
    mapped_fields: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# Tag Schemas
class TagBase(BaseModel):
    name: str
    color: str = "#3b82f6"
    description: Optional[str] = None


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None


class TagResponse(TagBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class TagAssignment(BaseModel):
    tag_ids: List[int]


# Update forward references
FeedResponse.model_rebuild()
AlertResponse.model_rebuild()

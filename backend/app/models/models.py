from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey, JSON, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class FeedType(str, enum.Enum):
    WEBSITE = "website"
    ONION = "onion"
    RSS = "rss"
    API = "api"


class AlertType(str, enum.Enum):
    GUI = "gui"
    WEBHOOK = "webhook"
    EMAIL = "email"
    DISCORD = "discord"


class Criticality(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Association table for Feed-Keyword many-to-many relationship
feed_keywords = Table(
    'feed_keywords',
    Base.metadata,
    Column('feed_id', Integer, ForeignKey('feeds.id', ondelete='CASCADE')),
    Column('keyword_id', Integer, ForeignKey('keywords.id', ondelete='CASCADE'))
)


class Feed(Base):
    __tablename__ = "feeds"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    feed_type = Column(Enum(FeedType), nullable=False)
    url = Column(Text, nullable=False)
    enabled = Column(Boolean, default=True)
    fetch_interval = Column(Integer, default=300)  # seconds
    last_fetched = Column(DateTime(timezone=True), nullable=True)
    last_content_hash = Column(String(64), nullable=True)
    feed_metadata = Column(JSON, default={})  # For telegram API credentials, etc.
    last_error = Column(Text, nullable=True)  # Last error message
    last_error_at = Column(DateTime(timezone=True), nullable=True)  # When error occurred
    consecutive_failures = Column(Integer, default=0)  # Count of consecutive failures
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    keywords = relationship("Keyword", secondary=feed_keywords, back_populates="feeds")
    alerts = relationship("Alert", back_populates="feed", cascade="all, delete-orphan")


class Keyword(Base):
    __tablename__ = "keywords"
    
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(255), nullable=False, unique=True, index=True)
    case_sensitive = Column(Boolean, default=False)
    regex_pattern = Column(Boolean, default=False)
    enabled = Column(Boolean, default=True)
    criticality = Column(String(20), default="medium", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    feeds = relationship("Feed", secondary=feed_keywords, back_populates="keywords")
    alerts = relationship("Alert", back_populates="keyword", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    feed_id = Column(Integer, ForeignKey("feeds.id", ondelete="CASCADE"), nullable=False)
    keyword_id = Column(Integer, ForeignKey("keywords.id", ondelete="CASCADE"), nullable=False)
    matched_content = Column(Text, nullable=False)
    context = Column(Text, nullable=True)  # Surrounding text for context
    api_metadata = Column(JSON, default={})  # API metadata: victim, gang, country, industry, etc.
    criticality = Column(String(20), default="medium", nullable=False)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    read = Column(Boolean, default=False)
    
    # Relationships
    feed = relationship("Feed", back_populates="alerts")
    keyword = relationship("Keyword", back_populates="alerts")
    notifications = relationship("Notification", back_populates="alert", cascade="all, delete-orphan")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False)
    notification_type = Column(Enum(AlertType), nullable=False)
    destination = Column(Text, nullable=False)  # webhook URL, email, discord webhook
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    alert = relationship("Alert", back_populates="notifications")


class NotificationConfig(Base):
    __tablename__ = "notification_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    notification_type = Column(Enum(AlertType), nullable=False)
    destination = Column(Text, nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class APITemplate(Base):
    __tablename__ = "api_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    configuration = Column(JSON, nullable=False)  # Full API configuration as JSON
    is_system = Column(Boolean, default=False)  # System templates can't be deleted
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

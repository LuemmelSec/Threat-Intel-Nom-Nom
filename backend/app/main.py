from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api import feeds, keywords, alerts, notifications, stats, logs, templates
from app.utils.init_data import initialize_default_feeds, initialize_default_templates
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Dark Web Alert API",
    description="Monitor dark web sources and receive alerts based on keywords",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(feeds.router, prefix="/api")
app.include_router(keywords.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(templates.router)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Dark Web Alert API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("Starting Dark Web Alert API...")
    logger.info("Database tables created/verified")
    data
    db = SessionLocal()
    try:
        initialize_default_feeds(db)
        initialize_default_template
        initialize_default_feeds(db)
    finally:
        db.close()


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Shutting down Dark Web Alert API...")

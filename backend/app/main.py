from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api import feeds, keywords, alerts, notifications, stats, logs, templates, tags
from app.utils.init_data import initialize_default_feeds, initialize_default_templates, initialize_default_tags
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
    title="Threat Intel Nom Nom API",
    description="Monitor threat intelligence sources and receive alerts based on keywords",
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
app.include_router(tags.router, prefix="/api")


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Threat Intel Nom Nom API",
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
    logger.info("Starting Threat Intel Nom Nom API...")
    logger.info("Database tables created/verified")
    db = SessionLocal()
    try:
        initialize_default_templates(db)
        initialize_default_tags(db)
        initialize_default_feeds(db)
    finally:
        db.close()


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Shutting down Threat Intel Nom Nom API...")

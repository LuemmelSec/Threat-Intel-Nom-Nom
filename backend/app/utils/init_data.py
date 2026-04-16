"""Initialize database with default data"""
import logging
from sqlalchemy.orm import Session
from app.models.models import Feed

logger = logging.getLogger(__name__)

DEFAULT_FEEDS = [
    {
        "name": "HIBP Breach Feed",
        "feed_type": "rss",
        "url": "https://haveibeenpwned.com/feed/breaches",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "RansomLook API Recent",
        "feed_type": "website",
        "url": "https://www.ransomlook.io/api/recent",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "Krebs on Security",
        "feed_type": "rss",
        "url": "https://krebsonsecurity.com/feed/",
        "enabled": True,
        "fetch_interval": 7200,
        "feed_metadata": {}
    },
    {
        "name": "Bleeping Computer Security",
        "feed_type": "rss",
        "url": "https://www.bleepingcomputer.com/feed/",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "CISA Advisories",
        "feed_type": "rss",
        "url": "https://www.cisa.gov/cybersecurity-advisories/all.xml",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "The Hacker News",
        "feed_type": "rss",
        "url": "https://feeds.feedburner.com/TheHackersNews",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "Threat Post",
        "feed_type": "rss",
        "url": "https://threatpost.com/feed/",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "Dark Reading",
        "feed_type": "rss",
        "url": "https://www.darkreading.com/rss.xml",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "Security Affairs",
        "feed_type": "rss",
        "url": "https://securityaffairs.com/feed",
        "enabled": True,
        "fetch_interval": 7200,
        "feed_metadata": {}
    },
    {
        "name": "RansomFeed",
        "feed_type": "website",
        "url": "https://ransomfeed.it/api/v2/recent",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    }
]


def initialize_default_feeds(db: Session) -> None:
    """
    Initialize database with default feeds if they don't exist.
    Called automatically on application startup.
    """
    try:
        # Get existing feed URLs
        existing_urls = {feed.url for feed in db.query(Feed).all()}
        
        # Add missing default feeds
        added = 0
        for feed_data in DEFAULT_FEEDS:
            if feed_data["url"] in existing_urls:
                continue
            
            feed = Feed(**feed_data)
            db.add(feed)
            added += 1
            logger.info(f"Added default feed: {feed_data['name']}")
        
        if added > 0:
            db.commit()
            logger.info(f"✅ Initialized {added} default cybersecurity feeds")
        else:
            logger.info(f"All default feeds already exist ({len(existing_urls)} total)")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to initialize default feeds: {e}")

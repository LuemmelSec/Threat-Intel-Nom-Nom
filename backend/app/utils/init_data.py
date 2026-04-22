"""Initialize database with default data"""
import logging
from sqlalchemy.orm import Session
from app.models.models import Feed, APITemplate, Tag, FeedType

logger = logging.getLogger(__name__)

DEFAULT_FEEDS = [
    # API Feeds (1-2)
    {
        "name": "Ransomfeed.it",
        "feed_type": "api",
        "url": "https://api.ransomfeed.it/",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {"template_id": 1}
    },
    {
        "name": "RansomLook API Recent",
        "feed_type": "api",
        "url": "https://www.ransomlook.io/api/recent",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {"template_id": 2}
    },
    # RSS Feeds (3-16) - alphabetical
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
        "name": "Dark Reading",
        "feed_type": "rss",
        "url": "https://www.darkreading.com/rss.xml",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "Dark Web Informer",
        "feed_type": "rss",
        "url": "https://nitter.net/DarkWebInformer/rss",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "Hackmanac",
        "feed_type": "rss",
        "url": "https://nitter.net/H4ckmanac/rss",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "HIBP Breach Feed",
        "feed_type": "rss",
        "url": "https://haveibeenpwned.com/feed/breaches",
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
        "name": "LuemmelSec",
        "feed_type": "rss",
        "url": "https://nitter.net/theluemmel/rss",
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
        "name": "International Cyber Digest",
        "feed_type": "rss",
        "url": "https://nitter.net/IntCyberDigest/rss",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "Dark Web Intelligence",
        "feed_type": "rss",
        "url": "https://nitter.net/DailyDarkWeb/rss",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "Defused",
        "feed_type": "rss",
        "url": "https://nitter.net/DefusedCyber/rss",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    # Website Feeds (17-19) - alphabetical
    {
        "name": "Dark Web Informer",
        "feed_type": "website",
        "url": "https://darkwebinformer.com/",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "Ransomware.live",
        "feed_type": "website",
        "url": "https://www.ransomware.live/",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "Infostealers.com",
        "feed_type": "website",
        "url": "https://www.infostealers.com/infostealer-victims/",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    # Onion Feeds (20-24) - alphabetical
    {
        "name": "Coinbasecartel",
        "feed_type": "onion",
        "url": "http://fjg4zi4opkxkvdz7mvwp7h6goe4tcby3hhkrz43pht4j3vakhy75znyd.onion",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "DragonForce",
        "feed_type": "onion",
        "url": "http://z3wqggtxft7id3ibr7srivv5gjof5fwg76slewnzwwakjuf3nlhukdid.onion/blog",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "LockBit",
        "feed_type": "onion",
        "url": "http://lockbit3753ekiocyo5epmpy6klmejchjtzddoekjlnt6mu3qh4de2id.onion/",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "Qilin",
        "feed_type": "onion",
        "url": "http://ijzn3sicrcy7guixkzjkib4ukbiilwc3xhnmby4mcbccnsd7j2rekvqd.onion/",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    },
    {
        "name": "ShadowByt3$ LEAKS",
        "feed_type": "onion",
        "url": "http://sdwbytqeb664krp2wz2qs3lxxah2rhneuotot5hy7g4jpn2pindigcad.onion/leaks.php",
        "enabled": True,
        "fetch_interval": 3600,
        "feed_metadata": {}
    }
]

DEFAULT_TAGS = [
    {
        "name": "X",
        "color": "#000000",
        "description": ""
    },
    {
        "name": "Ransomware Gang",
        "color": "#540ed8",
        "description": ""
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
        new_feeds = []
        for feed_data in DEFAULT_FEEDS:
            if feed_data["url"] in existing_urls:
                continue
            
            feed = Feed(**feed_data)
            db.add(feed)
            new_feeds.append(feed)
            added += 1
            logger.info(f"Added default feed: {feed_data['name']}")
        
        if added > 0:
            db.commit()
            logger.info(f"✅ Initialized {added} default cybersecurity feeds")
            
            # Assign tags to feeds
            assign_default_tags(db)
        else:
            logger.info(f"All default feeds already exist ({len(existing_urls)} total)")
            # Still assign tags in case they were missing
            assign_default_tags(db)
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to initialize default feeds: {e}")


def assign_default_tags(db: Session) -> None:
    """
    Assign default tags to feeds based on their type and URL.
    Called automatically after feed initialization.
    """
    try:
        # Get tags
        x_tag = db.query(Tag).filter(Tag.name == "X").first()
        ransomware_tag = db.query(Tag).filter(Tag.name == "Ransomware Gang").first()
        
        if not x_tag or not ransomware_tag:
            logger.warning("Tags not found for assignment")
            return
        
        # Get all feeds
        feeds = db.query(Feed).all()
        
        assigned = 0
        for feed in feeds:
            tags_to_add = []
            
            # Assign X tag to nitter.net feeds
            if "nitter.net" in feed.url and x_tag not in feed.tags:
                tags_to_add.append(x_tag)
            
            # Assign Ransomware Gang tag to onion feeds
            if feed.feed_type == FeedType.ONION and ransomware_tag not in feed.tags:
                tags_to_add.append(ransomware_tag)
            
            if tags_to_add:
                feed.tags.extend(tags_to_add)
                assigned += len(tags_to_add)
        
        if assigned > 0:
            db.commit()
            logger.info(f"✅ Assigned {assigned} default tag relationships")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to assign default tags: {e}")


DEFAULT_API_TEMPLATES = [
    {
        "name": "RansomFeed.it",
        "description": "Latest ransomware victims from RansomFeed API",
        "configuration": {
            "endpoint": "https://api.ransomfeed.it/",
            "method": "GET",
            "headers": {
                "User-Agent": "ThreatAlert/1.0"
            },
            "auth": {
                "type": "none"
            },
            "response_format": "json",
            "data_path": "$",
            "field_mapping": {
                "content_fields": ["victim", "gang", "description", "country", "work_sector"],
                "metadata_fields": {
                    "victim_name": "victim",
                    "threat_actor": "gang",
                    "country": "country",
                    "industry": "work_sector",
                    "attack_date": "date",
                    "victim_website": "website"
                }
            },
            "incremental_update": {
                "enabled": True,
                "id_field": "id"
            }
        },
        "is_system": True,
        "enabled": True
    },
    {
        "name": "RansomLook Recent",
        "description": "Recent ransomware posts from RansomLook API",
        "configuration": {
            "endpoint": "https://www.ransomlook.io/api/recent",
            "method": "GET",
            "headers": {
                "User-Agent": "ThreatAlert/1.0"
            },
            "auth": {
                "type": "none"
            },
            "response_format": "json",
            "data_path": "$",
            "field_mapping": {
                "content_fields": ["post_title", "group_name", "discovered"],
                "metadata_fields": {
                    "victim_name": "post_title",
                    "threat_actor": "group_name",
                    "attack_date": "discovered",
                    "victim_website": "post_url"
                }
            },
            "incremental_update": {
                "enabled": False
            }
        },
        "is_system": True,
        "enabled": True
    }
]


def initialize_default_templates(db: Session) -> None:
    """
    Initialize database with default API templates if they don't exist.
    Called automatically on application startup.
    """
    try:
        # Get existing template names
        existing_names = {template.name for template in db.query(APITemplate).all()}
        
        # Add missing default templates
        added = 0
        for template_data in DEFAULT_API_TEMPLATES:
            if template_data["name"] in existing_names:
                continue
            
            template = APITemplate(**template_data)
            db.add(template)
            added += 1
            logger.info(f"Added default API template: {template_data['name']}")
        
        if added > 0:
            db.commit()
            logger.info(f"✅ Initialized {added} default API templates")
        else:
            logger.info(f"All default API templates already exist ({len(existing_names)} total)")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to initialize default API templates: {e}")


def initialize_default_tags(db: Session) -> None:
    """
    Initialize database with default tags if they don't exist.
    Called automatically on application startup.
    """
    try:
        # Get existing tag names
        existing_names = {tag.name for tag in db.query(Tag).all()}
        
        # Add missing default tags
        added = 0
        for tag_data in DEFAULT_TAGS:
            if tag_data["name"] in existing_names:
                continue
            
            tag = Tag(**tag_data)
            db.add(tag)
            added += 1
            logger.info(f"Added default tag: {tag_data['name']}")
        
        if added > 0:
            db.commit()
            logger.info(f"✅ Initialized {added} default tags")
        else:
            logger.info(f"All default tags already exist ({len(existing_names)} total)")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to initialize default tags: {e}")

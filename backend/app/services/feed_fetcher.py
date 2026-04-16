import httpx
import feedparser
import hashlib
import re
from typing import Optional, Dict, Any
from bs4 import BeautifulSoup
from app.config import settings


class FeedFetcher:
    """Base class for fetching different types of feeds"""
    
    @staticmethod
    def get_content_hash(content: str) -> str:
        """Generate hash of content to detect changes"""
        return hashlib.sha256(content.encode()).hexdigest()


class WebsiteFetcher(FeedFetcher):
    """Fetch content from regular websites"""
    
    @staticmethod
    async def fetch(url: str, use_tor: bool = False) -> Dict[str, Any]:
        """Fetch website content"""
        try:
            client_kwargs = {"timeout": 30.0, "follow_redirects": True}
            
            if use_tor:
                # For SOCKS proxies with httpx[socks], use proxy parameter
                # httpx will use socksio under the hood
                client_kwargs["proxy"] = settings.TOR_PROXY
            
            async with httpx.AsyncClient(**client_kwargs) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                # Parse HTML to extract text
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                
                # Get text
                text = soup.get_text()
                
                # Clean up whitespace
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = ' '.join(chunk for chunk in chunks if chunk)
                
                return {
                    "success": True,
                    "content": text,
                    "title": soup.title.string if soup.title else None,
                    "hash": FeedFetcher.get_content_hash(text)
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


class OnionFetcher(FeedFetcher):
    """Fetch content from .onion sites using Tor"""
    
    @staticmethod
    async def fetch(url: str) -> Dict[str, Any]:
        """Fetch onion site content through Tor"""
        return await WebsiteFetcher.fetch(url, use_tor=True)


class RSSFetcher(FeedFetcher):
    """Fetch and parse RSS feeds"""
    
    @staticmethod
    async def fetch(url: str) -> Dict[str, Any]:
        """Fetch RSS feed"""
        try:
            # Use browser-like headers to avoid being blocked by services like Nitter
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "application/rss+xml, application/xml, text/xml, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1"
            }
            
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, headers=headers) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                # Parse RSS feed
                feed = feedparser.parse(response.text)
                
                # Combine all entry titles and descriptions
                content_parts = []
                for entry in feed.entries:
                    title = getattr(entry, 'title', '')
                    description = getattr(entry, 'description', '')
                    content_parts.append(f"{title} {description}")
                
                content = ' '.join(content_parts)
                
                return {
                    "success": True,
                    "content": content,
                    "title": feed.feed.title if hasattr(feed.feed, 'title') else None,
                    "entries": [
                        {
                            "title": getattr(entry, 'title', ''),
                            "link": getattr(entry, 'link', ''),
                            "published": getattr(entry, 'published', '')
                        }
                        for entry in feed.entries
                    ],
                    "hash": FeedFetcher.get_content_hash(content)
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


async def fetch_feed_content(feed_type: str, url: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
    """Main function to fetch content based on feed type"""
    if metadata is None:
        metadata = {}
    
    if feed_type == "website":
        return await WebsiteFetcher.fetch(url)
    elif feed_type == "onion":
        return await OnionFetcher.fetch(url)
    elif feed_type == "rss":
        return await RSSFetcher.fetch(url)
    else:
        return {
            "success": False,
            "error": f"Unknown feed type: {feed_type}"
        }

import httpx
import feedparser
import hashlib
import re
import json
from typing import Optional, Dict, Any, List
from bs4 import BeautifulSoup
from app.config import settings
import logging

logger = logging.getLogger(__name__)


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
                
                logger.debug(f"RSS response for {url}: status={response.status_code}, length={len(response.text)}")
                
                # Parse RSS feed
                feed = feedparser.parse(response.text)
                
                logger.debug(f"Feedparser result for {url}: entries={len(feed.entries)}, bozo={feed.bozo}")
                if feed.bozo and hasattr(feed, 'bozo_exception'):
                    logger.warning(f"Feedparser warning for {url}: {feed.bozo_exception}")
                
                # Combine all entry titles and descriptions
                content_parts = []
                for entry in feed.entries:
                    title = getattr(entry, 'title', '')
                    description = getattr(entry, 'description', '')
                    content_parts.append(f"{title} {description}")
                
                content = ' '.join(content_parts)
                
                logger.info(f"RSS feed {url}: Extracted {len(feed.entries)} entries, content length: {len(content)} chars")
                
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


class APIFetcher(FeedFetcher):
    """Fetch content from REST APIs using configurable templates"""
    
    @staticmethod
    def _extract_data_by_path(data: Any, path: str) -> Any:
        """Extract data using simple path notation ($ for root, supports array index)"""
        if path == "$":
            return data
        
        # Simple path support: $[0].field or $.field
        parts = path.replace("$.", "").replace("$", "").split(".")
        result = data
        
        for part in parts:
            if not part:
                continue
            
            # Handle array index like [0]
            if "[" in part and "]" in part:
                field = part[:part.index("[")]
                index = int(part[part.index("[")+1:part.index("]")])
                if field:
                    result = result.get(field, [])
                result = result[index] if index < len(result) else None
            else:
                if isinstance(result, dict):
                    result = result.get(part)
                else:
                    break
        
        return result
    
    @staticmethod
    async def fetch(url: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fetch API data using configuration from metadata
        metadata contains: endpoint, method, headers, auth, field_mapping, etc.
        """
        try:
            config = metadata.get('configuration', {})
            
            endpoint = config.get('endpoint', url)
            method = config.get('method', 'GET').upper()
            headers = config.get('headers', {})
            auth_config = config.get('auth', {})
            
            # Add authentication if configured
            if auth_config.get('type') == 'bearer' and auth_config.get('token'):
                headers['Authorization'] = f"Bearer {auth_config['token']}"
            elif auth_config.get('type') == 'apikey' and auth_config.get('token'):
                api_key_header = auth_config.get('header_name', 'X-API-Key')
                headers[api_key_header] = auth_config['token']
            
            # Fetch the API
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                if method == 'GET':
                    response = await client.get(endpoint, headers=headers)
                elif method == 'POST':
                    body = config.get('body', {})
                    response = await client.post(endpoint, headers=headers, json=body)
                else:
                    return {
                        "success": False,
                        "error": f"Unsupported HTTP method: {method}"
                    }
                
                response.raise_for_status()
                
                # Parse response
                response_format = config.get('response_format', 'json')
                if response_format == 'json':
                    data = response.json()
                else:
                    # XML support could be added here
                    return {
                        "success": False,
                        "error": f"Unsupported response format: {response_format}"
                    }
                
                # Extract data using path
                data_path = config.get('data_path', '$')
                extracted_data = APIFetcher._extract_data_by_path(data, data_path)
                
                # Ensure it's a list
                if not isinstance(extracted_data, list):
                    extracted_data = [extracted_data] if extracted_data else []
                
                # Map fields and convert to searchable content
                field_mapping = config.get('field_mapping', {})
                content_fields = field_mapping.get('content_fields', [])
                metadata_fields = field_mapping.get('metadata_fields', {})
                
                content_parts = []
                api_metadata_list = []
                
                for item in extracted_data:
                    # Build searchable content from specified fields
                    item_text = []
                    for field in content_fields:
                        value = item.get(field, '')
                        if value:
                            item_text.append(str(value))
                    content_parts.append(' '.join(item_text))
                    
                    # Store structured metadata for each item
                    item_metadata = {}
                    for meta_key, data_key in metadata_fields.items():
                        if data_key in item:
                            item_metadata[meta_key] = item[data_key]
                    api_metadata_list.append(item_metadata)
                
                content = '\n'.join(content_parts)
                
                return {
                    "success": True,
                    "content": content,
                    "hash": FeedFetcher.get_content_hash(content),
                    "raw_data": extracted_data,  # Store raw data
                    "api_metadata": api_metadata_list,  # Store structured metadata
                    "item_count": len(extracted_data)
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"API fetch error: {str(e)}"
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
    elif feed_type == "api":
        return await APIFetcher.fetch(url, metadata)
    else:
        return {
            "success": False,
            "error": f"Unknown feed type: {feed_type}"
        }

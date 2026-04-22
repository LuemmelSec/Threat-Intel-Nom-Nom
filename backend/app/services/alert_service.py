import re
import hashlib
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Feed, Keyword, Alert, Notification, NotificationConfig, AlertType, SuppressedAlert
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# IOC Extractor – auto-extracts CVEs, IPs, domains, hashes, URLs
# ---------------------------------------------------------------------------

class IOCExtractor:
    """Extract Indicators of Compromise from text"""

    CVE_RE = re.compile(r'CVE-\d{4}-\d{4,7}', re.IGNORECASE)
    IPV4_RE = re.compile(
        r'\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}'
        r'(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b'
    )
    MD5_RE = re.compile(r'(?<![a-fA-F0-9])[a-fA-F0-9]{32}(?![a-fA-F0-9])')
    SHA1_RE = re.compile(r'(?<![a-fA-F0-9])[a-fA-F0-9]{40}(?![a-fA-F0-9])')
    SHA256_RE = re.compile(r'(?<![a-fA-F0-9])[a-fA-F0-9]{64}(?![a-fA-F0-9])')
    URL_RE = re.compile(r'https?://[^\s<>\"\')\]]+')
    DOMAIN_RE = re.compile(
        r'\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)'
        r'+(?:com|net|org|io|gov|edu|mil|info|biz|co|us|uk|de|fr|ru|cn|'
        r'xyz|top|onion|cc|me|tv|in|jp|br|au|ca|nl|it|es|se|no|fi|dk|'
        r'pl|cz|sk|hu|ro|bg|hr|si|ua|kz|by|lt|lv|ee|pt|gr|ie|ch|at|be)\b',
        re.IGNORECASE
    )

    # Common false-positive patterns to exclude
    _HASH_EXCLUDE = re.compile(
        r'^0{8,}$|^f{8,}$|^a{8,}$|^1234|^abcd',
        re.IGNORECASE
    )
    _IP_PRIVATE = re.compile(
        r'^(?:10\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.)'
    )

    @staticmethod
    def extract(text: str) -> Dict[str, list]:
        """
        Extract IOCs from text.  Returns a dict with keys only for
        IOC types that were found (empty dict if nothing found).
        """
        iocs: Dict[str, list] = {}

        # CVEs
        cves = sorted(set(IOCExtractor.CVE_RE.findall(text)))
        if cves:
            iocs['cves'] = [c.upper() for c in cves]

        # IPv4 (exclude private/loopback)
        ips = sorted(set(
            ip for ip in IOCExtractor.IPV4_RE.findall(text)
            if not IOCExtractor._IP_PRIVATE.match(ip)
        ))
        if ips:
            iocs['ipv4'] = ips

        # URLs
        urls = sorted(set(IOCExtractor.URL_RE.findall(text)))
        if urls:
            iocs['urls'] = urls[:20]  # cap to avoid noise

        # Domains (exclude those already in URLs)
        url_text = ' '.join(urls)
        domains = sorted(set(
            d.lower() for d in IOCExtractor.DOMAIN_RE.findall(text)
            if d.lower() not in url_text.lower()
            and len(d) > 4  # skip very short matches
        ))
        if domains:
            iocs['domains'] = domains[:20]

        # Hashes (SHA-256 first so shorter patterns don't consume them)
        sha256 = sorted(set(
            h for h in IOCExtractor.SHA256_RE.findall(text)
            if not IOCExtractor._HASH_EXCLUDE.match(h)
        ))
        if sha256:
            iocs['sha256'] = sha256[:10]

        remaining = text
        for h in sha256:
            remaining = remaining.replace(h, '')

        sha1 = sorted(set(
            h for h in IOCExtractor.SHA1_RE.findall(remaining)
            if not IOCExtractor._HASH_EXCLUDE.match(h)
        ))
        if sha1:
            iocs['sha1'] = sha1[:10]

        for h in sha1:
            remaining = remaining.replace(h, '')

        md5 = sorted(set(
            h for h in IOCExtractor.MD5_RE.findall(remaining)
            if not IOCExtractor._HASH_EXCLUDE.match(h)
        ))
        if md5:
            iocs['md5'] = md5[:10]

        return iocs


# ---------------------------------------------------------------------------
# Keyword Matcher
# ---------------------------------------------------------------------------


class KeywordMatcher:
    """Service to match keywords in content"""
    
    @staticmethod
    def find_matches(content: str, keywords: List[Keyword]) -> List[Dict[str, Any]]:
        """
        Find all keyword matches in content
        Returns list of matches with context and context_hash for deduplication
        """
        matches = []
        
        logger.debug(f"Searching for {len(keywords)} keywords in content (length: {len(content)})")
        
        for keyword in keywords:
            if not keyword.enabled:
                continue
            
            keyword_text = keyword.keyword
            
            if keyword.regex_pattern:
                # Use regex pattern
                try:
                    flags = 0 if keyword.case_sensitive else re.IGNORECASE
                    pattern = re.compile(keyword_text, flags)
                    
                    for match in pattern.finditer(content):
                        context = KeywordMatcher._extract_context(content, match.start(), match.end())
                        context_hash = KeywordMatcher._compute_context_hash(content, match.start(), match.end())
                        matches.append({
                            "keyword": keyword,
                            "matched_text": match.group(),
                            "context": context,
                            "context_hash": context_hash,
                            "position": match.start()
                        })
                except re.error as e:
                    # Invalid regex pattern
                    continue
            else:
                # Simple text search
                search_content = content if keyword.case_sensitive else content.lower()
                search_keyword = keyword_text if keyword.case_sensitive else keyword_text.lower()
                
                position = 0
                while True:
                    position = search_content.find(search_keyword, position)
                    if position == -1:
                        break
                    
                    context = KeywordMatcher._extract_context(
                        content, 
                        position, 
                        position + len(search_keyword)
                    )
                    context_hash = KeywordMatcher._compute_context_hash(
                        content,
                        position,
                        position + len(search_keyword)
                    )
                    
                    matches.append({
                        "keyword": keyword,
                        "matched_text": content[position:position + len(search_keyword)],
                        "context": context,
                        "context_hash": context_hash,
                        "position": position
                    })
                    
                    position += len(search_keyword)
        
        return matches
    
    @staticmethod
    def _compute_context_hash(content: str, start: int, end: int, window: int = 100) -> str:
        """Compute a hash of the normalized text around a keyword match.
        
        Uses a tight window (100 chars each side) so that changes elsewhere
        in the feed (e.g. a new RSS item added) don't alter the hash for
        an existing keyword match.  This prevents duplicate alerts when
        overall feed content changes but the specific match context stays
        the same.
        """
        ctx_start = max(0, start - window)
        ctx_end = min(len(content), end + window)
        
        snippet = content[ctx_start:ctx_end]
        # Normalize: lowercase, collapse all whitespace to single space
        normalized = re.sub(r'\s+', ' ', snippet.lower()).strip()
        
        return hashlib.sha256(normalized.encode()).hexdigest()
    
    @staticmethod
    def _extract_context(content: str, start: int, end: int, context_size: int = 200) -> str:
        """Extract context around matched keyword"""
        context_start = max(0, start - context_size)
        context_end = min(len(content), end + context_size)
        
        context = content[context_start:context_end]
        
        # Add ellipsis if truncated
        if context_start > 0:
            context = "..." + context
        if context_end < len(content):
            context = context + "..."
        
        return context


class AlertService:
    """Service to create and manage alerts"""

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    @staticmethod
    def create_alerts(
        db: Session,
        feed: Feed,
        content: str,
        keywords: List[Keyword],
        api_metadata: List[Dict[str, Any]] = None,
        feed_result: Dict[str, Any] = None,
    ) -> List[Alert]:
        """
        Create alerts for matched keywords and queue notifications.

        If the feed is RSS and *feed_result* contains per-entry data we
        match keywords against each RSS item individually so alerts carry
        the article title / link / date as structured metadata and can be
        grouped via *article_hash*.

        For all other feed types (and for RSS feeds without entry data)
        we fall back to matching against the combined content blob.
        """

        # RSS per-item path
        if (
            feed.feed_type.value == 'rss'
            and feed_result
            and feed_result.get('entries')
        ):
            return AlertService._create_rss_alerts(
                db, feed, keywords, feed_result['entries']
            )

        # Generic path (website / onion / api / RSS without entries)
        return AlertService._create_generic_alerts(
            db, feed, content, keywords, api_metadata
        )

    # ------------------------------------------------------------------
    # RSS per-item matching
    # ------------------------------------------------------------------

    @staticmethod
    def _create_rss_alerts(
        db: Session,
        feed: Feed,
        keywords: List[Keyword],
        entries: List[Dict[str, Any]],
    ) -> List[Alert]:
        """Match keywords against each RSS entry individually.
        
        Creates ONE alert per article, aggregating all matched keywords.
        E.g. if an article matches "SharePoint" and "zero-day", one alert
        is created with both keywords listed in matched_keywords.
        """
        created_alerts: List[Alert] = []
        CRIT_ORDER = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}

        for entry in entries:
            entry_content = entry.get('content', '')
            if not entry_content:
                continue

            # Unique identifier for this article
            article_key = entry.get('link') or entry.get('title', '')
            article_hash = hashlib.sha256(
                f"{feed.id}:{article_key}".encode()
            ).hexdigest()

            # Check if we already have an alert for this article on this feed
            existing = db.query(Alert).filter(
                Alert.feed_id == feed.id,
                Alert.article_hash == article_hash,
            ).first()
            if existing:
                logger.debug(
                    f"Skipping article '{entry.get('title', '')[:60]}' "
                    f"on feed {feed.name} — already alerted"
                )
                continue

            # Check if this article was previously deleted (suppressed)
            suppressed = db.query(SuppressedAlert).filter(
                SuppressedAlert.feed_id == feed.id,
                SuppressedAlert.article_hash == article_hash,
            ).first()
            if suppressed:
                logger.debug(
                    f"Skipping suppressed article '{entry.get('title', '')[:60]}' "
                    f"on feed {feed.name}"
                )
                continue

            matches = KeywordMatcher.find_matches(entry_content, keywords)
            if not matches:
                continue

            # Collect unique keywords (first match per keyword)
            seen: Dict[int, Dict] = {}
            for m in matches:
                kid = m['keyword'].id
                if kid not in seen:
                    seen[kid] = m

            # Build aggregated keyword list and pick highest criticality
            keyword_list = []
            best_crit = 'low'
            all_matched_texts = []
            primary_keyword = None

            for kid, match in seen.items():
                kw = match['keyword']
                crit = kw.criticality or 'medium'
                keyword_list.append({
                    'id': kw.id,
                    'keyword': kw.keyword,
                    'matched_text': match['matched_text'],
                    'criticality': crit,
                })
                all_matched_texts.append(match['matched_text'])
                if CRIT_ORDER.get(crit, 2) > CRIT_ORDER.get(best_crit, 2):
                    best_crit = crit
                    primary_keyword = kw
                elif primary_keyword is None:
                    primary_keyword = kw

            # Build structured metadata
            metadata: Dict[str, Any] = {
                'article_title': entry.get('title', ''),
                'article_link': entry.get('link', ''),
                'article_date': entry.get('published', ''),
            }

            # Extract IOCs from the entry content
            iocs = IOCExtractor.extract(entry_content)
            if iocs:
                metadata['iocs'] = iocs

            # Use entire entry content as context for RSS items
            context = entry_content
            if len(context) > 500:
                context = context[:500] + '...'

            # Compute context_hash from the article content for dedup
            normalized = re.sub(r'\s+', ' ', entry_content.lower()).strip()
            context_hash = hashlib.sha256(normalized[:200].encode()).hexdigest()

            alert = Alert(
                feed_id=feed.id,
                keyword_id=primary_keyword.id,
                matched_content=', '.join(all_matched_texts),
                context=context,
                context_hash=context_hash,
                article_hash=article_hash,
                matched_keywords=keyword_list,
                api_metadata=metadata,
                criticality=best_crit,
                triggered_at=datetime.utcnow(),
                read=False,
            )
            db.add(alert)
            db.flush()

            AlertService._queue_notifications(db, alert)
            created_alerts.append(alert)

        db.commit()
        logger.info(
            f"RSS per-item scan for feed {feed.name}: "
            f"{len(entries)} entries → {len(created_alerts)} new alerts"
        )
        return created_alerts

    # ------------------------------------------------------------------
    # Generic (non-RSS) matching
    # ------------------------------------------------------------------

    @staticmethod
    def _create_generic_alerts(
        db: Session,
        feed: Feed,
        content: str,
        keywords: List[Keyword],
        api_metadata: List[Dict[str, Any]] = None,
    ) -> List[Alert]:
        """Original matching logic for website / onion / API feeds."""
        matches = KeywordMatcher.find_matches(content, keywords)
        created_alerts: List[Alert] = []

        logger.info(f"Found {len(matches)} keyword matches for feed {feed.name}")

        # Dedup: one alert per keyword per feed (first match only)
        seen: Dict[int, Dict] = {}
        for match in matches:
            kid = match['keyword'].id
            if kid not in seen:
                seen[kid] = match

        for keyword_id, match in seen.items():
            context_hash = match['context_hash']

            existing = db.query(Alert).filter(
                Alert.feed_id == feed.id,
                Alert.keyword_id == keyword_id,
                Alert.context_hash == context_hash,
            ).first()
            if existing:
                logger.debug(
                    f"Skipping duplicate alert for '{match['keyword'].keyword}' "
                    f"on feed {feed.name} — same context already alerted"
                )
                continue

            # Check if this match was previously deleted (suppressed)
            suppressed = db.query(SuppressedAlert).filter(
                SuppressedAlert.feed_id == feed.id,
                SuppressedAlert.keyword_id == keyword_id,
                SuppressedAlert.context_hash == context_hash,
            ).first()
            if suppressed:
                logger.debug(
                    f"Skipping suppressed alert for '{match['keyword'].keyword}' "
                    f"on feed {feed.name}"
                )
                continue

            # Find matching API metadata
            alert_metadata: Dict[str, Any] = {}
            if api_metadata:
                matched_text = match['matched_text']
                for item_meta in api_metadata:
                    for value in item_meta.values():
                        if matched_text.lower() in str(value).lower():
                            alert_metadata = item_meta
                            break
                    if alert_metadata:
                        break

            # Extract IOCs from the context
            iocs = IOCExtractor.extract(match['context'])
            if iocs:
                alert_metadata['iocs'] = iocs

            alert = Alert(
                feed_id=feed.id,
                keyword_id=match['keyword'].id,
                matched_content=match['matched_text'],
                context=match['context'],
                context_hash=context_hash,
                api_metadata=alert_metadata,
                criticality=match['keyword'].criticality,
                triggered_at=datetime.utcnow(),
                read=False,
            )
            db.add(alert)
            db.flush()

            AlertService._queue_notifications(db, alert)
            created_alerts.append(alert)

        db.commit()
        return created_alerts

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _queue_notifications(db: Session, alert: Alert):
        """Create pending notification records for an alert."""
        configs = db.query(NotificationConfig).filter(
            NotificationConfig.enabled == True
        ).all()
        for config in configs:
            db.add(Notification(
                alert_id=alert.id,
                notification_type=config.notification_type,
                destination=config.destination,
                sent=False,
            ))
    
    @staticmethod
    def mark_as_read(db: Session, alert_id: int) -> bool:
        """Mark alert as read"""
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.read = True
            db.commit()
            return True
        return False
    
    @staticmethod
    def mark_as_unread(db: Session, alert_id: int) -> bool:
        """Mark alert as unread"""
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.read = False
            db.commit()
            return True
        return False
    
    @staticmethod
    def mark_all_as_read(db: Session) -> int:
        """Mark all alerts as read, returns count of affected alerts"""
        count = db.query(Alert).filter(Alert.read == False).update({"read": True})
        db.commit()
        return count

# Threat Intel Nom Nom - Project Overview

## Introduction

Threat Intel Nom Nom is a comprehensive, enterprise-grade threat intelligence monitoring and alerting platform designed for security operations centers, security researchers, and threat intelligence analysts. The platform aggregates intelligence from multiple sources including public security feeds, RSS sources, dark web forums, and API endpoints, enabling automated threat detection and real-time alerting based on customizable keywords and criticality levels.

## Core Architecture

### Technology Stack

**Backend:**
- FastAPI (Python 3.11) - High-performance async web framework
- SQLAlchemy - Database ORM with PostgreSQL support
- Celery 5.3 - Distributed task queue for background processing
- Celery Beat - Periodic task scheduler for automated feed checks
- Redis - Message broker and result backend
- Tor Proxy - SOCKS5 proxy for accessing .onion domains

**Frontend:**
- React 18 - Modern UI framework with hooks
- Material-UI 5 (MUI) - Comprehensive component library
- Recharts - Data visualization and analytics charts
- Axios - HTTP client for API communication

**Infrastructure:**
- Docker Compose - Multi-container orchestration
- PostgreSQL 15 - Relational database with timezone support
- Nginx-capable reverse proxy ready

### Microservices Architecture

The platform consists of 7 containerized services:

1. **PostgreSQL Database** - Primary data store for feeds, keywords, alerts, and metadata
2. **Redis** - Message broker for Celery task queue
3. **Tor Proxy** - SOCKS5 proxy server for dark web access
4. **Backend API** - FastAPI application server
5. **Celery Worker** - Background task processor with configurable concurrency
6. **Celery Beat** - Scheduler for periodic feed checks
7. **Frontend** - React SPA served via development server or production build

## Feature Set

### 1. Multi-Source Feed Management

**Feed Types:**
- **API Feeds** - RESTful API endpoints with template-based extraction
- **RSS Feeds** - Standard RSS/Atom feed parsers with XML support
- **Website Feeds** - HTML scraping with content change detection
- **Onion Feeds** - Dark web .onion sites via Tor SOCKS5 proxy

**Feed Capabilities:**
- Configurable fetch intervals (minimum 60 seconds)
- Manual trigger for immediate checks
- SHA256 content hash for change detection
- Consecutive failure tracking for health monitoring
- Enable/disable without deletion
- Per-feed metadata storage

**Feed Health Monitoring:**
- Status indicators: Healthy, Warning, Error, Disabled
- Consecutive failure counters
- Last error message logging
- Last fetch timestamp tracking
- Health ratio calculation for dashboard metrics

### 2. API Template System

**Purpose:**
Enable structured data extraction from JSON API endpoints without custom code.

**Capabilities:**
- JSONPath-based field extraction
- Support for pagination and nested responses
- Optional API key authentication with custom headers
- Reusable templates for multiple feeds
- Default templates: Ransomfeed.it, RansomLook

**Template Components:**
- Field mapping: title, description, date, url, source
- JSONPath expressions for nested JSON navigation
- API key storage and header configuration
- Template validation and testing

### 3. Keyword Matching & Alert Generation

**Keyword Features:**
- Simple text matching or regex patterns
- Case-sensitive/insensitive matching
- Four criticality levels: Low, Medium, High, Critical
- Enable/disable per keyword
- Automatic check against historical feed content
- Smart detection based on keyword creation time vs feed last check

**Alert System:**
- Automatic alert generation on keyword match
- Content snippet extraction with matched keywords
- Metadata storage: source feed, matched keyword, criticality
- Deduplication using content hash (1-hour window)
- Read/unread status tracking
- Bulk operations support

**Alert Metadata:**
- For API feeds: Full structured data from API response
- For RSS/Website: Raw content extraction
- Timestamp of detection
- Source feed reference
- Matched keyword reference

### 4. Tagging System

**Tag Organization:**
- Many-to-many relationships with feeds, keywords, and alerts
- Custom colors for visual organization
- Optional descriptions
- Full CRUD operations
- Tag assignment/removal APIs

**Tag Usage:**
- Organize feeds by category (Ransomware Gang, X/Twitter, etc.)
- Group keywords by threat type
- Categorize alerts for filtering
- Sortable and filterable in all tables

**Default Tags:**
- X (Twitter feeds)
- Ransomware Gang (dark web sources)

### 5. Notification System

**Notification Channels:**
- Email via SMTP
- Webhooks (generic HTTP POST)
- Discord webhooks
- Extensible architecture for future integrations

**Configuration:**
- Multiple notification destinations
- Enable/disable per configuration
- Automatic delivery for new alerts
- Configurable per criticality level (future enhancement)

### 6. Dashboard & Analytics

**Dashboard Components:**
- Statistics tiles: Total feeds, alerts, keywords, unread alerts
- Healthy feeds ratio (feeds with 0 consecutive failures)
- Criticality distribution pie chart (interactive)
- Recent alerts feed (last 5 alerts)
- Real-time updates (30-second refresh)
- Clickable navigation to filtered views

**Analytics Capabilities:**
- Alert trends over time
- Top matched keywords
- Feed activity metrics
- Health status distribution

### 7. Feed Health Monitoring

**Logs Page Features:**
- Comprehensive feed status overview
- Sortable and filterable DataGrid
- Consecutive failure tracking
- Error message display
- Last fetch timestamps
- Status color indicators

**Health States:**
- Healthy: Enabled + 0 consecutive failures (green)
- Warning: 1-2 consecutive failures (orange)
- Error: 3+ consecutive failures (red)
- Disabled: Manually disabled (gray)

### 8. Settings & Maintenance

**Alert Cleanup:**
- Automated deletion of old alerts
- Configurable retention period (days)
- Preview cutoff date before deletion
- Irreversible operation with confirmation

**System Settings:**
- Centralized configuration interface
- Future: Celery concurrency adjustment
- Future: Default fetch intervals
- Future: API rate limiting

## Default Baseline Configuration

### Default Feeds (20 Total)

**API Feeds (2):**
1. Ransomfeed.it - Ransomware intelligence aggregator
2. RansomLook API Recent - Ransomware victim tracking

**RSS Feeds (11):**
3. Bleeping Computer Security - Technology news and security
4. CISA Advisories - US Government cybersecurity alerts
5. Dark Reading - Enterprise security news
6. Dark Web Informer RSS - Threat intelligence updates
7. Hackmanac RSS - Security researcher feed
8. HaveIBeenPwned Breach Feed - Data breach notifications
9. Krebs on Security - Investigative security journalism
10. LuemmelSec RSS - Security researcher feed
11. Security Affairs - Cybersecurity news and analysis
12. The Hacker News - Security news and vulnerabilities
13. Threat Post - Kaspersky security news

**Website Feeds (2):**
14. Dark Web Informer - Dark web monitoring website
15. Ransomware.live - Live ransomware tracking

**Onion Feeds (5):**
16. Coinbasecartel - Ransomware gang leak site
17. DragonForce - Ransomware gang leak site
18. LockBit - Ransomware gang leak site
19. Qilin - Ransomware gang leak site
20. ShadowByt3$ LEAKS - Ransomware gang leak site

### Default Tags (2 Total)

1. **X** - Twitter/X feed sources (color: #000000)
2. **Ransomware Gang** - Dark web ransomware actor sites (color: #540ed8)

## Technical Implementation Details

### Backend API Structure

**Endpoints:**
```
/api/feeds/          - Feed CRUD operations
/api/keywords/       - Keyword CRUD operations
/api/alerts/         - Alert management and filtering
/api/tags/           - Tag management and assignment
/api/templates/      - API template CRUD
/api/notifications/  - Notification configuration
/api/stats/          - Dashboard statistics
/api/logs/health     - System health overview
```

**Database Schema:**
- feeds: Feed definitions and metadata
- keywords: Keyword patterns and settings
- alerts: Generated alerts with metadata
- tags: Tag definitions
- api_templates: API extraction templates
- notification_configs: Notification destinations
- Association tables: feed_tags, keyword_tags, alert_tags

### Background Processing

**Celery Tasks:**
- `check_feed(feed_id)` - Fetch and process single feed
- `schedule_feed_checks()` - Enqueue checks for all enabled feeds
- `send_notification(alert_id, config_id)` - Deliver notifications

**Celery Beat Schedule:**
- Feed checks: Dynamic based on per-feed fetch_interval
- Minimum interval: 60 seconds
- Default interval: 3600 seconds (1 hour)

**Processing Flow:**
1. Celery Beat triggers scheduled check
2. Worker fetches feed content (RSS/API/Website/Onion)
3. For API feeds: Apply template to extract structured data
4. Calculate content hash, compare with previous
5. If changed: Extract text, check all enabled keywords
6. On match: Create alert with metadata
7. Deduplicate using content hash + 1-hour window
8. Trigger notifications for new alerts
9. Update feed health status

### Frontend Architecture

**Pages:**
- Dashboard - Analytics and overview
- Feeds - Feed management with DataGrid
- Keywords - Keyword management with DataGrid
- Alerts - Alert viewing with filtering
- Tags - Tag management with color picker
- API Templates - Template editor and tester
- Notifications - Notification configuration
- Logs - Feed health monitoring
- Settings - Alert cleanup and configuration

**Components:**
- Navigation - App navigation with cookie icon
- TagSelector - Autocomplete tag assignment
- TagDisplay - Colored tag chips
- FeedDialog - Feed create/edit form
- KeywordDialog - Keyword create/edit form
- AlertDetailsDialog - Full alert content viewer

**State Management:**
- React hooks (useState, useEffect)
- Local component state
- Polling for real-time updates
- API error handling with Snackbar notifications

### Security Considerations

**Implemented:**
- CORS configuration for frontend origins
- Environment variable isolation (.env)
- Docker network isolation
- Input validation on API endpoints
- SQL injection prevention via SQLAlchemy ORM
- XSS prevention via React automatic escaping

**Production Recommendations:**
- Implement authentication (OAuth2/JWT)
- Use HTTPS with reverse proxy
- Rotate database credentials regularly
- Implement API rate limiting
- Add request logging and audit trails
- Sanitize webhook URLs
- Validate .onion URL access legality

## Deployment

### Development Deployment

```bash
# Clone repository
git clone <repository-url>
cd Threat-Intel-Nom-Nom

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Set POSTGRES_PASSWORD, SECRET_KEY, CORS_ORIGINS

# Build and start all services
docker compose up -d --build

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Production Deployment

**Prerequisites:**
- Docker and Docker Compose installed
- HTTPS reverse proxy (nginx, Caddy, Traefik)
- Valid SSL certificates
- Firewall configured

**Steps:**
1. Generate secure SECRET_KEY: `openssl rand -hex 32`
2. Set strong POSTGRES_PASSWORD (16+ characters)
3. Configure CORS_ORIGINS with production domain
4. Set REACT_APP_API_BASE_URL to production API URL
5. Build frontend with production optimizations
6. Deploy with `docker compose -f docker-compose.prod.yml up -d`
7. Configure reverse proxy with SSL
8. Implement authentication layer
9. Set up automated backups
10. Configure monitoring and alerting

### Remote Access Configuration

**Backend CORS:**
Edit `backend/app/config.py`:
```python
CORS_ORIGINS: list = ["http://YOUR_SERVER_IP:3000"]
```

**Frontend API URL:**
Edit `.env`:
```env
REACT_APP_API_BASE_URL=http://YOUR_SERVER_IP:8000
```

**Rebuild:**
```bash
docker compose up -d --build frontend
```

## Performance Optimization

### Celery Worker Tuning

**Concurrency Settings:**
- Low traffic: 2 workers
- Medium traffic: 4 workers
- High traffic: 8+ workers

Edit `docker-compose.yml`:
```yaml
celery_worker:
  command: celery -A app.tasks.celery_app worker --concurrency=8
```

### Feed Interval Recommendations

- RSS feeds: 300-600 seconds (5-10 minutes)
- Website feeds: 600-1800 seconds (10-30 minutes)
- API feeds: 3600 seconds (1 hour)
- Onion feeds: 1800-3600 seconds (30-60 minutes, Tor latency)

### Database Optimization

- Run alert cleanup regularly (Settings page)
- Monitor database size and disk usage
- Consider archiving old alerts to separate table
- PostgreSQL automatic index maintenance enabled
- Connection pooling configured via SQLAlchemy

## Operational Procedures

### Backup Procedures

**Database Backup:**
```bash
docker compose exec postgres pg_dump -U darkweb darkweb_db > backup_$(date +%Y%m%d).sql
```

**Database Restore:**
```bash
cat backup_20260417.sql | docker compose exec -T postgres psql -U darkweb darkweb_db
```

**Volume Backup:**
```bash
docker run --rm -v darkwebalert_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data
```

### Monitoring

**Log Viewing:**
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f celery_worker
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 celery_worker
```

**Service Status:**
```bash
# Container status
docker compose ps

# Resource usage
docker stats
```

**Health Checks:**
- Dashboard: Verify healthy feeds ratio
- Logs page: Check for consecutive failures
- Backend: `curl http://localhost:8000/api/stats/`

### Troubleshooting

**Feeds Not Updating:**
1. Check feed enabled status
2. Verify fetch interval elapsed
3. Review Logs page for errors
4. Check Celery worker logs
5. Manual trigger test

**Alerts Not Generated:**
1. Verify keywords enabled
2. Test keyword pattern (regex)
3. Check case sensitivity settings
4. Review Celery worker logs
5. Verify deduplication isn't blocking

**Onion Sites Failing:**
1. Check Tor container: `docker compose ps tor`
2. Restart Tor: `docker compose restart tor`
3. Verify .onion URL validity
4. Check connection timeout settings

**High Memory Usage:**
1. Reduce Celery concurrency
2. Increase feed intervals
3. Run alert cleanup
4. Check for feed processing errors

## Development Roadmap

### Completed Features
- Multi-source feed monitoring (API, RSS, Website, Onion)
- API template system with JSONPath extraction
- Keyword matching with regex support
- Four-tier alert criticality system
- Tag organization for feeds/keywords/alerts
- Dashboard analytics with pie charts
- Feed health monitoring and error tracking
- Notification system (Email, Webhook, Discord)
- Alert cleanup and retention management
- Docker containerization with 7 microservices
- Baseline configuration with 20 default feeds

### Future Enhancements
- User authentication and authorization (OAuth2/JWT)
- Role-based access control (Admin, Analyst, Viewer)
- Alert enrichment with OSINT APIs (VirusTotal, Shodan, etc.)
- Machine learning for alert prioritization
- Custom alert aggregation rules
- Scheduled reports via email
- Alert exports (CSV, JSON, PDF)
- API rate limiting and quotas
- Webhook signature verification
- Feed import/export functionality
- Custom dashboard widgets
- Mobile-responsive UI improvements
- Alert correlation and deduplication improvements
- Integration with SIEM platforms
- Threat actor tracking and profiling
- IOC extraction and management
- Timeline visualization for alerts
- Advanced search with query language
- Saved searches and filters
- Alert comments and collaboration
- Bulk feed management operations

## Use Cases

### Security Operations Center (SOC)
- Monitor multiple threat intelligence sources in one platform
- Automatically detect mentions of organization name or assets
- Triage alerts by criticality level
- Track ransomware gang activity and victims
- Stay informed on latest CVEs and vulnerabilities

### Threat Intelligence Analyst
- Aggregate dark web forum activity
- Track specific threat actors and campaigns
- Monitor underground marketplaces
- Correlate intelligence from multiple sources
- Generate reports on emerging threats

### Security Researcher
- Monitor security blogs and RSS feeds
- Track vulnerability disclosures
- Identify trending attack techniques
- Research ransomware gang operations
- Analyze leak site activity

### Incident Response Team
- Receive real-time alerts on data breaches
- Monitor for organization mentions on dark web
- Track threat actor communications
- Identify potential indicators of compromise
- Coordinate response activities

## Compliance and Legal Considerations

**Data Privacy:**
- Platform stores only public intelligence data
- No PII collection from monitored sources
- User responsible for data retention policies

**Dark Web Monitoring:**
- .onion site access may be restricted in some jurisdictions
- Users responsible for ensuring legal compliance
- Monitor only publicly accessible sites
- Do not engage with threat actors

**Ethical Use:**
- Platform intended for defensive security purposes only
- Do not use for illegal activities
- Obtain proper authorization before monitoring
- Respect intellectual property and copyright
- Follow responsible disclosure practices

## License

This project is provided as-is for educational and security research purposes.

## Disclaimer

Threat Intel Nom Nom is intended for legitimate security monitoring and threat intelligence purposes only. Users are responsible for ensuring compliance with all applicable laws and regulations in their jurisdiction. The developers assume no liability for misuse of this software. Always obtain proper authorization before monitoring any systems or sources.

---

**Project Status:** Production Ready  
**Version:** 1.0  
**Last Updated:** April 2026  
**Maintainer:** Security Operations Team

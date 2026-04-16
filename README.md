# Threat Alert

A comprehensive threat intelligence monitoring platform for tracking security feeds, dark web sources, CVE databases, and threat intelligence sources. The system automatically monitors multiple sources and generates alerts based on custom keywords with configurable criticality levels.

## Features

### Feed Monitoring
- **Multiple Feed Types**: Regular websites, onion sites (via Tor), and RSS feeds
- **Automatic Initialization**: 10 curated cybersecurity feeds included by default (CISA advisories, CVE databases, HaveIBeenPwned, security blogs)
- **Configurable Intervals**: Set custom fetch intervals per feed (minimum 60 seconds)
- **Manual Triggering**: Force immediate feed checks from the UI
- **Content Change Detection**: SHA256 hash-based detection to avoid redundant processing
- **SOCKS5 Proxy Support**: Built-in Tor integration for accessing .onion sites

### Keyword & Alert Management
- **Flexible Matching**: Simple text matching or regex pattern support
- **Case Sensitivity**: Toggle case-sensitive matching per keyword
- **Criticality Levels**: Four levels (Low, Medium, High, Critical) with color coding
- **Smart Detection**: New keywords automatically checked against existing feed content
- **Deduplication**: Prevents duplicate alerts using content hash and 1-hour time window
- **Enable/Disable**: Toggle keywords and feeds without deletion

### Dashboard & Analytics
- **Visual Overview**: Pie charts showing alert distribution by criticality
- **Clickable Tiles**: Navigate to filtered views (unread alerts, critical alerts, etc.)
- **Recent Activity**: Latest 5 alerts feed with quick navigation
- **Feed Health Status**: Monitor feed activity and last check times
- **Real-time Updates**: Dashboard refreshes every 30 seconds

### System Health & Monitoring
- **Logs Page**: Comprehensive view of feed health status
- **Error Tracking**: Tracks consecutive failures, last error messages, and timestamps
- **Status Indicators**: Healthy (green), Warning (orange), Error (red), Disabled (gray)
- **Feed Diagnostics**: View detailed error information for troubleshooting

### Alert Cleanup
- **Automated Cleanup**: Delete alerts older than specified days
- **Settings Page**: Centralized configuration interface
- **Preview**: See cutoff date before deletion

### Notifications
- **Multiple Channels**: Email, webhooks, Discord integration
- **Configurable Destinations**: Set up multiple notification endpoints
- **Per-Alert Delivery**: Automatic notification sending for new alerts

## Architecture

The platform consists of the following components:

- **Frontend**: React 18 with Material-UI 5, Recharts for data visualization
- **Backend**: FastAPI (Python 3.11) with SQLAlchemy ORM
- **Database**: PostgreSQL 15 with timezone support
- **Task Queue**: Celery 5.3 with Redis broker for background processing
- **Scheduler**: Celery Beat for periodic feed checks
- **Proxy**: Tor with SOCKS5 support for .onion site access
- **Containerization**: Docker Compose with 7 microservices

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Optional: SMTP server credentials for email notifications

## Quick Start

### Automated Setup (Recommended)

The project includes setup scripts that automate the initial configuration:

**Linux/macOS:**
```bash
cd /path/to/project
chmod +x setup.sh
./setup.sh
```

**Windows (PowerShell):**
```powershell
cd C:\path\to\project
.\setup.ps1
```

The setup script will:
- Verify Docker installation
- Create `.env` file from template (if not exists)
- Prompt to build and start containers
- Guide you through initial configuration

### Manual Setup

If you prefer manual setup or need more control:

1. Navigate to the project directory:
   ```bash
   cd /path/to/project
   ```

2. Create environment file from template:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and configure required settings:
   - `POSTGRES_PASSWORD`: Secure database password
   - `SECRET_KEY`: Generate a secure random string
   - `CORS_ORIGINS`: Add your frontend URL
   - Optional: Configure SMTP settings for email notifications

4. Build and start all containers:
   ```bash
   docker compose up -d --build
   ```

5. Wait for services to initialize (approximately 30 seconds)

6. Access the application:
   - **Frontend UI**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

### Default Configuration

The system automatically initializes with 10 curated cybersecurity feeds on first startup:
- CISA Known Exploited Vulnerabilities
- CISA Security Advisories
- US-CERT Alerts
- CVE Recent Entries
- NVD Recent CVEs
- HaveIBeenPwned Breach Feed
- Krebs on Security Blog
- Bleeping Computer Feed
- The Hacker News
- Dark Reading Feed

## Configuration

## Configuration

### Network Configuration for Remote Access

If accessing the application from a different machine:

1. Update backend CORS in `backend/app/config.py`:
   ```python
   CORS_ORIGINS: list = ["http://localhost:3000", "http://YOUR_SERVER_IP:3000"]
   ```

2. Update frontend API URL in `.env`:
   ```env
   REACT_APP_API_URL=http://YOUR_SERVER_IP:8000
   ```

3. Rebuild the frontend container:
   ```bash
   docker compose up -d --build frontend
   ```

### Email Notifications

Configure SMTP settings in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=alerts@threatalert.local
```

Note: For Gmail, generate an App Password from your Google Account settings.

### Discord Webhooks

1. Create a webhook in your Discord server settings
2. Add notification configuration with type "Discord"
3. Set the webhook URL as the destination

## Usage Guide

## Usage Guide

### Managing Feeds

**Adding a Feed:**
1. Navigate to the Feeds page
2. Click "Add Feed" button
3. Configure feed properties:
   - **Name**: Descriptive name for the feed
   - **Type**: website, onion, or rss
   - **URL**: Feed URL or .onion address
   - **Fetch Interval**: Seconds between checks (minimum 60)
   - **Enabled**: Toggle to activate/deactivate
4. Click "Create"

**Editing a Feed:**
- Click the edit icon next to any feed
- Modify properties including type and URL
- Changes take effect on next fetch

**Manual Feed Check:**
- Click the play icon to trigger immediate fetch
- Useful for testing or forcing updates

### Managing Keywords

**Adding a Keyword:**
1. Navigate to the Keywords page
2. Click "Add Keyword"
3. Configure keyword properties:
   - **Keyword**: Text string or regex pattern
   - **Criticality**: Low, Medium, High, or Critical
   - **Case Sensitive**: Toggle for exact case matching
   - **Regex Pattern**: Enable for regex matching
   - **Enabled**: Toggle to activate/deactivate
4. Click "Create"

**Smart Keyword Detection:**
- New keywords are automatically checked against existing feed content
- No need to wait for feed updates to detect matches
- System tracks keyword creation time vs. feed last check time

**Criticality Levels:**
- **Low** (Blue): Informational alerts
- **Medium** (Orange): Standard security events
- **High** (Red): Important security incidents
- **Critical** (Purple): Urgent threats requiring immediate attention

### Viewing Alerts

**Dashboard:**
- Click stat tiles to navigate to filtered alerts
- Click pie chart segments to filter by criticality
- View latest 5 alerts with quick access

**Alerts Page:**
- All alerts displayed in sortable table
- Filter by status (read/unread) or criticality level
- Mark alerts as read/unread individually or in bulk
- Delete alerts individually
- Click alert to view full matched content and context

### System Health Monitoring

**Logs Page:**
- View overall system health status
- Monitor feed health: Healthy, Warning, Error, Disabled
- Track consecutive failures per feed
- View last error messages and timestamps
- Identify problematic feeds requiring attention

**Status Indicators:**
- **Healthy** (Green): Feed operating normally, 0 failures
- **Warning** (Orange): 1-2 consecutive failures
- **Error** (Red): 3 or more consecutive failures
- **Disabled** (Gray): Feed manually disabled

### Settings & Maintenance

**Alert Cleanup:**
1. Navigate to Settings page
2. Specify number of days to retain alerts
3. System shows cutoff date preview
4. Confirm deletion to remove old alerts

### Setting Up Notifications

1. Navigate to Notifications page
2. Click "Add Configuration"
3. Configure notification settings:
   - **Name**: Identifier for the notification
   - **Type**: email, webhook, or discord
   - **Destination**: Email address or webhook URL
   - **Enabled**: Toggle to activate/deactivate
4. Click "Create"

Notifications are automatically sent for all new alerts when enabled.

## API Documentation

## API Documentation

Interactive API documentation available at: http://localhost:8000/docs

### Key Endpoints

**Feeds:**
- `GET /api/feeds/` - List all feeds
- `POST /api/feeds/` - Create new feed
- `PUT /api/feeds/{id}` - Update feed
- `DELETE /api/feeds/{id}` - Delete feed
- `POST /api/feeds/{id}/check` - Trigger manual feed check

**Keywords:**
- `GET /api/keywords/` - List all keywords
- `POST /api/keywords/` - Create new keyword
- `PUT /api/keywords/{id}` - Update keyword
- `DELETE /api/keywords/{id}` - Delete keyword

**Alerts:**
- `GET /api/alerts/` - List all alerts (supports filtering)
- `PUT /api/alerts/{id}/read` - Mark alert as read
- `PUT /api/alerts/{id}/unread` - Mark alert as unread
- `DELETE /api/alerts/{id}` - Delete alert
- `DELETE /api/alerts/cleanup?days={n}` - Delete alerts older than n days

**System Health:**
- `GET /api/logs/health` - System health overview
- `GET /api/logs/feed-errors` - Feed error details

**Statistics:**
- `GET /api/stats/` - Dashboard statistics

## Docker Services

The platform runs the following containerized services:

| Service | Description | Port |
|---------|-------------|------|
| postgres | PostgreSQL 15 database | 5432 (internal) |
| redis | Redis message broker | 6379 (internal) |
| tor | Tor SOCKS5 proxy | 9050 (internal) |
| backend | FastAPI application server | 8000 |
| celery_worker | Background task worker | - |
| celery_beat | Task scheduler | - |
| frontend | React web interface | 3000 |

## Monitoring & Logs

### Viewing Container Logs

View logs for a specific service:
```bash
docker compose logs -f backend
docker compose logs -f celery_worker
docker compose logs -f celery_beat
```

View all logs:
```bash
docker compose logs -f
```

View last 100 lines:
```bash
docker compose logs --tail=100 celery_worker
```

### Checking Service Status

List running containers:
```bash
docker compose ps
```

Check resource usage:
```bash
docker stats
```

## Troubleshooting

## Troubleshooting

### Feeds Not Updating

1. Verify feed is enabled in the Feeds page
2. Check if fetch interval has elapsed
3. Review feed status in the Logs page
4. Check Celery worker logs: `docker compose logs -f celery_worker`
5. Trigger manual feed check to test immediately
6. For .onion sites, verify Tor container is running

### Alerts Not Generated

1. Verify keywords are enabled
2. Check criticality level is set
3. Confirm keywords match feed content (case sensitivity)
3. Review Celery worker logs for keyword matching activity
4. Check if alert was deduplicated (check within last hour)
5. Manually trigger feed to test keyword matching

### Email Notifications Failing

1. Verify SMTP credentials in `.env` file
2. For Gmail, ensure App Password is used (not account password)
3. Check backend logs for SMTP error messages
4. Test SMTP connection from backend container
5. Verify notification configuration is enabled

### Onion Sites Not Accessible

1. Check Tor container status: `docker compose ps tor`
2. Restart Tor service: `docker compose restart tor`
3. Verify .onion URL is valid and accessible
4. Check feed error in Logs page for specific error messages
5. Review backend logs for SOCKS proxy errors

### Database Connection Errors

1. Check PostgreSQL container status: `docker compose ps postgres`
2. Verify database credentials in `.env`
3. Restart all services: `docker compose restart`
4. If persistent, recreate containers:
   ```bash
   docker compose down
   docker compose up -d --build
   ```

### High Memory Usage

1. Reduce Celery worker concurrency in `docker-compose.yml`
2. Increase feed fetch intervals to reduce processing frequency
3. Run alert cleanup to remove old alerts
4. Optimize regex keywords (simple text matching is faster)

### Container Won't Start

1. Check logs for specific error: `docker compose logs <service>`
2. Verify all required environment variables in `.env`
3. Ensure ports 3000 and 8000 are not in use
4. Rebuild containers: `docker compose up -d --build`
5. Check Docker daemon is running and has sufficient resources

## Development

### Backend Development

Backend code is mounted as a volume with auto-reload enabled.

Access backend container:
```bash
docker compose exec backend bash
```

Run Python scripts:
```bash
docker compose exec backend python /app/script.py
```

### Frontend Development

Frontend code is mounted with hot-reload enabled.

Access frontend container:
```bash
docker compose exec frontend sh
```

Install new packages:
```bash
docker compose exec frontend npm install <package-name>
```

Rebuild frontend:
```bash
docker compose up -d --build frontend
```

### Database Migrations

The system uses SQLAlchemy models with automatic table creation. For schema changes:

1. Update models in `backend/app/models/models.py`
2. Restart backend to apply changes: `docker compose restart backend`
3. For complex migrations, create migration script and run via backend container

## Security Considerations

### Production Deployment

- **Change all default credentials** in `.env` before deployment
- **Use strong passwords** for database (minimum 16 characters)
- **Generate secure SECRET_KEY** (use: `openssl rand -hex 32`)
- **Implement HTTPS** using reverse proxy (nginx, Caddy, Traefik)
- **Add authentication** to frontend (implement OAuth2 or JWT)
- **Restrict CORS origins** to specific domains
- **Firewall configuration**: Only expose necessary ports
- **Regular backups**: Implement automated database backups
- **Update dependencies**: Regularly update Docker images and packages

### Operational Security

- **Validate webhook URLs** before adding notification configurations
- **Sanitize inputs**: System includes input validation, but review custom modifications
- **Monitor .onion access**: Understand legal implications in your jurisdiction
- **Limit feed sources**: Only monitor legitimate security sources
- **Review logs regularly**: Check Logs page for suspicious activity
- **Rotate credentials**: Periodically update database and API credentials

## Data Persistence

### Database Backups

Backup PostgreSQL database:
```bash
docker compose exec postgres pg_dump -U darkweb darkweb_db > backup_$(date +%Y%m%d).sql
```

Restore from backup:
```bash
cat backup_20260416.sql | docker compose exec -T postgres psql -U darkweb darkweb_db
```

Automated backup script:
```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec postgres pg_dump -U darkweb darkweb_db > "$BACKUP_DIR/backup_$DATE.sql"
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +30 -delete  # Keep 30 days
```

### Volume Management

List volumes:
```bash
docker volume ls
```

Backup volume:
```bash
docker run --rm -v darkwebalert_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data
```

Restore volume:
```bash
docker run --rm -v darkwebalert_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_data.tar.gz -C /
```

## Performance Tuning

### Celery Worker Optimization

Adjust concurrency in `docker-compose.yml`:
```yaml
celery_worker:
  command: celery -A app.tasks.celery_app worker --concurrency=4 --loglevel=info
```

Recommendations:
- **Low traffic**: 2 concurrent workers
- **Medium traffic**: 4 concurrent workers
- **High traffic**: 8+ concurrent workers

### Feed Optimization

- **Fetch intervals**: Balance between freshness and load
  - RSS feeds: 300-600 seconds (5-10 minutes)
  - Websites: 600-1800 seconds (10-30 minutes)
  - .onion sites: 1800-3600 seconds (30-60 minutes)
- **Keyword efficiency**: Use simple text matching when possible
- **Regex patterns**: Test patterns for efficiency before deployment
- **Feed pruning**: Disable or remove inactive feeds

### Database Optimization

- **Alert cleanup**: Regularly delete old alerts (use Settings page)
- **Index maintenance**: Database automatically maintains indexes
- **Connection pooling**: Configured with SQLAlchemy defaults

## Stopping the Platform

### Graceful Shutdown

Stop all services (preserves data):
```bash
docker compose down
```

Stop specific service:
```bash
docker compose stop celery_worker
```

### Complete Reset

Stop and remove all data (WARNING: deletes database):
```bash
docker compose down -v
```

## License

This project is provided as-is for educational and security research purposes.

## Disclaimer

This tool is intended for **legitimate security monitoring and threat intelligence purposes only**. Users are responsible for ensuring compliance with all applicable laws and regulations in their jurisdiction. The developers assume no liability for misuse of this software. Always obtain proper authorization before monitoring any systems or sources.

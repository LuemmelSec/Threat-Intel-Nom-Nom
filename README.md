# Threat Intel Nom Nom

A threat intelligence monitoring platform that aggregates security feeds from multiple sources and generates automated alerts based on custom keywords. Monitor ransomware gangs, security advisories, dark web forums, and more - all from a single dashboard.

## Key Features

- **Multi-Source Monitoring**: API endpoints, RSS feeds, websites, and .onion sites via Tor
- **20 Default Feeds**: Pre-configured ransomware trackers, security blogs, and threat intelligence sources
- **Smart Alerting**: Keyword matching with regex support and four criticality levels
- **Tag Organization**: Categorize feeds, keywords, and alerts with custom tags
- **Dashboard Analytics**: Real-time statistics and trend visualization
- **Health Monitoring**: Track feed status and consecutive failures
- **Notifications**: Email, webhook, and Discord integration

**Tech Stack**: React 18, FastAPI, PostgreSQL, Celery, Redis, Tor, Docker

For comprehensive documentation, see [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)

## Quick Start

**Prerequisites**: Docker 20.10+ and Docker Compose 2.0+

1. **Clone and configure**:
   ```bash
   git clone <repository-url>
   cd Threat-Intel-Nom-Nom
   cp .env.example .env
   ```

2. **Edit `.env`** and set:
   - `POSTGRES_PASSWORD` - Secure database password
   - `SECRET_KEY` - Generate with `openssl rand -hex 32`
   - `CORS_ORIGINS` - Frontend URL (default: `http://localhost:3000`)

3. **Start the platform**:
   ```bash
   docker compose up -d --build
   ```

4. **Access**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

The system automatically initializes with 20 pre-configured threat intelligence feeds covering ransomware trackers, security blogs, CISA advisories, HaveIBeenPwned, and dark web sources.

## Configuration

### Remote Access

To access from another machine, update:

1. `backend/app/config.py`:
   ```python
   CORS_ORIGINS: list = ["http://YOUR_IP:3000"]
   ```

2. `.env`:
   ```env
   REACT_APP_API_BASE_URL=http://YOUR_IP:8000
   ```

3. Rebuild: `docker compose up -d --build frontend`

### Email Notifications

Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=alerts@yourdomain.com
```

## Basic Usage

**Add Keywords**: Navigate to Keywords page, create keywords with regex patterns and criticality levels

**Monitor Alerts**: Dashboard shows real-time statistics, click tiles to filter alerts

**Health Monitoring**: Logs page displays feed status and error tracking

**Manage Feeds**: Add custom feeds (API/RSS/Website/Onion), configure intervals, assign tags

For detailed usage instructions, see [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)

## Monitoring & Troubleshooting

**View Logs**:
```bash
docker compose logs -f backend
docker compose logs -f celery_worker
```

**Common Issues**:

- **Feeds not updating**: Check enabled status, verify interval elapsed, review Logs page
- **Alerts not generated**: Verify keywords enabled, check regex patterns, review worker logs
- **Onion sites failing**: Restart Tor container: `docker compose restart tor`
- **Container won't start**: Check logs: `docker compose logs <service>`, verify `.env` settings

**Database Backup**:
```bash
docker compose exec postgres pg_dump -U darkweb darkweb_db > backup_$(date +%Y%m%d).sql
```

For comprehensive troubleshooting, see [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)

## Security & Production

**Before deploying to production**:

- Change all default credentials in `.env`
- Generate secure `SECRET_KEY`: `openssl rand -hex 32`
- Use strong database password (16+ characters)
- Implement HTTPS via reverse proxy (nginx/Caddy/Traefik)
- Add authentication layer (OAuth2/JWT)
- Restrict CORS origins to your domain
- Configure firewall rules
- Implement automated database backups
- Understand legal implications of monitoring .onion sites in your jurisdiction

For comprehensive security guidelines, see [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)

## Management Commands

**Stop Platform**:
```bash
docker compose down  # Preserves data
```

**Complete Reset** (deletes all data):
```bash
docker compose down -v
```

**Restart Services**:
```bash
docker compose restart
```

## Documentation

**Quick Reference**: This README covers installation and basic usage

**Comprehensive Guide**: See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for:
- Complete architecture details
- API template system documentation
- Advanced configuration options
- Performance optimization strategies
- Operational procedures and best practices
- Development roadmap
- Use cases and examples

**API Documentation**: Interactive docs at http://localhost:8000/docs

## License & Disclaimer

This project is provided as-is for educational and security research purposes.

**Important**: This tool is intended for legitimate security monitoring and threat intelligence purposes only. Users are responsible for ensuring compliance with all applicable laws and regulations in their jurisdiction. Always obtain proper authorization before monitoring any systems or sources. The developers assume no liability for misuse of this software.

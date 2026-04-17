# Threat Intel Nom Nom

A threat intelligence monitoring tool that aggregates security feeds and generates alerts based on custom keywords.

## Features

- Monitor API endpoints, RSS feeds, websites, and .onion sites (via Tor)
- Keyword matching with regex support
- Alert notifications (email, webhook, Discord)
- Tag-based organization
- 20 pre-configured threat intelligence feeds

**Stack**: React, FastAPI, PostgreSQL, Celery, Redis, Docker

See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for detailed documentation.

## Setup

### Option 1: Setup Scripts (Recommended)

**Windows**:
```powershell
.\setup.ps1
```

**Linux/macOS**:
```bash
chmod +x setup.sh
./setup.sh
```

The scripts will:
- Create `.env` file from template
- Generate secure credentials
- Start Docker containers
- Initialize database with default feeds

### Option 2: Manual Setup

**Prerequisites**: Docker 20.10+ and Docker Compose 2.0+

1. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set required values:
   - `POSTGRES_PASSWORD`
   - `SECRET_KEY` (generate with `openssl rand -hex 32`)

3. Start containers:
   ```bash
   docker compose up -d --build
   ```

### Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Configuration

### Remote Access

Edit `.env`:
```env
<<<<<<< HEAD
REACT_APP_API_URL=http://YOUR_IP:8000
=======
REACT_APP_API_BASE_URL=http://YOUR_IP:8000
>>>>>>> 2b52af8302058dc78e373f3fc56fdfb3cac903ef
```

Edit `backend/app/config.py`:
```python
CORS_ORIGINS: list = ["http://YOUR_IP:3000"]
```

Rebuild: `docker compose up -d --build frontend`

### Email Notifications

Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Usage

Add keywords in the Keywords page to start receiving alerts when matches are found in monitored feeds.

## Management

**View logs**:
```bash
docker compose logs -f backend
```

**Stop**:
```bash
docker compose down
```

**Reset (deletes all data)**:
```bash
docker compose down -v
```

## Security Notes

For production use:
- Change all default credentials
- Use HTTPS (reverse proxy)
- Add authentication
- Restrict CORS origins
- Review legal requirements for .onion monitoring in your jurisdiction

## Disclaimer

This tool is for legitimate security monitoring and threat intelligence purposes only. Users are responsible for compliance with applicable laws. Always obtain proper authorization before monitoring any systems.

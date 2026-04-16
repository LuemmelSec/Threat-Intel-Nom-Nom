# Rollback Guide - API Templates Feature

## Current Baseline

**Git Tag:** `v1.0-pre-api-templates`  
**Commit:** Created on 2026-04-16  
**Database Backup:** `backups/backup_pre-api-templates_*.sql`

This represents the stable state before implementing the API Templates feature.

## Features at This Point

✅ RSS/Website/Onion feed support  
✅ Keyword matching with criticality levels  
✅ Dashboard with analytics and clickable tiles  
✅ System health monitoring and logs  
✅ Bulk operations (feeds, keywords, alerts)  
✅ Nitter RSS integration (browser headers fix)  
✅ Email/Discord/Webhook notifications  
✅ Alert cleanup and deduplication  

## How to Rollback

### Option 1: Git Rollback (Recommended)

**Step 1: Check current status**
```powershell
git log --oneline
git tag
```

**Step 2: Rollback code to baseline**
```powershell
# View the baseline commit
git show v1.0-pre-api-templates

# Rollback to this version (hard reset)
git reset --hard v1.0-pre-api-templates

# Or create a new branch from the tag
git checkout -b rollback-branch v1.0-pre-api-templates
```

**Step 3: Restore database (if needed)**
```powershell
# Find your backup
Get-ChildItem backups/backup_pre-api-templates_*.sql

# Restore it to server
$BACKUP_FILE = "backups/backup_pre-api-templates_20260416_154020.sql"
Get-Content $BACKUP_FILE | ssh daniel@192.168.10.161 'cd /opt/darkwebalert && docker compose exec -T postgres psql -U darkweb darkweb_db'
```

**Step 4: Redeploy**
```powershell
# Upload files to server
scp -r backend daniel@192.168.10.161:/opt/darkwebalert/
scp -r frontend daniel@192.168.10.161:/opt/darkwebalert/

# Restart containers
echo qwer1234 | ssh daniel@192.168.10.161 'cd /opt/darkwebalert && docker compose restart backend frontend celery_worker celery_beat'
```

### Option 2: Database-Only Rollback

If you just need to restore database (code is fine):

```powershell
# Stop workers to prevent data conflicts
echo qwer1234 | ssh daniel@192.168.10.161 'cd /opt/darkwebalert && docker compose stop celery_worker celery_beat'

# Restore database
Get-Content backups/backup_pre-api-templates_*.sql | ssh daniel@192.168.10.161 'cd /opt/darkwebalert && docker compose exec -T postgres psql -U darkweb darkweb_db'

# Restart everything
echo qwer1234 | ssh daniel@192.168.10.161 'cd /opt/darkwebalert && docker compose restart'
```

### Option 3: Quick File Rollback (Single File)

If only specific files are problematic:

```powershell
# List changed files
git diff v1.0-pre-api-templates --name-only

# Restore specific file
git checkout v1.0-pre-api-templates -- backend/app/services/feed_fetcher.py

# Upload to server
scp backend/app/services/feed_fetcher.py daniel@192.168.10.161:/opt/darkwebalert/backend/app/services/

# Restart affected service
echo qwer1234 | ssh daniel@192.168.10.161 'cd /opt/darkwebalert && docker compose restart celery_worker'
```

## Verification After Rollback

**1. Check Git Status**
```powershell
git status
git log --oneline -5
```

**2. Check Application**
- Frontend: http://192.168.10.161:3000
- Backend API: http://192.168.10.161:8000/docs
- Verify feeds are working
- Check keyword matching
- Test manual feed trigger

**3. Check Services**
```powershell
echo qwer1234 | ssh daniel@192.168.10.161 'cd /opt/darkwebalert && docker compose ps'
echo qwer1234 | ssh daniel@192.168.10.161 'cd /opt/darkwebalert && docker compose logs --tail=50 celery_worker'
```

## What Changes with API Templates

When API Templates feature is implemented, the following will be added:

**Database:**
- New table: `api_templates`

**Backend:**
- New API endpoints: `/api/templates/*`
- New model: `APITemplate` in `models.py`
- New schema: `APITemplateCreate`, `APITemplateUpdate` in `schemas.py`
- Updated `feed_fetcher.py` with `APIFetcher` class
- New API route file: `api/templates.py`

**Frontend:**
- Updated `Feeds.js` (API feed type option)
- New `APITemplates.js` page
- Updated `Settings.js` (API Templates tab)
- Updated `Navigation.js` (link to templates)

**None of these affect existing functionality** - all current features remain unchanged.

## Support Files

- **Backups Directory:** `backups/`
- **Git Repository:** `.git/`
- **This File:** `ROLLBACK.md`

## Emergency Contact

If something breaks critically:

1. **Stop all containers:**
   ```powershell
   echo qwer1234 | ssh daniel@192.168.10.161 'cd /opt/darkwebalert && docker compose down'
   ```

2. **Rollback code** (see Option 1 above)

3. **Restore database** (see Step 3 above)

4. **Start fresh:**
   ```powershell
   echo qwer1234 | ssh daniel@192.168.10.161 'cd /opt/darkwebalert && docker compose up -d --build'
   ```

## Notes

- Backups are in `backups/` directory (ignored by git)
- Git tags are permanent markers you can always return to
- Database backups are complete snapshots (schema + data)
- All changes to be made are backward compatible
- Existing feeds/keywords/alerts are not affected by new feature

---

**Created:** 2026-04-16  
**Purpose:** Safety net before API Templates implementation  
**Status:** ✅ Backup Complete

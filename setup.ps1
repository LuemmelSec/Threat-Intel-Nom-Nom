#!/usr/bin/env pwsh

Write-Host "🔍 Dark Web Alert - Setup Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "  Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is available
Write-Host "Checking Docker Compose installation..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version
    Write-Host "✓ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose not found. Please update Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Create .env file if it doesn't exist
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created. Please edit it with your configuration." -ForegroundColor Green
    Write-Host "  Important: Update POSTGRES_PASSWORD and SECRET_KEY!" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host ""

# Ask if user wants to start the services
$start = Read-Host "Do you want to build and start the services now? (y/n)"

if ($start -eq "y" -or $start -eq "Y") {
    Write-Host ""
    Write-Host "Building and starting Docker containers..." -ForegroundColor Yellow
    Write-Host "This may take several minutes on first run..." -ForegroundColor Yellow
    Write-Host ""
    
    docker compose up -d --build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Dark Web Alert is now running!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access the application at:" -ForegroundColor Cyan
        Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
        Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
        Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor White
        Write-Host ""
        Write-Host "View logs with: docker compose logs -f" -ForegroundColor Yellow
        Write-Host "Stop services with: docker compose down" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "✗ Failed to start services. Check the error messages above." -ForegroundColor Red
        Write-Host "  Try running: docker compose up -d --build" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "Setup complete. To start the services later, run:" -ForegroundColor Yellow
    Write-Host "  docker compose up -d --build" -ForegroundColor White
    Write-Host ""
}

Write-Host "For more information, see README.md" -ForegroundColor Cyan

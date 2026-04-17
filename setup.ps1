#!/usr/bin/env pwsh

Write-Host "🔍 Threat Intel Nom Nom - Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
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

# Detect IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress

if ($localIP) {
    Write-Host "Detected IP address: $localIP" -ForegroundColor Cyan
} else {
    $localIP = "localhost"
    Write-Host "Could not detect IP, using localhost" -ForegroundColor Yellow
}

# Create .env file if it doesn't exist
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    
    # Generate secure credentials
    Write-Host "Generating secure credentials..." -ForegroundColor Yellow
    
    # Generate random password and secret key
    $dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | ForEach-Object {[char]$_})
    $secretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    # Update .env with generated credentials
    (Get-Content ".env") -replace 'POSTGRES_PASSWORD=darkweb_password_change_me', "POSTGRES_PASSWORD=$dbPassword" `
                          -replace 'your-super-secret-key-change-this-in-production', $secretKey `
                          -replace 'darkweb:darkweb_password_change_me@', "darkweb:$dbPassword@" | Set-Content ".env"
    
    # Ask about remote access
    Write-Host ""
    $remote = Read-Host "Enable remote access from other machines? (y/n) [n]"
    
    if ($remote -eq "y" -or $remote -eq "Y") {
        $apiUrl = "http://${localIP}:8000"
        Write-Host "Configuring for remote access at $localIP..." -ForegroundColor Yellow
        
        # Update .env with IP address
        (Get-Content ".env") -replace 'REACT_APP_API_URL=http://localhost:8000', "REACT_APP_API_URL=$apiUrl" | Set-Content ".env"
        
        # Update backend CORS config
        $configPath = "backend/app/config.py"
        $configContent = Get-Content $configPath -Raw
        $configContent = $configContent -replace 'CORS_ORIGINS: list = \["http://localhost:3000", "http://frontend:3000"\]', "CORS_ORIGINS: list = [`"http://localhost:3000`", `"http://frontend:3000`", `"http://${localIP}:3000`"]"
        $configContent | Set-Content $configPath
        
        Write-Host "✓ Configured for remote access" -ForegroundColor Green
        Write-Host "  Access from: http://${localIP}:3000" -ForegroundColor White
    } else {
        Write-Host "✓ Configured for local access only" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "✓ .env file created with secure credentials" -ForegroundColor Green
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
        Write-Host "✓ Threat Intel Nom Nom is now running!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access the application at:" -ForegroundColor Cyan
        if ($localIP -and $localIP -ne "localhost" -and ($remote -eq "y" -or $remote -eq "Y")) {
            Write-Host "  Frontend:  http://${localIP}:3000" -ForegroundColor White
            Write-Host "  Backend:   http://${localIP}:8000" -ForegroundColor White
            Write-Host "  API Docs:  http://${localIP}:8000/docs" -ForegroundColor White
        } else {
            Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
            Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
            Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "Default feeds and tags have been automatically configured." -ForegroundColor Green
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

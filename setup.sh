#!/bin/bash

echo "🔍 Threat Intel Nom Nom - Setup Script"
echo "========================================"
echo ""

# Check if Docker is installed
echo "Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "✓ Docker found: $DOCKER_VERSION"
else
    echo "✗ Docker not found. Please install Docker first."
    echo "  Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
echo "Checking Docker Compose installation..."
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    echo "✓ Docker Compose found: $COMPOSE_VERSION"
else
    echo "✗ Docker Compose not found. Please update Docker."
    exit 1
fi

echo ""

# Detect IP address
if command -v hostname &> /dev/null; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    if [ -z "$LOCAL_IP" ]; then
        # Fallback for macOS
        LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -n 1 | awk '{print $2}')
    fi
else
    LOCAL_IP="localhost"
fi

if [ -n "$LOCAL_IP" ] && [ "$LOCAL_IP" != "localhost" ]; then
    echo "Detected IP address: $LOCAL_IP"
else
    LOCAL_IP="localhost"
    echo "Could not detect IP, using localhost"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    
    # Generate secure credentials
    echo "Generating secure credentials..."
    
    # Generate random password and secret key (using openssl or /dev/urandom)
    if command -v openssl &> /dev/null; then
        DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
        SECRET_KEY=$(openssl rand -hex 32)
    else
        DB_PASSWORD=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 24 | head -n 1)
        SECRET_KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
    fi
    
    # Update .env with generated credentials
    sed -i.bak "s/POSTGRES_PASSWORD=darkweb_password_change_me/POSTGRES_PASSWORD=$DB_PASSWORD/" .env
    sed -i.bak "s/your-super-secret-key-change-this-in-production/$SECRET_KEY/" .env
    sed -i.bak "s/darkweb:darkweb_password_change_me@/darkweb:$DB_PASSWORD@/" .env
    rm -f .env.bak
    
    # Ask about remote access
    echo ""
    read -p "Enable remote access from other machines? (y/n) [n] " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        API_URL="http://${LOCAL_IP}:8000"
        echo "Configuring for remote access at $LOCAL_IP..."
        
        # Update .env with IP address
        sed -i.bak "s|REACT_APP_API_URL=http://localhost:8000|REACT_APP_API_URL=$API_URL|" .env
        rm -f .env.bak
        
        # Update backend CORS config
        CONFIG_PATH="backend/app/config.py"
        sed -i.bak "s|CORS_ORIGINS: list = \[\"http://localhost:3000\", \"http://frontend:3000\"\]|CORS_ORIGINS: list = [\"http://localhost:3000\", \"http://frontend:3000\", \"http://${LOCAL_IP}:3000\"]|" "$CONFIG_PATH"
        rm -f "${CONFIG_PATH}.bak"
        
        echo "✓ Configured for remote access"
        echo "  Access from: http://${LOCAL_IP}:3000"
    else
        echo "✓ Configured for local access only"
    fi
    
    echo ""
    echo "✓ .env file created with secure credentials"
else
    echo "✓ .env file already exists"
fi

echo ""

# Ask if user wants to start the services
read -p "Do you want to build and start the services now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Building and starting Docker containers..."
    echo "This may take several minutes on first run..."
    echo ""
    
    docker compose up -d --build
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Threat Intel Nom Nom is now running!"
        echo ""
        echo "Access the application at:"
        if [ -n "$LOCAL_IP" ] && [ "$LOCAL_IP" != "localhost" ] && [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "  Frontend:  http://${LOCAL_IP}:3000"
            echo "  Backend:   http://${LOCAL_IP}:8000"
            echo "  API Docs:  http://${LOCAL_IP}:8000/docs"
        else
            echo "  Frontend:  http://localhost:3000"
            echo "  Backend:   http://localhost:8000"
            echo "  API Docs:  http://localhost:8000/docs"
        fi
        echo ""
        echo "Default feeds and tags have been automatically configured."
        echo ""
        echo "View logs with: docker compose logs -f"
        echo "Stop services with: docker compose down"
        echo ""
    else
        echo ""
        echo "✗ Failed to start services. Check the error messages above."
        echo "  Try running: docker compose up -d --build"
        exit 1
    fi
else
    echo ""
    echo "Setup complete. To start the services later, run:"
    echo "  docker compose up -d --build"
    echo ""
fi

echo "For more information, see README.md"

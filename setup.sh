#!/bin/bash

echo "🔍 Dark Web Alert - Setup Script"
echo "================================="
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

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created. Please edit it with your configuration."
    echo "  Important: Update POSTGRES_PASSWORD and SECRET_KEY!"
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
        echo "✓ Dark Web Alert is now running!"
        echo ""
        echo "Access the application at:"
        echo "  Frontend:  http://localhost:3000"
        echo "  Backend:   http://localhost:8000"
        echo "  API Docs:  http://localhost:8000/docs"
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

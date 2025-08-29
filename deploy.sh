#!/bin/bash

# Manulife Investment Portfolio Application Deployment Script

set -e

echo "🚀 Manulife Investment Portfolio Application Deployment"
echo "=================================================="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Function to display usage
usage() {
    echo "Usage: $0 [dev|prod|stop|clean]"
    echo ""
    echo "Commands:"
    echo "  dev     - Start development environment"
    echo "  prod    - Start production environment"
    echo "  stop    - Stop all services"
    echo "  clean   - Stop and remove all containers, networks, and volumes"
    echo ""
    exit 1
}

# Function to start development environment
start_dev() {
    echo "🔧 Starting development environment..."
    
    # Check if .env exists, if not copy from example
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            echo "📝 Creating .env file from template..."
            cp .env.example .env
            echo "⚠️  Please edit .env file with your configuration before continuing."
            echo "   At minimum, change the SECRET_KEY for security."
            read -p "Press Enter to continue when ready..."
        else
            echo "⚠️  No .env file found. Creating basic configuration..."
            cat > .env << EOF
# Database Configuration
POSTGRES_USER=username
POSTGRES_PASSWORD=password
POSTGRES_DB=investment_portfolio

# Backend Configuration
SECRET_KEY=$(openssl rand -hex 32)
DATABASE_URL=postgresql://username:password@postgres:5432/investment_portfolio

# API Keys
ALPHA_VANTAGE_API_KEY=LBNC0VAU9E9EGQQO

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=LBNC0VAU9E9EGQQO

# JWT Configuration
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF
        fi
    fi
    
    echo "🐳 Starting services with Docker Compose..."
    docker-compose up -d
    
    echo ""
    echo "✅ Development environment started successfully!"
    echo ""
    echo "🌐 Access the application:"
    echo "   Frontend:        http://localhost:3000"
    echo "   Backend API:     http://localhost:8000"
    echo "   API Docs:        http://localhost:8000/docs"
    echo "   Database Admin:  http://localhost:8080"
    echo ""
    echo "🔐 Default test credentials:"
    echo "   Username: testuser"
    echo "   Password: secret"
    echo ""
    echo "📝 Check logs: docker-compose logs -f [service-name]"
}

# Function to start production environment
start_prod() {
    echo "🏭 Starting production environment..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo "❌ No .env file found. Production requires environment configuration."
        if [ -f .env.example ]; then
            cp .env.example .env
            echo "📝 Created .env from template. Please configure it for production:"
            echo "   - Set a strong SECRET_KEY"
            echo "   - Set secure database credentials"
            echo "   - Configure API keys"
            exit 1
        else
            echo "❌ No .env.example found. Please create environment configuration."
            exit 1
        fi
    fi
    
    # Validate production environment
    if grep -q "your-secret-key-here-change-in-production" .env; then
        echo "❌ Please change the default SECRET_KEY in .env for production!"
        exit 1
    fi
    
    echo "🐳 Starting production services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo ""
    echo "✅ Production environment started successfully!"
    echo ""
    echo "🌐 Access the application:"
    echo "   Frontend:        http://localhost:3000"
    echo "   Backend API:     http://localhost:8000"
    echo "   API Docs:        http://localhost:8000/docs"
    echo "   Database Admin:  http://localhost:8080"
    echo ""
    echo "📝 Check logs: docker-compose -f docker-compose.prod.yml logs -f [service-name]"
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping all services..."
    
    if [ -f docker-compose.yml ]; then
        docker-compose down
    fi
    
    if [ -f docker-compose.prod.yml ]; then
        docker-compose -f docker-compose.prod.yml down
    fi
    
    echo "✅ All services stopped."
}

# Function to clean up
clean_all() {
    echo "🧹 Cleaning up all containers, networks, and volumes..."
    
    read -p "⚠️  This will remove all data. Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    
    if [ -f docker-compose.yml ]; then
        docker-compose down -v --remove-orphans
    fi
    
    if [ -f docker-compose.prod.yml ]; then
        docker-compose -f docker-compose.prod.yml down -v --remove-orphans
    fi
    
    # Remove any dangling images
    docker image prune -f
    
    echo "✅ Cleanup completed."
}

# Main script logic
case "${1:-}" in
    "dev")
        start_dev
        ;;
    "prod")
        start_prod
        ;;
    "stop")
        stop_services
        ;;
    "clean")
        clean_all
        ;;
    *)
        usage
        ;;
esac

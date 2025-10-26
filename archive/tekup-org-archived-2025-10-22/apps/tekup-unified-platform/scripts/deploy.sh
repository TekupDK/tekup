#!/bin/bash

# Tekup Unified Platform - Production Deployment Script
# This script handles the complete deployment process

set -e

echo "🚀 Starting Tekup Unified Platform Deployment"
echo "=============================================="

# Configuration
ENVIRONMENT=${1:-production}
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Backup existing data
backup_data() {
    log_info "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if it exists
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps postgres | grep -q "Up"; then
        log_info "Backing up PostgreSQL database..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump -U tekup tekup_unified > "$BACKUP_DIR/database_$TIMESTAMP.sql"
        log_info "Database backup created: $BACKUP_DIR/database_$TIMESTAMP.sql"
    fi
    
    # Backup environment files
    if [ -f ".env" ]; then
        cp .env "$BACKUP_DIR/env_$TIMESTAMP"
        log_info "Environment backup created: $BACKUP_DIR/env_$TIMESTAMP"
    fi
}

# Build and deploy
deploy() {
    log_info "Building and deploying application..."
    
    # Pull latest images
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    # Build application
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    # Stop existing services
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Start services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    log_info "Application deployed successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 30
    
    # Run Prisma migrations
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec tekup-platform npx prisma migrate deploy
    
    log_info "Database migrations completed"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if application is responding
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_info "✅ Application is healthy"
    else
        log_error "❌ Application health check failed"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs tekup-platform
        exit 1
    fi
}

# Setup SSL certificates (if needed)
setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    mkdir -p ./ssl
    
    if [ ! -f "./ssl/cert.pem" ] || [ ! -f "./ssl/key.pem" ]; then
        log_warn "SSL certificates not found. Generating self-signed certificates..."
        
        openssl req -x509 -newkey rsa:4096 -keyout ./ssl/key.pem -out ./ssl/cert.pem -days 365 -nodes \
            -subj "/C=DK/ST=Denmark/L=Copenhagen/O=Tekup/OU=IT/CN=tekup.dk"
        
        log_info "Self-signed SSL certificates generated"
    else
        log_info "SSL certificates already exist"
    fi
}

# Main deployment process
main() {
    log_info "Starting deployment process for environment: $ENVIRONMENT"
    
    check_prerequisites
    backup_data
    setup_ssl
    deploy
    run_migrations
    health_check
    
    log_info "🎉 Deployment completed successfully!"
    log_info "Application is available at: https://tekup.dk"
    log_info "API documentation: https://tekup.dk/api/docs"
    
    # Show running services
    log_info "Running services:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
}

# Run main function
main "$@"
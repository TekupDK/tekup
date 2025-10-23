#!/bin/bash

# RendetaljeOS Production Deployment Script
# This script handles the complete deployment process to Render.com

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RENDER_API_URL="https://api.render.com/v1"
GITHUB_REPO="rendetalje/RendetaljeOS"
BRANCH="main"

# Service IDs (to be filled after initial deployment)
BACKEND_SERVICE_ID=""
FRONTEND_OWNER_SERVICE_ID=""
FRONTEND_CUSTOMER_SERVICE_ID=""
REDIS_SERVICE_ID=""

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check if required tools are installed
    command -v curl >/dev/null 2>&1 || { log_error "curl is required but not installed. Aborting."; exit 1; }
    command -v jq >/dev/null 2>&1 || { log_error "jq is required but not installed. Aborting."; exit 1; }
    command -v git >/dev/null 2>&1 || { log_error "git is required but not installed. Aborting."; exit 1; }
    
    # Check environment variables
    if [ -z "$RENDER_API_KEY" ]; then
        log_error "RENDER_API_KEY environment variable is not set"
        exit 1
    fi
    
    log_success "All dependencies are available"
}

check_git_status() {
    log_info "Checking git status..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    # Check if we're on the correct branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "$BRANCH" ]; then
        log_warning "Current branch is '$current_branch', expected '$BRANCH'"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_warning "There are uncommitted changes"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Git status check completed"
}

run_tests() {
    log_info "Running tests..."
    
    # Backend tests
    log_info "Running backend tests..."
    cd backend
    npm ci
    npm run test
    npm run test:e2e
    cd ..
    
    # Frontend tests
    log_info "Running frontend tests..."
    cd frontend
    npm ci
    npm run test
    npm run build
    cd ..
    
    # Mobile app tests
    log_info "Running mobile app tests..."
    cd RendetaljeOS-Mobile
    npm ci
    npm run test
    cd ..
    
    log_success "All tests passed"
}

deploy_backend() {
    log_info "Deploying backend service..."
    
    if [ -z "$BACKEND_SERVICE_ID" ]; then
        log_error "BACKEND_SERVICE_ID not set. Please create the service first."
        exit 1
    fi
    
    # Trigger deployment
    response=$(curl -s -X POST \
        "$RENDER_API_URL/services/$BACKEND_SERVICE_ID/deploys" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"clearCache\": \"clear\"}")
    
    deploy_id=$(echo "$response" | jq -r '.id')
    
    if [ "$deploy_id" = "null" ]; then
        log_error "Failed to trigger backend deployment"
        echo "$response" | jq .
        exit 1
    fi
    
    log_info "Backend deployment triggered. Deploy ID: $deploy_id"
    
    # Wait for deployment to complete
    wait_for_deployment "$BACKEND_SERVICE_ID" "$deploy_id" "Backend"
}

deploy_frontend_owner() {
    log_info "Deploying owner portal..."
    
    if [ -z "$FRONTEND_OWNER_SERVICE_ID" ]; then
        log_error "FRONTEND_OWNER_SERVICE_ID not set. Please create the service first."
        exit 1
    fi
    
    # Trigger deployment
    response=$(curl -s -X POST \
        "$RENDER_API_URL/services/$FRONTEND_OWNER_SERVICE_ID/deploys" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"clearCache\": \"clear\"}")
    
    deploy_id=$(echo "$response" | jq -r '.id')
    
    if [ "$deploy_id" = "null" ]; then
        log_error "Failed to trigger owner portal deployment"
        echo "$response" | jq .
        exit 1
    fi
    
    log_info "Owner portal deployment triggered. Deploy ID: $deploy_id"
    
    # Wait for deployment to complete
    wait_for_deployment "$FRONTEND_OWNER_SERVICE_ID" "$deploy_id" "Owner Portal"
}

deploy_frontend_customer() {
    log_info "Deploying customer portal..."
    
    if [ -z "$FRONTEND_CUSTOMER_SERVICE_ID" ]; then
        log_error "FRONTEND_CUSTOMER_SERVICE_ID not set. Please create the service first."
        exit 1
    fi
    
    # Trigger deployment
    response=$(curl -s -X POST \
        "$RENDER_API_URL/services/$FRONTEND_CUSTOMER_SERVICE_ID/deploys" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"clearCache\": \"clear\"}")
    
    deploy_id=$(echo "$response" | jq -r '.id')
    
    if [ "$deploy_id" = "null" ]; then
        log_error "Failed to trigger customer portal deployment"
        echo "$response" | jq .
        exit 1
    fi
    
    log_info "Customer portal deployment triggered. Deploy ID: $deploy_id"
    
    # Wait for deployment to complete
    wait_for_deployment "$FRONTEND_CUSTOMER_SERVICE_ID" "$deploy_id" "Customer Portal"
}

wait_for_deployment() {
    local service_id=$1
    local deploy_id=$2
    local service_name=$3
    
    log_info "Waiting for $service_name deployment to complete..."
    
    while true; do
        response=$(curl -s -X GET \
            "$RENDER_API_URL/services/$service_id/deploys/$deploy_id" \
            -H "Authorization: Bearer $RENDER_API_KEY")
        
        status=$(echo "$response" | jq -r '.status')
        
        case $status in
            "build_in_progress"|"update_in_progress")
                echo -n "."
                sleep 10
                ;;
            "live")
                echo
                log_success "$service_name deployment completed successfully"
                break
                ;;
            "build_failed"|"update_failed"|"canceled")
                echo
                log_error "$service_name deployment failed with status: $status"
                exit 1
                ;;
            *)
                echo
                log_warning "$service_name deployment status: $status"
                sleep 10
                ;;
        esac
    done
}

run_health_checks() {
    log_info "Running health checks..."
    
    # Check backend health
    log_info "Checking backend health..."
    backend_health=$(curl -s -o /dev/null -w "%{http_code}" https://api.rendetalje.dk/health)
    if [ "$backend_health" = "200" ]; then
        log_success "Backend is healthy"
    else
        log_error "Backend health check failed (HTTP $backend_health)"
        exit 1
    fi
    
    # Check owner portal
    log_info "Checking owner portal..."
    owner_health=$(curl -s -o /dev/null -w "%{http_code}" https://portal.rendetalje.dk)
    if [ "$owner_health" = "200" ]; then
        log_success "Owner portal is accessible"
    else
        log_error "Owner portal health check failed (HTTP $owner_health)"
        exit 1
    fi
    
    # Check customer portal
    log_info "Checking customer portal..."
    customer_health=$(curl -s -o /dev/null -w "%{http_code}" https://kunde.rendetalje.dk)
    if [ "$customer_health" = "200" ]; then
        log_success "Customer portal is accessible"
    else
        log_error "Customer portal health check failed (HTTP $customer_health)"
        exit 1
    fi
    
    log_success "All health checks passed"
}

run_database_migrations() {
    log_info "Running database migrations..."
    
    # This would typically be done through a separate migration job
    # For now, we'll assume migrations are handled automatically
    # or through a separate process
    
    log_info "Database migrations should be run manually or through CI/CD"
    log_warning "Please ensure all database migrations are applied before deployment"
}

send_deployment_notification() {
    local status=$1
    local message=$2
    
    # Send notification (implement based on your notification system)
    log_info "Sending deployment notification: $status - $message"
    
    # Example: Send to Slack, email, etc.
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"RendetaljeOS Deployment $status: $message\"}" \
    #     $SLACK_WEBHOOK_URL
}

cleanup() {
    log_info "Cleaning up temporary files..."
    # Add any cleanup logic here
}

main() {
    log_info "Starting RendetaljeOS deployment process..."
    
    # Trap to ensure cleanup on exit
    trap cleanup EXIT
    
    # Pre-deployment checks
    check_dependencies
    check_git_status
    
    # Ask for confirmation
    echo
    log_warning "This will deploy RendetaljeOS to production."
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
    
    # Run tests
    if [ "${SKIP_TESTS:-false}" != "true" ]; then
        run_tests
    else
        log_warning "Skipping tests (SKIP_TESTS=true)"
    fi
    
    # Database migrations
    run_database_migrations
    
    # Deploy services
    deploy_backend
    deploy_frontend_owner
    deploy_frontend_customer
    
    # Health checks
    sleep 30  # Wait for services to fully start
    run_health_checks
    
    # Success notification
    send_deployment_notification "SUCCESS" "All services deployed successfully"
    
    log_success "RendetaljeOS deployment completed successfully!"
    log_info "Services are available at:"
    log_info "  - API: https://api.rendetalje.dk"
    log_info "  - Owner Portal: https://portal.rendetalje.dk"
    log_info "  - Customer Portal: https://kunde.rendetalje.dk"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "health-check")
        run_health_checks
        ;;
    "backend-only")
        check_dependencies
        deploy_backend
        ;;
    "frontend-only")
        check_dependencies
        deploy_frontend_owner
        deploy_frontend_customer
        ;;
    "test-only")
        run_tests
        ;;
    *)
        echo "Usage: $0 [deploy|health-check|backend-only|frontend-only|test-only]"
        exit 1
        ;;
esac
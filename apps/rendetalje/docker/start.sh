#!/bin/bash

# Rendetalje Development Startup Script
# Supports Linux, macOS, and Windows (WSL/Git Bash)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="rendetalje"
DEFAULT_MODE="local"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_COMPOSE_FILE="docker-compose.yml"

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

show_help() {
    echo "Rendetalje Development Server Startup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --local     Start with local PostgreSQL (default)"
    echo "  --cloud     Start with Supabase cloud database"
    echo "  --stop      Stop all services"
    echo "  --restart   Restart all services"
    echo "  --logs      Show service logs"
    echo "  --status    Show service status"
    echo "  --build     Rebuild and start services"
    echo "  --clean     Clean up containers and volumes"
    echo "  --mcp-only  Start only MCP server"
    echo "  --pgadmin   Open pgAdmin4 in browser"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --local         # Start with local database"
    echo "  $0 --cloud         # Start with cloud database"
    echo "  $0 --stop          # Stop all services"
    echo "  $0 --pgadmin       # Open pgAdmin4 in browser"
}

check_dependencies() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
}

start_services() {
    local mode=${1:-$DEFAULT_MODE}
    log_info "Starting Rendetalje development environment (mode: $mode)"
    
    # Set environment based on mode
    export DATABASE_MODE=$mode
    export RENDER_DATABASE_MODE=$mode
    
    if [ "$mode" = "local" ]; then
        log_info "Using local PostgreSQL database"
    else
        log_info "Using Supabase cloud database"
    fi
    
    # Start services
    if docker compose version &> /dev/null; then
        docker compose -f $DOCKER_COMPOSE_FILE up -d
    else
        docker-compose -f $DOCKER_COMPOSE_FILE up -d
    fi
    
    log_success "Services started successfully!"
    
    # Wait for services to be healthy
    sleep 5
    
    # Show status
    show_status
}

stop_services() {
    log_info "Stopping all Rendetalje services..."
    
    if docker compose version &> /dev/null; then
        docker compose -f $DOCKER_COMPOSE_FILE down
    else
        docker-compose -f $DOCKER_COMPOSE_FILE down
    fi
    
    log_success "All services stopped"
}

restart_services() {
    local mode=${1:-$DEFAULT_MODE}
    log_info "Restarting Rendetalje services (mode: $mode)"
    stop_services
    sleep 2
    start_services $mode
}

show_logs() {
    local service=${1:-""}
    
    if [ -n "$service" ]; then
        if docker compose version &> /dev/null; then
            docker compose -f $DOCKER_COMPOSE_FILE logs -f $service
        else
            docker-compose -f $DOCKER_COMPOSE_FILE logs -f $service
        fi
    else
        if docker compose version &> /dev/null; then
            docker compose -f $DOCKER_COMPOSE_FILE logs -f
        else
            docker-compose -f $DOCKER_COMPOSE_FILE logs -f
        fi
    fi
}

show_status() {
    log_info "Rendetalje Development Environment Status:"
    echo ""
    
    # Check Docker containers
    if docker compose version &> /dev/null; then
        docker compose -f $DOCKER_COMPOSE_FILE ps
    else
        docker-compose -f $DOCKER_COMPOSE_FILE ps
    fi
    
    echo ""
    log_info "Access Points:"
    echo "  - Backend API:     http://localhost:3001"
    echo "  - Frontend App:    http://localhost:3002"
    echo "  - pgAdmin4:        http://localhost:5050"
    echo "  - MCP Server:      http://localhost:3003"
    echo "  - PostgreSQL:      localhost:5432"
    echo "  - Redis:           localhost:6379"
    echo ""
    
    if [ "$DATABASE_MODE" = "local" ]; then
        log_info "Database: Local PostgreSQL"
        echo "  pgAdmin4 Login:"
        echo "    Email: admin@rendetalje.dk"
        echo "    Password: admin123"
    else
        log_info "Database: Supabase Cloud"
    fi
}

build_services() {
    log_info "Building and starting all services..."
    
    if docker compose version &> /dev/null; then
        docker compose -f $DOCKER_COMPOSE_FILE up -d --build
    else
        docker-compose -f $DOCKER_COMPOSE_FILE up -d --build
    fi
    
    log_success "Services built and started successfully!"
    show_status
}

clean_services() {
    log_warning "This will remove all containers, volumes, and networks!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up Docker resources..."
        
        if docker compose version &> /dev/null; then
            docker compose -f $DOCKER_COMPOSE_FILE down -v --remove-orphans
            docker compose -f $DOCKER_COMPOSE_FILE rm -f
        else
            docker-compose -f $DOCKER_COMPOSE_FILE down -v --remove-orphans
            docker-compose -f $DOCKER_COMPOSE_FILE rm -f
        fi
        
        # Remove dangling images
        docker image prune -f
        
        log_success "Cleanup completed"
    else
        log_info "Cleanup cancelled"
    fi
}

start_mcp_only() {
    log_info "Starting only MCP server..."
    
    if docker compose version &> /dev/null; then
        docker compose -f $DOCKER_COMPOSE_FILE up -d mcp
    else
        docker-compose -f $DOCKER_COMPOSE_FILE up -d mcp
    fi
    
    log_success "MCP server started on http://localhost:3003"
}

open_pgadmin() {
    log_info "Opening pgAdmin4 in default browser..."
    
    if command -v open &> /dev/null; then
        # macOS
        open "http://localhost:5050"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "http://localhost:5050"
    elif command -v start &> /dev/null; then
        # Windows (Git Bash/WSL)
        start "http://localhost:5050"
    else
        log_info "Please open http://localhost:5050 in your browser"
        log_info "Login: admin@rendetalje.dk / admin123"
    fi
}

# Main script logic
main() {
    check_dependencies
    
    cd "$SCRIPT_DIR"
    
    case "${1:-}" in
        --local)
            start_services "local"
            ;;
        --cloud)
            start_services "cloud"
            ;;
        --stop)
            stop_services
            ;;
        --restart)
            restart_services "${2:-local}"
            ;;
        --logs)
            show_logs "${2:-}"
            ;;
        --status)
            show_status
            ;;
        --build)
            build_services
            ;;
        --clean)
            clean_services
            ;;
        --mcp-only)
            start_mcp_only
            ;;
        --pgadmin)
            open_pgadmin
            ;;
        --help|-h)
            show_help
            ;;
        "")
            log_info "No arguments provided. Starting with default mode (local)..."
            start_services "$DEFAULT_MODE"
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Trap Ctrl+C
trap 'log_info "Received interrupt signal. Cleaning up..."; exit 0' INT

# Run main function
main "$@"
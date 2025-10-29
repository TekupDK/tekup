#!/bin/bash

# TekupDK Network Cleanup Script
# Cleans up Docker networks and containers to prevent conflicts
# Usage: ./scripts/cleanup-networks.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 TekupDK Network Cleanup${NC}"
echo "============================"

# Function to stop and remove containers
cleanup_containers() {
    echo -e "\n${BLUE}Stopping and removing containers...${NC}"

    # Stop all TekupDK related containers
    docker ps -a --filter "name=tekup-" --format "{{.Names}}" | while read -r container; do
        echo -e "${YELLOW}Stopping container: $container${NC}"
        docker stop "$container" 2>/dev/null || true
    done

    # Remove stopped containers
    docker ps -a --filter "name=tekup-" --format "{{.Names}}" | while read -r container; do
        echo -e "${YELLOW}Removing container: $container${NC}"
        docker rm "$container" 2>/dev/null || true
    done

    # Also clean up rendetalje containers
    docker ps -a --filter "name=rendetalje-" --format "{{.Names}}" | while read -r container; do
        echo -e "${YELLOW}Stopping container: $container${NC}"
        docker stop "$container" 2>/dev/null || true
        docker rm "$container" 2>/dev/null || true
    done
}

# Function to clean up networks
cleanup_networks() {
    echo -e "\n${BLUE}Cleaning up networks...${NC}"

    # Remove specific TekupDK networks
    local networks=("tekup-mcp-network" "tekup-gmail-network" "renos-calendar-network")

    for network in "${networks[@]}"; do
        if docker network ls --format "{{.Name}}" | grep -q "^${network}$"; then
            echo -e "${YELLOW}Removing network: $network${NC}"
            docker network rm "$network" 2>/dev/null || echo -e "${RED}Failed to remove network: $network${NC}"
        else
            echo -e "${GREEN}Network $network not found (already clean)${NC}"
        fi
    done
}

# Function to clean up volumes
cleanup_volumes() {
    echo -e "\n${BLUE}Cleaning up volumes...${NC}"

    # Remove orphaned volumes
    docker volume prune -f

    # Remove specific TekupDK volumes if they're not in use
    local volumes=("redis_data" "postgres_data" "calendar_logs" "knowledge_logs" "code_intelligence_logs" "nginx_logs" "gmail_credentials" "gmail_oauth")

    for volume in "${volumes[@]}"; do
        if docker volume ls --format "{{.Name}}" | grep -q "^${volume}$"; then
            echo -e "${YELLOW}Removing volume: $volume${NC}"
            docker volume rm "$volume" 2>/dev/null || echo -e "${RED}Failed to remove volume: $volume (may be in use)${NC}"
        fi
    done
}

# Function to clean up images
cleanup_images() {
    echo -e "\n${BLUE}Cleaning up dangling images...${NC}"

    # Remove dangling images
    docker image prune -f

    # Remove unused images (optional - uncomment if needed)
    # docker image prune -a -f
}

# Function to show current status
show_status() {
    echo -e "\n${BLUE}📊 Current Docker Status${NC}"
    echo "========================="

    echo -e "\n${GREEN}Running containers:${NC}"
    docker ps --filter "name=tekup-\|name=rendetalje-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    echo -e "\n${GREEN}All TekupDK containers:${NC}"
    docker ps -a --filter "name=tekup-\|name=rendetalje-" --format "table {{.Names}}\t{{.Status}}"

    echo -e "\n${GREEN}Networks:${NC}"
    docker network ls --filter "name=tekup-\|name=renos-"

    echo -e "\n${GREEN}Volumes:${NC}"
    docker volume ls --filter "name=redis_\|name=postgres_\|name=calendar_\|name=gmail_"
}

# Main execution
main() {
    echo -e "${BLUE}This will stop and remove all TekupDK containers, networks, and volumes.${NC}"
    echo -e "${YELLOW}⚠️  Make sure to backup any important data before proceeding!${NC}"
    echo ""

    # Ask for confirmation unless --force flag is used
    if [[ "$1" != "--force" ]]; then
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}Cleanup cancelled.${NC}"
            exit 0
        fi
    fi

    cleanup_containers
    cleanup_networks
    cleanup_volumes
    cleanup_images
    show_status

    echo -e "\n${GREEN}✅ Network cleanup completed!${NC}"
    echo -e "${BLUE}💡 You can now run 'docker-compose up' to start services fresh.${NC}"
}

# Run main function
main "$@"
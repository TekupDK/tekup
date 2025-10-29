#!/bin/bash

# TekupDK Port Validation Script for Pre-Start Checks
# Runs port validation before starting docker-compose services
# Usage: ./scripts/check-ports.sh [compose-file]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default compose file
COMPOSE_FILE="${1:-docker-compose.mobile.yml}"

echo -e "${BLUE}🔍 TekupDK Pre-Start Port Validation${NC}"
echo "========================================"
echo -e "Compose file: ${YELLOW}$COMPOSE_FILE${NC}"

# Function to check if port is available
check_port_available() {
    local port="$1"
    local service="$2"

    # Check if port is in use
    if command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "${RED}❌ Port $port is already in use (required by $service)${NC}"
            return 1
        fi
    elif command -v ss &> /dev/null; then
        if ss -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "${RED}❌ Port $port is already in use (required by $service)${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Cannot check port availability (netstat/ss not available)${NC}"
        return 0
    fi

    echo -e "${GREEN}✅ Port $port is available for $service${NC}"
    return 0
}

# Function to extract ports from docker-compose file
extract_ports_from_compose() {
    local compose_file="$1"

    if [[ ! -f "$compose_file" ]]; then
        echo -e "${RED}❌ Compose file not found: $compose_file${NC}"
        return 1
    fi

    echo -e "${BLUE}📄 Analyzing: $compose_file${NC}"

    # Extract port mappings using grep/sed (fallback method)
    local ports_found=()

    # Look for port mappings in the format "port:port" or "port"
    while IFS= read -r line; do
        # Extract external ports from lines like "      - "3001:3001""
        if [[ $line =~ -[[:space:]]*[\"]?([0-9]+) ]]; then
            local port="${BASH_REMATCH[1]}"
            if [[ $port =~ ^[0-9]+$ ]]; then
                ports_found+=("$port")
            fi
        fi
    done < <(grep -A 10 "ports:" "$compose_file" | grep -E '^[[:space:]]*-[[:space:]]')

    # Remove duplicates
    local unique_ports=($(echo "${ports_found[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))

    echo "${unique_ports[@]}"
}

# Function to validate compose file
validate_compose_file() {
    local compose_file="$1"
    local full_path="$PROJECT_ROOT/$compose_file"

    if [[ ! -f "$full_path" ]]; then
        echo -e "${RED}❌ Compose file not found: $full_path${NC}"
        return 1
    fi

    echo -e "${BLUE}🔍 Validating ports for: $compose_file${NC}"

    # Extract ports from compose file
    local ports
    ports=$(extract_ports_from_compose "$full_path")

    if [[ -z "$ports" ]]; then
        echo -e "${YELLOW}⚠️  No ports found in $compose_file${NC}"
        return 0
    fi

    local validation_passed=true

    # Check each port
    for port in $ports; do
        local service_name
        service_name=$(basename "$compose_file" .yml)

        if ! check_port_available "$port" "$service_name"; then
            validation_passed=false
        fi
    done

    if $validation_passed; then
        echo -e "${GREEN}✅ All ports available for $compose_file${NC}"
        return 0
    else
        echo -e "${RED}❌ Port validation failed for $compose_file${NC}"
        return 1
    fi
}

# Function to check Docker networks
check_docker_networks() {
    echo -e "\n${BLUE}🔍 Checking Docker Networks${NC}"
    echo "=============================="

    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker not available, skipping network checks${NC}"
        return 0
    fi

    local networks=("rendetalje-network" "renos-calendar-network" "tekup-mcp-network" "tekup-gmail-network")

    for network in "${networks[@]}"; do
        if docker network ls --format "{{.Name}}" | grep -q "^${network}$"; then
            echo -e "${GREEN}✅ Network exists: $network${NC}"
        else
            echo -e "${YELLOW}⚠️  Network not found: $network (will be created by docker-compose)${NC}"
        fi
    done
}

# Main validation
main() {
    local validation_passed=true

    # Validate the specified compose file
    if ! validate_compose_file "$COMPOSE_FILE"; then
        validation_passed=false
    fi

    # Check Docker networks
    check_docker_networks

    echo -e "\n${BLUE}📊 Validation Summary${NC}"
    echo "======================"

    if $validation_passed; then
        echo -e "${GREEN}✅ Port validation completed successfully${NC}"
        echo -e "${GREEN}🚀 Services can be started safely${NC}"
        echo -e "${YELLOW}💡 Run: docker-compose -f $COMPOSE_FILE up${NC}"
        exit 0
    else
        echo -e "${RED}❌ Port validation failed${NC}"
        echo -e "${YELLOW}💡 Resolve port conflicts before starting services${NC}"
        echo -e "${YELLOW}💡 Check PORT_ALLOCATION_MASTER.md for port assignments${NC}"
        echo -e "${YELLOW}💡 Run: ./scripts/validate-ports.sh for detailed conflict analysis${NC}"
        exit 1
    fi
}

# Show usage if requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "TekupDK Pre-Start Port Validation Script"
    echo "========================================"
    echo "Validates port availability before starting docker-compose services"
    echo ""
    echo "Usage:"
    echo "  ./scripts/check-ports.sh [compose-file]"
    echo ""
    echo "Arguments:"
    echo "  compose-file    Docker compose file to validate (default: docker-compose.mobile.yml)"
    echo ""
    echo "Examples:"
    echo "  ./scripts/check-ports.sh"
    echo "  ./scripts/check-ports.sh docker-compose.mobile.yml"
    echo "  ./scripts/check-ports.sh apps/rendetalje/services/calendar-mcp/docker-compose.yml"
    echo ""
    echo "Exit codes:"
    echo "  0    Validation passed"
    echo "  1    Validation failed (ports in use)"
    exit 0
fi

# Run main function
main "$@"
#!/bin/bash

# TekupDK Port Conflict Detection Script
# Validates port usage across all docker-compose files
# Usage: ./scripts/validate-ports.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Port registry - maps ports to services
declare -A PORT_REGISTRY
declare -A CONFLICTS_FOUND

echo -e "${BLUE}🔍 TekupDK Port Conflict Detection${NC}"
echo "======================================"

# Function to extract ports from docker-compose.yml
extract_ports() {
    local compose_file="$1"
    local service_name="$2"

    if [[ ! -f "$compose_file" ]]; then
        echo -e "${YELLOW}⚠️  Warning: $compose_file not found${NC}"
        return
    fi

    echo -e "${BLUE}📄 Analyzing: $compose_file${NC}"

    # Extract port mappings using yq or grep/sed fallback
    if command -v yq &> /dev/null; then
        # Use yq if available (more reliable)
        local ports
        ports=$(yq eval '.services.*.ports // [] | .[]' "$compose_file" 2>/dev/null || echo "")
    else
        # Fallback to grep/sed
        local ports
        ports=$(grep -A 10 "ports:" "$compose_file" | grep -E '^[[:space:]]*-[[:space:]]*"[^"]*:[^"]*"' | sed 's/.*"//' | sed 's/".*//' || echo "")
    fi

    # Process each port mapping
    while IFS= read -r port_mapping; do
        if [[ -n "$port_mapping" ]]; then
            # Extract external port (before colon)
            local external_port
            external_port=$(echo "$port_mapping" | cut -d':' -f1 | tr -d ' ')

            # Handle variable substitution (e.g., ${PORT:-3001})
            if [[ "$external_port" =~ \$\{.*\} ]]; then
                # Try to extract default value
                external_port=$(echo "$external_port" | sed 's/.*:-//' | sed 's/}.*//')
            fi

            # Skip if not a number
            if ! [[ "$external_port" =~ ^[0-9]+$ ]]; then
                continue
            fi

            # Check for conflicts
            if [[ -n "${PORT_REGISTRY[$external_port]}" ]]; then
                CONFLICTS_FOUND[$external_port]="${PORT_REGISTRY[$external_port]} vs $service_name ($compose_file)"
                echo -e "${RED}❌ Conflict: Port $external_port used by ${PORT_REGISTRY[$external_port]} and $service_name${NC}"
            else
                PORT_REGISTRY[$external_port]="$service_name ($compose_file)"
                echo -e "${GREEN}✅ Port $external_port: $service_name${NC}"
            fi
        fi
    done <<< "$ports"
}

# Main validation function
validate_all_compose_files() {
    echo -e "\n${BLUE}🔍 Scanning Docker Compose Files${NC}"
    echo "=================================="

    # List of docker-compose files to check
    local compose_files=(
        "docker-compose.mobile.yml:Rendetalje Mobile"
        "apps/rendetalje/services/calendar-mcp/docker-compose.yml:Calendar MCP"
        "tekup-mcp-servers/docker-compose.yml:Tekup MCP Servers"
        "services/tekup-gmail-services/docker-compose.yml:Gmail Services"
    )

    for compose_entry in "${compose_files[@]}"; do
        IFS=':' read -r file_path service_name <<< "$compose_entry"
        extract_ports "$PROJECT_ROOT/$file_path" "$service_name"
    done
}

# Generate report
generate_report() {
    echo -e "\n${BLUE}📊 Port Allocation Report${NC}"
    echo "=========================="

    echo -e "\n${GREEN}✅ Valid Ports:${NC}"
    for port in $(echo "${!PORT_REGISTRY[@]}" | tr ' ' '\n' | sort -n); do
        if [[ -z "${CONFLICTS_FOUND[$port]}" ]]; then
            echo "  $port: ${PORT_REGISTRY[$port]}"
        fi
    done

    if [[ ${#CONFLICTS_FOUND[@]} -gt 0 ]]; then
        echo -e "\n${RED}❌ Port Conflicts:${NC}"
        for port in $(echo "${!CONFLICTS_FOUND[@]}" | tr ' ' '\n' | sort -n); do
            echo "  $port: ${CONFLICTS_FOUND[$port]}"
        done
        return 1
    else
        echo -e "\n${GREEN}🎉 No port conflicts detected!${NC}"
        return 0
    fi
}

# Check system ports
check_system_ports() {
    echo -e "\n${BLUE}🔍 Checking System Port Usage${NC}"
    echo "==============================="

    local system_conflicts=()

    for port in "${!PORT_REGISTRY[@]}"; do
        if [[ -z "${CONFLICTS_FOUND[$port]}" ]]; then
            # Check if port is in use on the system (cross-platform)
                    if command -v netstat &> /dev/null; then
                        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                            system_conflicts+=("$port")
                            echo -e "${YELLOW}⚠️  Port $port is already in use on system${NC}"
                        fi
                    elif command -v ss &> /dev/null; then
                        if ss -tuln 2>/dev/null | grep -q ":$port "; then
                            system_conflicts+=("$port")
                            echo -e "${YELLOW}⚠️  Port $port is already in use on system${NC}"
                        fi
                    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
                        # Windows-specific port checking
                        if command -v netstat &> /dev/null; then
                            if netstat -ano 2>/dev/null | findstr ":$port " > /dev/null; then
                                system_conflicts+=("$port")
                                echo -e "${YELLOW}⚠️  Port $port is already in use on system${NC}"
                            fi
                        fi
                    fi
        fi
    done

    if [[ ${#system_conflicts[@]} -eq 0 ]]; then
        echo -e "${GREEN}✅ No system port conflicts detected${NC}"
    fi
}

# Main execution
main() {
    validate_all_compose_files
    check_system_ports

    if generate_report; then
        echo -e "\n${GREEN}✅ Port validation completed successfully${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Port conflicts found! Please resolve before starting services.${NC}"
        echo -e "${YELLOW}💡 Check PORT_ALLOCATION_MASTER.md for port assignments${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
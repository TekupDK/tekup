#!/bin/bash

# Friday AI Chat Testing Script
# Tests various scenarios to verify functionality

set -e

BASE_URL="http://localhost:3011"
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}=== Friday AI Chat Testing Script ===${NC}\n"

# Function to test chat endpoint
test_chat() {
    local test_name="$1"
    local message="$2"
    local expected_intent="$3"
    
    echo -e "${YELLOW}Testing: ${test_name}${NC}"
    echo "Message: $message"
    
    response=$(curl -s -X POST "$BASE_URL/chat" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$message\"}")
    
    echo "Response:"
    echo "$response" | jq '.'
    
    if [ ! -z "$expected_intent" ]; then
        actual_intent=$(echo "$response" | jq -r '.metrics.intent')
        if [ "$actual_intent" == "$expected_intent" ]; then
            echo -e "${GREEN}✓ Intent matched: $expected_intent${NC}\n"
        else
            echo -e "${RED}✗ Intent mismatch. Expected: $expected_intent, Got: $actual_intent${NC}\n"
        fi
    else
        echo ""
    fi
}

# Check if service is running
echo "Checking if Friday AI service is running..."
if ! curl -s "$BASE_URL/health" > /dev/null; then
    echo -e "${RED}Error: Friday AI service is not running at $BASE_URL${NC}"
    echo "Please start the service first with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Service is running${NC}\n"

# Test 1: Lead Processing
test_chat "1. New Leads Check" \
    "Hvad har vi fået af nye leads i dag?" \
    "lead_processing"

# Test 2: Booking Intent
test_chat "2. Booking Request" \
    "Jeg vil gerne booke en rengøring på fredag" \
    "booking"

# Test 3: Quote Generation
test_chat "3. Quote Request" \
    "Lav et tilbud til en kunde med 120m² lejlighed" \
    "quote_generation"

# Test 4: Conflict Resolution
test_chat "4. Customer Complaint" \
    "Kunden klager over prisen og vil have rabat" \
    "conflict_resolution"

# Test 5: Calendar Query
test_chat "5. Today's Tasks" \
    "Hvad er vores opgaver i dag?" \
    "calendar_query"

# Test 6: Follow-up
test_chat "6. Follow-up Request" \
    "Følg op på de tilbud vi sendte sidste uge" \
    "follow_up"

# Test 7: General Query
test_chat "7. General Help" \
    "Hvad kan du hjælpe mig med?" \
    "general"

# Test 8: Complex Scenario
test_chat "8. Complex Multi-Intent" \
    "Jeg vil gerne tjekke vores nye leads fra Rengøring.nu i dag og lave tilbud til dem" \
    ""

# Test 9: Time-sensitive Query
test_chat "9. Time-sensitive" \
    "Er der nogen bookings der starter om 2 timer?" \
    "calendar_query"

# Test 10: Error Handling - Empty Message
echo -e "${YELLOW}Testing: 10. Empty Message (Error Handling)${NC}"
response=$(curl -s -X POST "$BASE_URL/chat" \
    -H "Content-Type: application/json" \
    -d '{"message": ""}')
echo "Response:"
echo "$response" | jq '.'
if echo "$response" | jq -e '.error' > /dev/null; then
    echo -e "${GREEN}✓ Correctly returned error for empty message${NC}\n"
else
    echo -e "${RED}✗ Should return error for empty message${NC}\n"
fi

# Test 11: Error Handling - Too Long Message
echo -e "${YELLOW}Testing: 11. Too Long Message (Error Handling)${NC}"
long_message=$(printf 'a%.0s' {1..5001})
response=$(curl -s -X POST "$BASE_URL/chat" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"$long_message\"}")
echo "Response:"
echo "$response" | jq '.'
if echo "$response" | jq -e '.error' > /dev/null; then
    echo -e "${GREEN}✓ Correctly returned error for too long message${NC}\n"
else
    echo -e "${RED}✗ Should return error for message > 5000 chars${NC}\n"
fi

# Test Metrics Endpoints
echo -e "${YELLOW}Testing: 12. Metrics Summary${NC}"
metrics=$(curl -s "$BASE_URL/metrics")
echo "Metrics Summary:"
echo "$metrics" | jq '.'
echo ""

echo -e "${YELLOW}Testing: 13. Health Check${NC}"
health=$(curl -s "$BASE_URL/health")
echo "Health:"
echo "$health" | jq '.'
echo ""

# Summary
echo -e "${BOLD}${GREEN}=== Testing Complete ===${NC}"
echo ""
echo "To export metrics, run:"
echo "  curl -O $BASE_URL/metrics/export"
echo ""
echo "To monitor in real-time:"
echo "  watch -n 5 'curl -s $BASE_URL/metrics | jq .'"

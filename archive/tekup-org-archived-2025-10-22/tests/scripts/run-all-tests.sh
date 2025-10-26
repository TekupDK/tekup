#!/bin/bash

# TekUp Phase 2 - Comprehensive Test Suite Runner
echo "🚀 Starting TekUp Phase 2 Comprehensive Test Suite"

# Set test environment
export NODE_ENV=test
export DATABASE_URL="postgresql://test:test@localhost:5432/tekup_test"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Setup test database
echo "Setting up test database..."
npm run setup:test-db

# Run unit tests for all apps
echo "🧪 Running Unit Tests..."
print_status "Testing FoodTruck OS Backend"
npx jest --testPathPattern="unit/foodtruck-os-backend" --verbose

print_status "Testing FoodTruck OS Frontend"
npx jest --testPathPattern="unit/foodtruck-os-frontend" --verbose

print_status "Testing RendetaljeOS Backend"
npx jest --testPathPattern="unit/rendetalje-os-backend" --verbose

print_status "Testing RendetaljeOS Frontend"
npx jest --testPathPattern="unit/rendetalje-os-frontend" --verbose

print_status "Testing EssenzaPro Backend"
npx jest --testPathPattern="unit/essenza-pro-backend" --verbose

print_status "Testing EssenzaPro Frontend"
npx jest --testPathPattern="unit/essenza-pro-frontend" --verbose

print_status "Testing MCP Studio Backend"
npx jest --testPathPattern="unit/mcp-studio-backend" --verbose

print_status "Testing MCP Studio Frontend"
npx jest --testPathPattern="unit/mcp-studio-frontend" --verbose

# Run API integration tests
echo "🔗 Running API Integration Tests..."
npx jest --testPathPattern="api" --verbose

# Run E2E tests
echo "🎭 Running E2E Tests..."
print_status "Starting frontend applications..."

# Start all frontend apps in background
pnpm run dev:foodtruck-os-frontend &
FOODTRUCK_PID=$!

pnpm run dev:rendetalje-os-frontend &
RENDETALJE_PID=$!

pnpm run dev:essenza-pro-frontend &
ESSENZA_PID=$!

pnpm run dev:mcp-studio-frontend &
MCP_PID=$!

# Wait for apps to start
sleep 10

# Run Playwright tests
npx playwright test --config=test.config.ts

# Kill background processes
kill $FOODTRUCK_PID $RENDETALJE_PID $ESSENZA_PID $MCP_PID

# Generate coverage reports
echo "📊 Generating Coverage Reports..."
npx jest --coverage --coverageDirectory=coverage

# Cleanup test database
npm run cleanup:test-db

echo "✅ All tests completed!"
echo "📋 Test results available in:"
echo "   - Unit Tests: coverage/"
echo "   - E2E Tests: test-results/"
echo "   - Reports: test-results/junit.xml"

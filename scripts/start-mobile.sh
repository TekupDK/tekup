#!/bin/bash

# 🚀 Start RendetaljeOS Mobile Development (Mac/Linux)
#
# Dette script starter hele mobile development stack

set -e

echo "🚀 RendetaljeOS Mobile Development Starter"
echo "========================================="
echo ""

# Check Docker is running
echo "✓ Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "✗ Docker is not running!"
    echo "  Please start Docker and try again."
    exit 1
fi
echo "✓ Docker is running"

# Get local IP address
echo ""
echo "🌐 Finding your local IP address..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
else
    # Linux
    IP_ADDRESS=$(hostname -I | awk '{print $1}')
fi

if [ -z "$IP_ADDRESS" ]; then
    echo "✗ Could not find IP address automatically"
    read -p "Please enter your IP address manually (e.g., 192.168.1.100): " IP_ADDRESS
else
    echo "✓ Your IP address: $IP_ADDRESS"
fi

# Set environment variable
export HOST_IP=$IP_ADDRESS

# Display setup info
echo ""
echo "📱 Mobile App Configuration:"
echo "   Backend API: http://${IP_ADDRESS}:3001"
echo "   Expo Server: exp://${IP_ADDRESS}:19000"
echo "   Web DevTools: http://localhost:19002"
echo ""

# Ask to continue
echo "Ready to start? This will:"
echo "  1. Start PostgreSQL database"
echo "  2. Start Redis cache"
echo "  3. Start NestJS backend API"
echo "  4. Start Expo development server"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Start Docker Compose
echo ""
echo "🐳 Starting Docker containers..."
echo "This may take a few minutes on first run..."
echo ""

# Trap CTRL+C to cleanup
trap 'echo ""; echo "Shutting down..."; docker-compose -f docker-compose.mobile.yml down; exit' INT

docker-compose -f docker-compose.mobile.yml up

# Cleanup on exit
echo ""
echo "Shutting down..."
docker-compose -f docker-compose.mobile.yml down

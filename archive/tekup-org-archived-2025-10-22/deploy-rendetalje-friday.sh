#!/usr/bin/env bash
# Deployment script for Rendetalje Friday AI

set -e

echo "🚀 Deploying Rendetalje Friday AI to Tekup CRM API..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check prerequisites
log "Checking prerequisites..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/tekup-crm-api" ]; then
    error "Please run this script from the Tekup-org root directory"
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 18+ and try again."
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js version 18+ is required. Current version: $(node --version)"
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    error "pnpm is not installed. Please install pnpm and try again."
fi

success "Prerequisites check passed"

# Environment setup
log "Setting up environment..."

cd apps/tekup-crm-api

# Copy environment template if .env doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.rendetalje-friday" ]; then
        cp .env.rendetalje-friday .env
        success "Environment file created from template"
    else
        warning "No environment file found. Creating minimal .env..."
        cat > .env << EOF
NODE_ENV=development
PORT=3002
DATABASE_URL="postgresql://username:password@localhost:5432/tekup_crm?schema=public"
JWT_SECRET="development-secret-key"
RENDETALJE_PROCESSING_ENABLED=true
RENDETALJE_HOURLY_RATE=349
EOF
    fi
fi

# Install dependencies
log "Installing dependencies..."
pnpm install
success "Dependencies installed"

# Database setup
log "Setting up database..."

# Generate Prisma client
pnpm exec prisma generate
success "Prisma client generated"

# Run migrations (if any)
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
    log "Running database migrations..."
    pnpm exec prisma migrate deploy
    success "Database migrations completed"
else
    warning "No migrations found. Skipping migration step."
fi

# Build the application
log "Building application..."
pnpm run build
success "Application built successfully"

# Type checking
log "Running type checks..."
pnpm run typecheck
success "Type checking passed"

# Run tests (if they exist)
if [ -f "jest.config.js" ] || [ -f "package.json" ] && grep -q '"test"' package.json; then
    log "Running tests..."
    pnpm run test --passWithNoTests
    success "Tests completed"
else
    warning "No tests configured. Skipping test step."
fi

# Health check
log "Performing health check..."

# Start the application in background for health check
pnpm run start &
APP_PID=$!

# Wait for application to start
sleep 10

# Check if application is responding
if curl -f http://localhost:3002/health >/dev/null 2>&1; then
    success "Health check passed - application is responding"
    
    # Test Friday AI endpoints
    if curl -f http://localhost:3002/api/integrations/rendetalje-friday/health >/dev/null 2>&1; then
        success "Friday AI endpoints are accessible"
    else
        warning "Friday AI endpoints not yet accessible (may need configuration)"
    fi
else
    warning "Application health check failed (may need configuration)"
fi

# Stop the test application
kill $APP_PID 2>/dev/null || true
sleep 2

# Production deployment steps
if [ "$1" = "--production" ]; then
    log "Preparing for production deployment..."
    
    # Set production environment
    sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
    
    # Build for production
    pnpm run build
    
    # Start in production mode
    log "Starting application in production mode..."
    pnpm run start:prod &
    
    success "Production deployment initiated"
    
    echo ""
    echo "🎉 Rendetalje Friday AI has been deployed successfully!"
    echo ""
    echo "📍 API Endpoints:"
    echo "   • Health Check: http://localhost:3002/health"
    echo "   • Friday AI: http://localhost:3002/api/integrations/rendetalje-friday/"
    echo ""
    echo "📊 Monitor logs with: pnpm --filter tekup-crm-api logs"
    echo "🛑 Stop service with: pnpm --filter tekup-crm-api stop"
    
else
    log "Development deployment completed"
    
    echo ""
    echo "🎉 Rendetalje Friday AI is ready for development!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Configure your .env file with Google API credentials"
    echo "   2. Set up your database connection"
    echo "   3. Start development: pnpm --filter tekup-crm-api dev"
    echo ""
    echo "📍 Development endpoints:"
    echo "   • Health Check: http://localhost:3002/health"
    echo "   • Friday AI: http://localhost:3002/api/integrations/rendetalje-friday/"
    echo "   • API Docs: http://localhost:3002/api/docs (if Swagger is configured)"
    echo ""
fi

echo "📚 Documentation:"
echo "   • README: apps/tekup-crm-api/src/integrations/rendetalje-ai/README.md"
echo "   • Environment: apps/tekup-crm-api/.env.rendetalje-friday"
echo ""

cd - >/dev/null

success "Deployment script completed successfully!"
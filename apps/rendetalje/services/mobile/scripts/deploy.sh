#!/bin/bash

# RendetaljeOS Mobile App Deployment Script
# This script automates the build and deployment process for both iOS and Android

set -e

echo "🚀 Starting RendetaljeOS Mobile App Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the mobile directory"
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    print_error "EAS CLI is not installed. Please run: npm install -g @expo/eas-cli"
    exit 1
fi

# Check if user is logged in to Expo
if ! eas whoami &> /dev/null; then
    print_error "Please login to Expo: eas login"
    exit 1
fi

# Parse command line arguments
PLATFORM="all"
PROFILE="production"
SUBMIT=false
CLEAR_CACHE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --profile)
            PROFILE="$2"
            shift 2
            ;;
        --submit)
            SUBMIT=true
            shift
            ;;
        --clear-cache)
            CLEAR_CACHE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --platform PLATFORM    Build platform (ios, android, all) [default: all]"
            echo "  --profile PROFILE      Build profile (development, preview, production) [default: production]"
            echo "  --submit               Submit to app stores after building"
            echo "  --clear-cache          Clear build cache before building"
            echo "  --help                 Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

print_status "Configuration:"
print_status "  Platform: $PLATFORM"
print_status "  Profile: $PROFILE"
print_status "  Submit: $SUBMIT"
print_status "  Clear Cache: $CLEAR_CACHE"
echo ""

# Validate platform
if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "android" && "$PLATFORM" != "all" ]]; then
    print_error "Invalid platform: $PLATFORM. Must be 'ios', 'android', or 'all'"
    exit 1
fi

# Validate profile
if [[ "$PROFILE" != "development" && "$PROFILE" != "preview" && "$PROFILE" != "production" ]]; then
    print_error "Invalid profile: $PROFILE. Must be 'development', 'preview', or 'production'"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci
print_success "Dependencies installed"

# Clear cache if requested
if [ "$CLEAR_CACHE" = true ]; then
    print_status "Clearing build cache..."
    eas build:cancel --all --non-interactive || true
    print_success "Build cache cleared"
fi

# Build function
build_platform() {
    local platform=$1
    print_status "Building for $platform..."
    
    local cache_flag=""
    if [ "$CLEAR_CACHE" = true ]; then
        cache_flag="--clear-cache"
    fi
    
    if eas build --platform "$platform" --profile "$PROFILE" --non-interactive $cache_flag; then
        print_success "$platform build completed successfully"
        return 0
    else
        print_error "$platform build failed"
        return 1
    fi
}

# Submit function
submit_platform() {
    local platform=$1
    print_status "Submitting $platform to store..."
    
    if eas submit --platform "$platform" --profile "$PROFILE" --non-interactive --latest; then
        print_success "$platform submitted successfully"
        return 0
    else
        print_error "$platform submission failed"
        return 1
    fi
}

# Build apps
BUILD_SUCCESS=true

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
    if ! build_platform "ios"; then
        BUILD_SUCCESS=false
    fi
fi

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
    if ! build_platform "android"; then
        BUILD_SUCCESS=false
    fi
fi

if [ "$BUILD_SUCCESS" = false ]; then
    print_error "One or more builds failed"
    exit 1
fi

print_success "All builds completed successfully!"

# Submit to stores if requested
if [ "$SUBMIT" = true ]; then
    print_status "Submitting to app stores..."
    
    SUBMIT_SUCCESS=true
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
        if ! submit_platform "ios"; then
            SUBMIT_SUCCESS=false
        fi
    fi
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
        if ! submit_platform "android"; then
            SUBMIT_SUCCESS=false
        fi
    fi
    
    if [ "$SUBMIT_SUCCESS" = false ]; then
        print_error "One or more submissions failed"
        exit 1
    fi
    
    print_success "All submissions completed successfully!"
fi

# Final status
echo ""
print_success "🎉 RendetaljeOS Mobile App Deployment Complete!"
echo ""
print_status "Next steps:"
if [ "$SUBMIT" = true ]; then
    print_status "  1. Monitor app store review status"
    print_status "  2. Check EAS dashboard for build details"
    print_status "  3. Prepare for app store optimization"
else
    print_status "  1. Test the built app"
    print_status "  2. Submit to app stores when ready: $0 --submit"
    print_status "  3. Monitor build status on EAS dashboard"
fi
echo ""
print_status "Useful commands:"
print_status "  eas build:list                    # List all builds"
print_status "  eas submission:list                # List all submissions"
print_status "  eas build:view [BUILD_ID]          # View build details"
print_status "  eas submit --platform all --latest # Submit latest builds"
echo ""
print_success "Happy deploying! 🚀"
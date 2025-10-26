#!/bin/sh
# CodebuffAI Pre-push Hook
# Comprehensive testing before pushing to remote

echo "🚀 Running CodebuffAI pre-push checks..."

# Exit on any error
set -e

# Load environment
if [ -f ".codebuff/environment.env" ]; then
    source .codebuff/environment.env
fi

# Check if CodebuffAI is available
if ! command -v codebuff &> /dev/null; then
    echo "⚠️  CodebuffAI CLI not found - running standard checks only"
    
    # Run standard build check
    echo "🔨 Running build check..."
    pnpm build
    
    echo "✅ Standard pre-push checks passed"
    exit 0
fi

# Test agent integrations
echo "🤖 Testing agent integrations..."
codebuff test --config=".codebuff/agent-config.json" || {
    echo "❌ Agent integration tests failed"
    echo "💡 Check agent configurations and retry"
    exit 1
}

# Verify all configurations are valid
echo "⚙️  Validating configurations..."
for config_file in .codebuff/*.json; do
    if [ -f "$config_file" ]; then
        echo "  Validating $(basename "$config_file")..."
        codebuff validate-config "$config_file" || {
            echo "❌ Configuration validation failed: $config_file"
            exit 1
        }
    fi
done

# Test database connections if available
if [ -n "$DATABASE_URL" ]; then
    echo "📊 Testing database connectivity..."
    codebuff test-db --config=".codebuff/database-config.json" || {
        echo "⚠️  Database connectivity test failed (non-blocking)"
    }
fi

# Test AgentScope integration if running
if curl -s -f "$AGENTSCOPE_URL/health" > /dev/null 2>&1; then
    echo "🧠 Testing AgentScope integration..."
    codebuff test-agentscope --config=".codebuff/agentscope-integration.json" || {
        echo "⚠️  AgentScope integration test failed (non-blocking)"
    }
else
    echo "ℹ️  AgentScope not running - skipping integration test"
fi

# Run full build to ensure everything works
echo "🔨 Running full build..."
pnpm build || {
    echo "❌ Build failed"
    exit 1
}

# Run critical tests
echo "🧪 Running critical tests..."
pnpm test:ci || {
    echo "❌ Tests failed"
    exit 1
}

echo "✅ All pre-push checks passed!"
echo "🎉 Ready to push to remote"

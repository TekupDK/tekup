#!/bin/sh
# CodebuffAI Pre-commit Hook
# Ensures code quality and consistency across the Tekup monorepo

echo "🤖 Running CodebuffAI pre-commit checks..."

# Exit on any error
set -e

# Load CodebuffAI environment
if [ -f ".codebuff/environment.env" ]; then
    source .codebuff/environment.env
    echo "✅ Loaded CodebuffAI environment"
else
    echo "⚠️  No CodebuffAI environment file found"
fi

# Run lint-staged first (existing setup)
echo "🔍 Running lint-staged..."
npx lint-staged

# Check if CodebuffAI is available
if ! command -v codebuff &> /dev/null; then
    echo "⚠️  CodebuffAI CLI not found - skipping agent checks"
    exit 0
fi

# Run monorepo consistency checks
echo "🏗️  Running monorepo consistency checks..."
codebuff run monorepo-consistency-agent --task="pre-commit-check" --config=".codebuff/agent-config.json" || {
    echo "❌ Consistency checks failed"
    echo "💡 Run 'codebuff run monorepo-consistency-agent --task=\"fix-issues\"' to auto-fix some issues"
    exit 1
}

# Validate Tailwind CSS patterns (non-blocking)
echo "🎨 Validating Tailwind CSS 4.1 patterns..."
if ! codebuff validate --config=".codebuff/jarvis-frontend-patterns.json" --silent; then
    echo "⚠️  Some Tailwind patterns may not follow the design system"
    echo "💡 Check .codebuff/jarvis-frontend-patterns.json for guidelines"
fi

# Check database schema consistency if Prisma files changed
if git diff --cached --name-only | grep -q "\.prisma$"; then
    echo "📊 Validating database schema..."
    codebuff check --type=database --validate-schema --config=".codebuff/database-config.json" || {
        echo "❌ Database schema validation failed"
        exit 1
    }
fi

# Final success message
echo "✅ All pre-commit checks passed!"
echo "🚀 Ready to commit"

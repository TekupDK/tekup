#!/bin/sh
# CodebuffAI Commit Message Hook
# Validates commit message format and suggests improvements

commit_msg_file="$1"

echo "📝 Validating commit message..."

# Check if CodebuffAI is available
if ! command -v codebuff &> /dev/null; then
    echo "ℹ️  CodebuffAI CLI not found - skipping enhanced validation"
    exit 0
fi

# Load environment
if [ -f ".codebuff/environment.env" ]; then
    source .codebuff/environment.env
fi

# Read the commit message
commit_msg=$(cat "$commit_msg_file")

# Skip validation for merge commits, revert commits, etc.
if echo "$commit_msg" | grep -qE "^(Merge|Revert|fixup!|squash!)"; then
    echo "ℹ️  Skipping validation for special commit type"
    exit 0
fi

# Run CodebuffAI commit message validation (non-blocking)
if ! codebuff validate-commit --msg="$commit_msg" --config=".codebuff/agent-config.json" 2>/dev/null; then
    echo "💡 Commit message suggestions:"
    echo "   - Use conventional format: type(scope): description"
    echo "   - Types: feat, fix, docs, style, refactor, test, chore"
    echo "   - Keep first line under 50 characters"
    echo "   - Use present tense and imperative mood"
    echo ""
    echo "   Examples:"
    echo "   feat(leads): add lead scoring algorithm"
    echo "   fix(api): resolve tenant isolation issue"
    echo "   docs(readme): update installation instructions"
    echo ""
    echo "⚠️  Consider improving your commit message for better maintainability"
fi

echo "✅ Commit message validation complete"
exit 0

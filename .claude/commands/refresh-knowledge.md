# Refresh Workspace Knowledge

Re-index all documentation and update knowledge base.

## Process

1. **Re-scan .md files**
   - Run glob pattern: `**/*.md`
   - Filter out node_modules
   - Categorize by patterns
   - Update KNOWLEDGE_INDEX.json

2. **Extract new learnings**
   - Scan recently modified .md files (last 7 days)
   - Parse for new common issues/solutions
   - Extract code patterns
   - Update WORKSPACE_KNOWLEDGE_BASE.json

3. **Sync to TekupVault**
   - Upload new docs to semantic search
   - Tag with "workspace-knowledge"
   - Update embeddings

4. **Generate knowledge diff**
   - Compare with previous KNOWLEDGE_INDEX.json
   - Report new docs added
   - Report categories changed

## Output

```markdown
# Knowledge Refresh Complete

## Statistics
- Total docs: {count}
- New docs: {count}
- Updated docs: {count}
- Categories: {count}

## New Learnings
{List significant new patterns/issues discovered}

## Sync Status
✅ Knowledge index updated
✅ Workspace knowledge base updated  
✅ TekupVault synced (if configured)
```

## Schedule

Recommend running:

- After major feature completion
- Weekly (Monday mornings)
- After adding significant documentation

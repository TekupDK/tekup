# Ask Workspace (Knowledge-First Q&A)

Answer questions using workspace knowledge BEFORE asking user.

## Arguments

- `question`: User's question (required)

## Search Process

### Step 1: Semantic Analysis

Analyze question to determine category:

- Setup/configuration → search setup_guides
- Errors/problems → search troubleshooting
- How it works → search architecture
- Testing → search testing docs
- Git/branching → check GIT_STATUS_REPORT.json
- TypeScript errors → check TYPESCRIPT_FIX_STATUS.md

### Step 2: Multi-Source Search

**A. Structured Data (Exact match)**

1. GIT_STATUS_REPORT.json
2. TYPESCRIPT_FIX_STATUS.md
3. REMAINING_TYPESCRIPT_ERRORS.json  
4. WORKSPACE_KNOWLEDGE_BASE.json

**B. Documentation (Fuzzy search)**
5. Load KNOWLEDGE_INDEX.json
6. Search relevant category .md files
7. Extract matching sections

**C. TekupVault MCP (Semantic)**
8. If TekupVault configured, semantic search
9. Return top results

**D. Code Search (If question about code)**
10. Use Grep tool to search codebase
11. Find relevant code examples

### Step 3: Synthesize Answer

Combine results from all sources:

- Priority: Structured data > Recent docs > General docs > Code
- Include source references: "Found in {file}"
- If conflicting info, note which is most recent

### Step 4: Confidence Rating

Rate answer confidence:

- ✅ **High**: Found in multiple sources, recent docs
- ⚠️ **Medium**: Found in docs but may be outdated
- ❌ **Low**: No relevant docs found

## Output Format

```markdown
# Answer: "{question}"

**Confidence:** ✅ High / ⚠️ Medium / ❌ Low

## Answer
{Synthesized answer from knowledge sources}

## Sources
1. {file or knowledge base entry}
2. {file or knowledge base entry}

## Additional Context (if relevant)
{Related information that might be helpful}

---

Note: If confidence is Low, user may need to provide additional context or consult external docs.
```

## Fallback

Only if confidence = Low AND no sources found:
"I couldn't find this in workspace docs. Could you clarify or should I search external sources?"

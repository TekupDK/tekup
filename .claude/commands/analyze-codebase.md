# Analyze Codebase

Deep dive analysis of codebase structure, patterns, and health.

## Analysis Areas

### 1. Structure Analysis

- Directory organization
- File count per module
- Lines of code statistics
- Dependency graph

### 2. Code Health

- TypeScript error count: `npx tsc --noEmit`
- ESLint issues: `npx eslint . --ext .ts,.tsx`
- Test coverage: `npm test -- --coverage`
- Outdated dependencies: `npm outdated`

### 3. Pattern Detection

- Common code patterns
- Repeated logic (refactoring opportunities)
- Architectural patterns used
- Anti-patterns detected

### 4. Documentation Coverage

- README completeness per module
- API documentation (Swagger/JSDoc)
- Inline comments ratio
- Type documentation

### 5. Technical Debt

- TODO/FIXME count and locations
- @ts-ignore count and reasons
- console.log() in production code
- Deprecated API usage

## Output

Generate comprehensive JSON report: `CODEBASE_ANALYSIS.json`

```json
{
  "generatedAt": "...",
  "statistics": {...},
  "health": {
    "typeScriptErrors": 46,
    "testCoverage": "X%",
    "lintIssues": Y
  },
  "patterns": [...],
  "technicalDebt": {...},
  "recommendations": [...]
}
```

And markdown summary: `CODEBASE_ANALYSIS.md`

## Knowledge Integration

Save analysis to WORKSPACE_KNOWLEDGE_BASE.json under "architecturePatterns".

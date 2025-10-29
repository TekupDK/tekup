## Pull Request: Merge Checklist

This pull request is ready for review. Before merging, please ensure all checks are complete.

### PR Information

**Type:** [feat | fix | docs | style | refactor | perf | test | chore | ci | build | revert]  
**Scope:** [vault | billy | rendetalje | cloud-dashboard | ai | mcp | docs | ci | deps | other]  
**Related Issues:** Closes #[issue number]

### Description

[Provide a brief description of the changes in this pull request. Explain *what* and *why*, not *how*.]

### Changes Made

- 
- 
- 

### Reviewer Checklist

#### Code Quality
- [ ] **Commits:** All commits follow [conventional commit format](../docs/CONVENTIONAL_COMMITS.md)
- [ ] **TypeScript Compilation:** The code compiles without errors
- [ ] **Linting:** ESLint/Prettier checks pass
- [ ] **Tests:** New tests added for new features/fixes
- [ ] **Coverage:** Test coverage maintained or improved

#### Build & Deploy
- [ ] **Docker Build:** `docker-compose` build completes successfully (if applicable)
- [ ] **CI Tests:** All tests pass in the continuous integration pipeline
- [ ] **Breaking Changes:** Breaking changes are documented in commit footer

#### Documentation & Process
- [ ] **Documentation:** All relevant documentation has been updated
- [ ] **Changelog:** Changes are reflected in CHANGELOG.md (if applicable)
- [ ] **Migrations:** Database migrations are included and tested (if applicable)
- [ ] **Environment Variables:** New env vars documented in README or .env.example

#### Security & Compliance
- [ ] **Secrets:** No credentials or secrets exposed
- [ ] **Dependencies:** No known vulnerabilities in new dependencies
- [ ] **CODEOWNERS:** Correct reviewers assigned per CODEOWNERS

### Testing Evidence

[Provide screenshots, logs, or test results demonstrating the changes work as expected]

### Deployment Notes

[Any special deployment steps, rollback procedures, or monitoring considerations]

---

**Reviewer Notes:**  
<!-- For reviewers: Add comments, concerns, or approval notes here -->

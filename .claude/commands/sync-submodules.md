# Synchronize Git Submodules

Update and synchronize all git submodules in Tekup Portfolio workspace.

## Execution

1. **Check current status**
   ```bash
   git submodule status
   ```

2. **Update all submodules**
   ```bash
   git submodule update --remote --recursive
   ```

3. **Check for changes in submodules**
   ```bash
   cd services/tekup-ai && git status
   cd ../tekup-gmail-services && git status  
   cd ../../tekup-secrets && git status
   cd ../../apps/web/tekup-cloud-dashboard && git status
   ```

4. **Analyze results**
   - Which submodules are ahead/behind?
   - Any uncommitted changes in submodules?
   - Any conflicts?

5. **Update parent repo pointers**
   ```bash
   cd C:/Users/Jonas-dev/tekup
   git add services/tekup-ai services/tekup-gmail-services tekup-secrets
   git commit -m "chore: update submodule references"
   git push
   ```

## Output

Generate sync report:

```markdown
# Submodule Sync Report

## Submodule Status
- services/tekup-ai: {status}
- services/tekup-gmail-services: {status}
- tekup-secrets: {status}
- apps/web/tekup-cloud-dashboard: {status}

## Actions Taken
[List of updates performed]

## Recommendations
[Any manual actions needed]
```

## Knowledge Reference

Check GIT_STATUS_REPORT.json for current submodule states before syncing.

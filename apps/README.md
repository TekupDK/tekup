# Tekup Apps

This folder contains all Tekup applications organized by runtime.

## Structure

```
apps/
├── production/    - Live production services
├── web/          - Web applications
└── desktop/      - Desktop applications
```

## Production Services

Clone these repositories into `apps/production/`:

```bash
cd apps/production
gh repo clone TekupDK/tekup-database
gh repo clone TekupDK/tekup-vault
gh repo clone TekupDK/tekup-billy
```

## Web Applications

Clone these repositories into `apps/web/`:

```bash
cd apps/web
gh repo clone TekupDK/rendetalje-os
gh repo clone TekupDK/tekup-cloud-dashboard
```

## Desktop Applications

Clone these repositories into `apps/desktop/`:

```bash
cd apps/desktop
gh repo clone TekupDK/agent-orchestrator
```

## See Also

- [Complete setup guide](../README_PC2_QUICK_START.md)
- [GitHub organization guide](../docs/GITHUB_ORGANIZATION_SETUP_GUIDE.md)

# Tekup Platform

This repository contains the full source code and documentation for the Tekup platform, a comprehensive suite of tools for managing and operating a modern business.

## Quick Start

### Prerequisites
- Node.js 20+ (LTS)
- pnpm 10.17.0+ (enforced via `packageManager` field)
- Git with conventional commit support

### Installation

```powershell
# Clone repository
git clone https://github.com/TekupDK/tekup.git
cd tekup

# Install dependencies (also sets up git hooks)
pnpm install

# Start development servers
pnpm dev
```

### Git Workflow

This workspace enforces [Conventional Commits](https://www.conventionalcommits.org/). All commits must follow this format:

```
<type>(<scope>): <subject>
```

**Examples:**
- `feat(vault): add semantic search endpoint`
- `fix(billy): handle rate limit on token refresh`
- `docs(readme): update quick start guide`

See [docs/CONVENTIONAL_COMMITS.md](docs/CONVENTIONAL_COMMITS.md) for complete guide.

**Git hooks** (via Husky) automatically validate commit messages before creation. CI validates all commits on push and PR.

## Active Projects

### Rendetalje Mobile App

The Rendetalje Mobile App is a cross-platform application for employees and customers, built with React Native and Expo. It provides on-the-go access to job management, scheduling, and real-time communication features.

## Quick Start: Rendetalje Mobile App

To run the mobile app locally, follow these steps:

1. **Navigate to the mobile app directory:**
    ```bash
    cd apps/rendetalje/services/mobile
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Start the Expo development server:**
    ```bash
    npx expo start
    ```

4. **Scan the QR code** with the Expo Go app on your iOS or Android device to launch the app.

---
_This document is intended as a high-level overview. For detailed technical information, please refer to the `TEKUP_PLATFORM_ARCHITECTURE_OVERVIEW.md`._

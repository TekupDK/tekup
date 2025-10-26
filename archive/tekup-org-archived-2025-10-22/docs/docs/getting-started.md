# Getting Started

Welcome to TekUp - a comprehensive **multi-tenant incident response ecosystem** designed for Danish enterprises requiring rapid incident detection, response, and compliance automation.

## Quick Start

### Prerequisites

- **Node.js** >= 18.18.0
- **pnpm** >= 9.9.0
- **PostgreSQL** >= 14
- **Docker** (optional, for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/TekUp-org/tekup-org.git
cd tekup-org

# Install dependencies
pnpm install

# Set up environment variables
pnpm env:auto

# Start development servers
pnpm dev
```

## Architecture Overview

TekUp consists of **5 core applications** working together:

### 🚀 **Flow API** (NestJS)
- Multi-tenant backend with row-level security
- Lead ingestion, status management, audit events
- Real-time WebSocket connections
- SLA tracking with < 2min breach alerts

### 🌐 **Flow Web** (Next.js)
- Real-time dashboard with tenant routing (`/t/[tenant]/leads`)
- Dark-themed UI matching enterprise expectations
- Responsive design for desktop and tablet

### 🔐 **Secure Platform** (NestJS)
- Security-focused service for enterprise compliance
- NIS2, GDPR compliance automation
- Backup failure monitoring and alerting

### 📧 **Inbox AI** (Electron)
- Email/compliance ingestion with FlowIngestionService
- Automated categorization and routing
- Desktop application for always-on monitoring

### 📱 **TekUp Mobile** (React Native)
- Mobile incident response for on-the-go management
- Push notifications for critical alerts
- Cross-platform iOS/Android support

## Development Workflow

### Running Individual Apps

```bash
# Flow API (Backend)
pnpm flow:dev

# Flow Web (Frontend)
pnpm flow:web:dev

# CRM API
pnpm crm:dev

# CRM Web
pnpm crm:web:dev
```

### Building for Production

```bash
# Build all applications
pnpm build

# Build specific app
pnpm -C apps/flow-api build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm -C packages/shared test

# Run tests with coverage
pnpm test:coverage
```

## Key Features

### ⚡ **Real-Time Incident Detection**
- Sub-2 minute SLA for incident response
- WebSocket-based real-time updates
- Automated alerting and escalation

### 🏢 **Multi-Tenant Architecture**
- Complete data isolation per tenant
- API key-based authentication
- Row-level security policies

### 📊 **Comprehensive Monitoring**
- Prometheus metrics integration
- Audit trails for all actions
- SLA breach detection and reporting

### 🔄 **Cross-Platform Ecosystem**
- Unified APIs across web, mobile, desktop
- Consistent authentication and authorization
- Shared UI components and design system

## Next Steps

1. **[Architecture Overview](./architecture.md)** - Understand the system design
2. **[API Reference](/api)** - Explore available endpoints
3. **[Development Setup](./development/setup.md)** - Configure your dev environment
4. **[Contributing](./development/contributing.md)** - Learn how to contribute

## Need Help?

- 📚 **Documentation**: Browse the full docs in the sidebar
- 🐛 **Issues**: Report bugs on [GitHub](https://github.com/TekUp-org/tekup-org/issues)
- 💬 **Discussions**: Join our [GitHub Discussions](https://github.com/TekUp-org/tekup-org/discussions)

---

**Target Audience**: Danish enterprise customers requiring security, compliance, and cross-platform incident response capabilities.

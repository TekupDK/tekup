# Getting Started

Welcome to the TekUp comprehensive documentation system! This guide will help you get up and running with the TekUp platform quickly and efficiently.

## What is TekUp?

TekUp is a multi-tenant SaaS platform focused on SMB IT support, security, and digital advisory services targeting Danish SMEs. Our platform consists of 25+ interconnected applications that work together as a unified AI organism.

## Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.18.0+ (use `.nvmrc` for version management)
- **pnpm** 9.9.0 (managed via Corepack)
- **PostgreSQL** 14+
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TekUp-org/tekup-org.git
   cd tekup-org
   ```

2. **Enable Corepack and install dependencies**
   ```bash
   corepack enable
   corepack prepare pnpm@9.9.0 --activate
   pnpm bootstrap
   ```

3. **Set up environment variables**
   ```bash
   pnpm run env:auto
   ```

4. **Start the development environment**
   ```bash
   pnpm dev
   ```

## Architecture Overview

The TekUp platform is built using a modern microservices architecture with the following key components:

### Core Applications
- **flow-api**: Master backend API service
- **flow-web**: Main web application
- **voice-agent**: AI-powered voice processing

### Business Applications
- **tekup-crm-api/web**: Customer relationship management
- **tekup-lead-platform**: Lead generation and management
- **business-metrics-dashboard**: Business analytics

### Specialized Applications
- **inbox-ai**: AI-powered inbox management
- **secure-platform**: Security and compliance
- **voicedk-api**: Danish voice AI services

## Key Features

### 🚀 **AI-First Architecture**
Built with AI integration at its core, featuring Gemini Live API integration for advanced voice processing and natural language understanding.

### 🏢 **Multi-Tenant Design**
Robust multi-tenancy with Row Level Security (RLS) ensuring complete data isolation between tenants.

### 🔒 **Enterprise Security**
Comprehensive security framework with JWT authentication, role-based access control, and compliance monitoring.

### 🌐 **Real-Time Communication**
Advanced WebSocket-based real-time communication system for instant updates and notifications.

### 📊 **Business Intelligence**
Integrated analytics and reporting with automated insights and performance tracking.

## Next Steps

1. **[Architecture Overview](./architecture/overview.md)** - Understand the system design
2. **[Application Documentation](./category/applications)** - Explore individual applications
3. **[API Reference](/api)** - Browse the API documentation
4. **[Deployment Guide](/guides/deployment)** - Learn how to deploy the platform

## Getting Help

- **Documentation**: Browse this comprehensive documentation site
- **GitHub Issues**: [Report bugs or request features](https://github.com/TekUp-org/tekup-org/issues)
- **Community**: Join our [Discord server](https://discord.gg/tekup)
- **Support**: Contact our support team at support@tekup.org

## Contributing

We welcome contributions! Please read our [Contributing Guide](./development/contributing.md) to get started.

---

**Ready to dive deeper?** Check out our [Architecture Overview](./architecture/overview.md) to understand how all the pieces fit together.
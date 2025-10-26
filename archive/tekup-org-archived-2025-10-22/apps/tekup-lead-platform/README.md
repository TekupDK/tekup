# TekUp Lead Platform

Advanced multi-tenant lead management and qualification system for the TekUp Ecosystem.

## Overview

TekUp Lead Platform specializes in lead qualification, nurturing, and tenant-specific integrations. It works seamlessly with the existing TekUp Flow API for incident management while providing advanced lead processing capabilities.

## Features

### Core Lead Management
- **Lead Qualification**: Advanced scoring system with tenant-specific criteria
- **Lead Nurturing**: Automated follow-up workflows and communication sequences
- **Multi-tenant Architecture**: Isolated lead processing per tenant with RLS

### Tenant-Specific Integration Hubs
- **Rendetalje Hub**: Google Workspace, Gmail parsing, Calendar booking, Billy invoicing
- **Foodtruck Fiesta Hub**: Event management, Gmail integration, Calendar sync
- **TekUp Corporate Hub**: Enterprise integrations and compliance tracking

### Analytics & Reporting
- Lead conversion tracking
- Qualification statistics
- Revenue forecasting
- Performance metrics per tenant

## Architecture

```
TekUp Lead Platform
├── Lead Qualification Engine
├── Nurturing Workflows
├── Integration Hubs
│   ├── Rendetalje (Google + Billy)
│   ├── Foodtruck Fiesta (Events)
│   └── TekUp Corporate (Enterprise)
└── Analytics Dashboard
```

## Integration with TekUp Ecosystem

### Data Flow
1. **Email/Form Input** → Flow API (basic ingestion)
2. **Lead Created** → TekUp Lead Platform (qualification)
3. **Qualified Lead** → Tenant Hub (processing)
4. **Booking/Follow-up** → Integration Services
5. **Escalation** → Flow API (if incident response needed)

### Shared Resources
- Uses same Prisma database with RLS
- Extends `@tekup/shared` lead types
- Integrates with `@tekup/api-client`
- Leverages `@tekup/config` for multi-tenant settings

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (shared with Flow API)
- Redis for caching
- Google Workspace API credentials (for Rendetalje)
- Billy API key (for Rendetalje invoicing)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client (uses shared schema)
pnpm prisma:generate

# Start development server
pnpm dev
```

### API Documentation
Once running, visit `http://localhost:3003/api` for Swagger documentation.

## Tenant Configuration

### Rendetalje Setup
1. Configure Google Workspace service account
2. Set up Billy API integration
3. Configure calendar and email settings

### Adding New Tenants
1. Create tenant hub module in `src/integrations/`
2. Implement tenant-specific services
3. Add to `IntegrationHubModule`
4. Configure scoring weights and qualification criteria

## Environment Variables

See `.env.example` for all required configuration options.

## API Endpoints

### Lead Qualification
- `POST /qualification/:leadId/qualify` - Qualify a lead
- `GET /qualification/stats` - Get qualification statistics

### Integration Hubs
- `POST /integrations/rendetalje/process/:leadId` - Process Rendetalje lead
- `POST /integrations/rendetalje/booking` - Create calendar booking
- `GET /integrations/rendetalje/availability` - Check availability

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status

## Development

### Project Structure
```
src/
├── qualification/     # Lead scoring and qualification
├── nurturing/        # Automated follow-up workflows
├── integrations/     # Tenant-specific hubs
│   ├── rendetalje/   # Google Workspace + Billy
│   ├── foodtruck-fiesta/
│   └── tekup-corporate/
├── analytics/        # Reporting and metrics
├── communication/    # Email templates and automation
└── health/          # Health checks and monitoring
```

### Adding New Features
1. Create feature module in appropriate directory
2. Add to `AppModule` imports
3. Implement controllers and services
4. Add tests and documentation
5. Update API documentation

## Testing

```bash
# Run unit tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Type checking
pnpm typecheck
```

## Deployment

The platform is designed to run alongside Flow API and Flow Web in the TekUp ecosystem.

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Ensure tenant isolation is maintained
5. Test integration with Flow API

## License

Private - TekUp Ecosystem

# TekUp Flow API (`apps/flow-api`)

The core backend API for the TekUp ecosystem, providing multi-tenant lead management, real-time WebSocket communication, voice command processing, and comprehensive system integration capabilities.

## 🏗️ Architecture Overview

Flow API serves as the central nervous system of the TekUp platform, orchestrating communication between all applications and external services. It implements a multi-tenant architecture with Row Level Security (RLS) and provides real-time capabilities through WebSocket integration.

### Core Components

```mermaid
graph TB
    subgraph "Flow API Core"
        A[NestJS Application] --> B[Multi-tenant Auth]
        A --> C[Lead Management]
        A --> D[WebSocket Gateway]
        A --> E[Voice Integration]
        A --> F[Metrics & Monitoring]
    end
    
    subgraph "Data Layer"
        G[PostgreSQL + RLS] --> H[Prisma ORM]
        I[Redis Cache] --> J[Session Management]
    end
    
    subgraph "External Integrations"
        K[Gemini Live API] --> L[Voice Processing]
        M[OpenAI API] --> N[AI Features]
        O[Webhook Endpoints] --> P[External Services]
    end
    
    B --> H
    C --> H
    D --> I
    E --> K
    F --> G
```

## 🚀 Tech Stack

- **Framework**: NestJS 10 (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Multi-tenant API key authentication
- **Real-time**: WebSocket with Socket.IO
- **Caching**: Redis for session management
- **Voice AI**: Gemini Live API integration
- **Monitoring**: Prometheus-style metrics
- **Security**: Row Level Security (RLS) for tenant isolation

## 🔧 Environment Configuration

The API uses centralized configuration from `@tekup/config` with Zod validation.

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tekup?schema=public

# API Configuration
PX_API_PORT=4000
FLOW_API_URL=http://localhost:4000

# Development
PX_AUTO_SEED=true
NODE_ENV=development

# External Services
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Redis (optional)
REDIS_URL=redis://localhost:6379

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Configuration Validation

```bash
pnpm config:print     # Print redacted configuration values
pnpm config:check     # Validate configuration schema
```

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18.18.0+
- PostgreSQL 14+
- Redis (optional, for caching)
- pnpm 9.9.0+

### Installation & Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter @tekup/flow-api prisma:generate

# Run database migrations
pnpm --filter @tekup/flow-api prisma:migrate

# Start development server
pnpm --filter @tekup/flow-api dev
```

The API will be available at `http://localhost:4000` with Swagger documentation at `http://localhost:4000/api/docs`.

### Database Seeding

For development, the API can auto-seed demo tenants and API keys:

```sql
-- Check seeded tenants and keys
SELECT t.slug, a.key FROM "ApiKey" a JOIN "Tenant" t ON t.id = a."tenantId";
```

## 🔐 Authentication & Security

### Multi-tenant API Key Authentication

All requests (except `/metrics`) require a valid tenant API key:

```http
x-tenant-key: demo-tenant-key-1
```

### Row Level Security (RLS)

The database implements RLS policies to ensure complete tenant isolation:

- Middleware sets `app.tenant_id` for each request
- Database policies automatically filter data by tenant
- Defensive tenant validation in service methods

### Security Features

- **Tenant Isolation**: Complete data separation between tenants
- **API Key Rotation**: Automated key rotation capabilities
- **Rate Limiting**: Request throttling per tenant
- **Input Validation**: Comprehensive DTO validation
- **CORS Protection**: Configurable origin restrictions

## 📡 API Endpoints

### Lead Management

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `GET` | `/leads` | List tenant leads with pagination | ✅ |
| `POST` | `/ingest/form` | Create lead from form submission | ✅ |
| `PATCH` | `/leads/:id/status` | Update lead status | ✅ |
| `GET` | `/leads/:id/events` | Get lead audit events | ✅ |
| `GET` | `/leads/:id` | Get single lead details | ✅ |

### WebSocket Events

| Event | Description | Payload |
|-------|-------------|---------|
| `execute_voice_command` | Execute voice command | `VoiceCommandRequest` |
| `voice_command_response` | Voice command result | `VoiceCommandResponse` |
| `lead_event` | Lead lifecycle events | `LeadEvent` |
| `voice_event` | Voice processing events | `VoiceEvent` |
| `integration_event` | External service events | `IntegrationEvent` |

### Voice Commands

The API supports the following voice commands via WebSocket:

- `get_leads` - Retrieve leads with filtering
- `create_lead` - Create new lead from voice input
- `search_leads` - Search leads by query
- `get_metrics` - Get system metrics
- `start_backup` - Initiate backup process
- `compliance_check` - Run compliance validation

### Monitoring & Health

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `GET` | `/health` | Health check endpoint | ❌ |
| `GET` | `/metrics` | Prometheus metrics | ❌ |
| `GET` | `/api/docs` | Swagger documentation | ❌ |

## 🔌 WebSocket Integration

### Connection Setup

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000/events', {
  extraHeaders: {
    'x-tenant-key': 'your-api-key'
  }
});

socket.on('connected', (data) => {
  console.log('Connected to Flow API:', data);
});
```

### Voice Command Execution

```typescript
// Execute voice command
socket.emit('execute_voice_command', {
  command: 'get_leads',
  parameters: { status: 'NEW', limit: 10 }
});

// Handle response
socket.on('voice_command_response', (response) => {
  console.log('Command result:', response);
});
```

### Event Subscriptions

```typescript
// Subscribe to lead events
socket.on('lead_event', (event) => {
  console.log('Lead event:', event.type, event.data);
});

// Subscribe to voice events
socket.on('voice_event', (event) => {
  console.log('Voice event:', event.type, event.data);
});
```

## 🎤 Voice Integration

### Gemini Live API Integration

The API integrates with Google's Gemini Live API for advanced voice processing:

```typescript
// Voice command processing flow
1. Audio input received via WebSocket
2. Gemini Live processes natural language
3. Command extracted and validated
4. Business logic executed
5. Response sent back via WebSocket
```

### Supported Voice Features

- **Natural Language Understanding**: Danish and English support
- **Command Extraction**: Intelligent command parsing
- **Context Awareness**: Conversation context maintenance
- **Multi-tenant Voice**: Tenant-specific voice commands
- **Real-time Processing**: Low-latency voice responses

### Voice Command Examples

```typescript
// Danish voice commands
"vis alle leads"           // Show all leads
"opret ny lead"           // Create new lead
"start backup"            // Start backup process
"kør compliance check"    // Run compliance check
"skift til rendetalje"    // Switch to rendetalje tenant
```

## 📊 Metrics & Monitoring

### Prometheus Metrics

The API exposes comprehensive metrics at `/metrics`:

```prometheus
# Lead metrics
lead_created_total{tenant="rendetalje",source="form"} 3
lead_status_transition_total{tenant="rendetalje",from="new",to="contacted"} 2

# Voice metrics
voice_commands_total{tenant="rendetalje",command="get_leads"} 15
voice_command_duration_seconds{tenant="rendetalje",command="get_leads"} 0.245

# WebSocket metrics
websocket_connections_total{tenant="rendetalje"} 5
websocket_notifications_processed_total{tenant="rendetalje",type="lead.update"} 42

# System metrics
http_requests_total{method="GET",status="200"} 1234
http_request_duration_seconds{method="GET",route="/leads"} 0.123
```

### Health Monitoring

```bash
# Check API health
curl http://localhost:4000/health

# Check Gemini Live integration
curl -H "x-tenant-key: demo-key" http://localhost:4000/voice/health

# Check database connectivity
curl -H "x-tenant-key: demo-key" http://localhost:4000/health/database
```

## 🧪 Testing

### Unit Tests

```bash
pnpm --filter @tekup/flow-api test
```

### End-to-End Tests

```bash
pnpm --filter @tekup/flow-api test:e2e
```

### Integration Tests

```bash
# Test WebSocket integration
pnpm --filter @tekup/flow-api test test/websocket-integration.e2e-spec.ts

# Test voice command processing
pnpm --filter @tekup/flow-api test test/voice-commands.e2e-spec.ts

# Test tenant isolation
pnpm --filter @tekup/flow-api test test/tenant-isolation.e2e-spec.ts
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build production image
docker build -f Dockerfile.production -t tekup/flow-api:latest .

# Run container
docker run -p 4000:4000 \
  -e DATABASE_URL=postgresql://... \
  -e GEMINI_API_KEY=... \
  tekup/flow-api:latest
```

### Environment-specific Configurations

- **Development**: Auto-seeding, debug logging, Swagger UI
- **Staging**: Production-like setup with test data
- **Production**: Optimized performance, security hardening

## 🔧 Development Scripts

```bash
# Development
pnpm --filter @tekup/flow-api dev              # Start with hot reload
pnpm --filter @tekup/flow-api build            # Build for production
pnpm --filter @tekup/flow-api start            # Start production build

# Database
pnpm --filter @tekup/flow-api prisma:generate  # Generate Prisma client
pnpm --filter @tekup/flow-api prisma:migrate   # Run migrations
pnpm --filter @tekup/flow-api prisma:studio    # Open Prisma Studio

# Testing
pnpm --filter @tekup/flow-api test             # Run unit tests
pnpm --filter @tekup/flow-api test:e2e         # Run E2E tests
pnpm --filter @tekup/flow-api test:watch       # Watch mode testing

# Utilities
pnpm --filter @tekup/flow-api typecheck        # TypeScript checking
pnpm --filter @tekup/flow-api lint             # ESLint checking
```

## 🔗 Integration Patterns

### Inter-Application Communication

```typescript
// Event publishing to other applications
await this.websocketService.publishEvent({
  type: 'LEAD_CREATED',
  tenantId: 'tenant-123',
  source: 'flow-api',
  data: { leadId: 'lead-456', status: 'NEW' }
});
```

### External Service Integration

```typescript
// Gemini Live integration
const geminiService = this.geminiLiveService.getGeminiIntegration();
const response = await geminiService.processVoiceCommand(audioData);

// OpenAI integration
const openaiResponse = await this.openaiService.generateResponse(prompt);
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connectivity
   pnpm --filter @tekup/flow-api prisma:studio
   ```

2. **WebSocket Connection Problems**
   ```bash
   # Check WebSocket endpoint
   curl -H "Upgrade: websocket" http://localhost:4000/events
   ```

3. **Voice Integration Issues**
   ```bash
   # Test Gemini Live connection
   curl -H "x-tenant-key: demo-key" http://localhost:4000/voice/health
   ```

### Debug Logging

Enable debug logging by setting:
```bash
DEBUG=tekup:*
LOG_LEVEL=debug
```

## 📚 API Documentation

- **Swagger UI**: http://localhost:4000/api/docs (development only)
- **OpenAPI Spec**: Generated automatically and exported to `docs/build/openapi/flow-api.json`
- **Postman Collection**: Auto-generated from OpenAPI specification

## 🔄 Roadmap

### Phase 1: Core Stability ✅
- [x] Multi-tenant architecture
- [x] WebSocket real-time communication
- [x] Voice command processing
- [x] Basic lead management

### Phase 2: Advanced Features 🚧
- [ ] Advanced voice AI capabilities
- [ ] Email ingestion worker
- [ ] Duplicate detection system
- [ ] Extended lead statuses
- [ ] Performance optimization

### Phase 3: Enterprise Features 📋
- [ ] Advanced analytics
- [ ] Audit logging
- [ ] Compliance reporting
- [ ] Multi-region deployment
- [ ] Advanced security features

## 🤝 Contributing

1. Follow the [TekUp Development Guidelines](../../docs/CONTRIBUTING.md)
2. Ensure all tests pass: `pnpm test`
3. Update documentation for new features
4. Follow TypeScript strict mode requirements
5. Maintain test coverage above 70%

## 📄 License

This project is part of the TekUp ecosystem and is proprietary software.

---

**Built with ❤️ by the TekUp Team**


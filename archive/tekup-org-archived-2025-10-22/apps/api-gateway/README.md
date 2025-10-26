# Tekup AI Ecosystem API Gateway

A comprehensive API Gateway that provides unified access to all Tekup AI applications with intelligent routing, authentication, rate limiting, and health monitoring.

## Features

### 🚀 Core Capabilities
- **Intelligent Routing**: Route requests to appropriate AI services
- **Authentication & Authorization**: JWT-based security with tenant isolation
- **Rate Limiting**: Service-specific rate limiting with Redis backend
- **Health Monitoring**: Real-time service health checks and status tracking
- **Load Balancing**: Automatic failover and load distribution
- **Request/Response Transformation**: Add gateway metadata and headers

### 🔒 Security Features
- **Helmet.js**: Security headers and protection
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: IP-based and service-specific limits
- **JWT Validation**: Secure token-based authentication
- **Request Logging**: Comprehensive audit trail

### 📊 Monitoring & Observability
- **Health Checks**: Automatic service health monitoring
- **Metrics Collection**: Performance and usage metrics
- **Error Handling**: Graceful error handling and recovery
- **Logging**: Structured logging with Winston

## Architecture

The API Gateway acts as the single entry point for all AI services in the Tekup ecosystem:

```
Client Apps
     ↓
API Gateway (Port 3000)
     ↓
┌─────────────────┬─────────────────┬─────────────────┐
│  AI Proposal    │  AI Content     │  AI Customer    │
│  Engine         │  Generator      │  Support        │
│  (Port 3001)    │  (Port 3002)    │  (Port 3003)    │
└─────────────────┴─────────────────┴─────────────────┘
┌─────────────────┬─────────────────┬─────────────────┐
│  AI Analytics   │  Enhanced       │  Marketing      │
│  Platform       │  CRM            │  Automation     │
│  (Port 3004)    │  (Port 3005)    │  (Port 3006)    │
└─────────────────┴─────────────────┴─────────────────┘
┌─────────────────┬─────────────────┬─────────────────┐
│  Business       │  Project        │  Voice AI &     │
│  Intelligence   │  Management     │  Computer Vision│
│  (Port 3007)    │  (Port 3008)    │  (Port 3009)    │
└─────────────────┴─────────────────┴─────────────────┘
┌─────────────────┬─────────────────┐
│  Predictive     │  Tekup CRM      │
│  Models         │  API            │
│  (Port 3010)    │  (Port 3333)    │
└─────────────────┴─────────────────┘
```

## Registered Services

| Service | Routes | Rate Limit | Description |
|---------|--------|------------|-------------|
| AI Proposal Engine | `/api/v1/proposals`, `/api/v1/buying-signals` | 100/min | Generate AI-powered proposals from transcripts |
| AI Content Generator | `/api/v1/content`, `/api/v1/generation` | 50/min | Create multi-platform content |
| AI Customer Support | `/api/v1/support`, `/api/v1/sessions`, `/api/v1/chatbot` | 200/min | Intelligent customer support |
| AI Analytics Platform | `/api/v1/analytics`, `/api/v1/predictions`, `/api/v1/models` | 300/min | Business intelligence and predictions |
| Enhanced CRM | `/api/v1/crm`, `/api/v1/leads`, `/api/v1/scoring` | 500/min | CRM with AI lead scoring |
| Marketing Automation | `/api/v1/marketing`, `/api/v1/campaigns`, `/api/v1/automation` | 100/min | AI-powered marketing campaigns |
| Business Intelligence | `/api/v1/bi`, `/api/v1/reports`, `/api/v1/dashboards` | 200/min | Advanced reporting and dashboards |
| Project Management | `/api/v1/projects`, `/api/v1/tasks`, `/api/v1/collaboration` | 300/min | AI-enhanced project management |
| Voice AI & Computer Vision | `/api/v1/voice`, `/api/v1/vision`, `/api/v1/multimedia` | 50/min | Multimedia AI processing |
| Predictive Models | `/api/v1/models`, `/api/v1/predictions`, `/api/v1/training` | 100/min | Machine learning models |
| Tekup CRM API | `/api/v1/contacts`, `/api/v1/companies`, `/api/v1/deals`, `/api/v1/activities` | 1000/min | Core CRM functionality |

## Quick Start

### Prerequisites
- Node.js 20+
- Redis server
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Build the application
pnpm build

# Start development server
pnpm dev

# Start production server
pnpm start
```

### Environment Configuration

Create a `.env` file with the following variables:

```bash
# API Gateway Configuration
API_GATEWAY_PORT=3000
NODE_ENV=development

# Redis Configuration
REDIS_URL=redis://localhost:6379

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# AI Service URLs
AI_PROPOSAL_ENGINE_URL=http://localhost:3001
AI_CONTENT_GENERATOR_URL=http://localhost:3002
AI_CUSTOMER_SUPPORT_URL=http://localhost:3003
AI_ANALYTICS_PLATFORM_URL=http://localhost:3004
ENHANCED_CRM_URL=http://localhost:3005
MARKETING_AUTOMATION_URL=http://localhost:3006
BUSINESS_INTELLIGENCE_URL=http://localhost:3007
PROJECT_MANAGEMENT_URL=http://localhost:3008
VOICE_AI_CV_URL=http://localhost:3009
PREDICTIVE_MODELS_URL=http://localhost:3010
TEKUP_CRM_API_URL=http://localhost:3333

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/tekup_ai
```

## API Endpoints

### Gateway Management

#### Health Check
```
GET /health
```
Returns gateway and service health status.

#### Service Discovery
```
GET /api/v1/services
```
Lists all registered services and their status.

### Authentication

All API routes (except `/health` and service discovery) require authentication via JWT token:

```bash
curl -H "Authorization: Bearer <jwt-token>" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/v1/proposals
```

### Request Headers

The gateway automatically adds the following headers to forwarded requests:

- `X-Gateway-Service`: Service identifier
- `X-Gateway-Timestamp`: Request timestamp
- `X-User-ID`: Authenticated user ID
- `X-Tenant-ID`: Tenant identifier for multi-tenancy

## Monitoring

### Health Monitoring

The gateway continuously monitors all registered services:

- Health checks every 30 seconds
- Automatic failover for unhealthy services
- Health status cached in Redis
- Comprehensive health metrics

### Logging

All requests and errors are logged with structured data:

```json
{
  "level": "info",
  "message": "Request processed",
  "method": "POST",
  "url": "/api/v1/proposals",
  "status": 200,
  "duration": "145ms",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Rate Limiting

Service-specific rate limits with Redis backend:

- Global: 1000 requests per 15 minutes per IP
- Service-specific limits as configured
- Graceful limit exceeded responses

## Development

### Project Structure

```
src/
├── main.ts              # Main application entry point
├── middleware/          # Custom middleware
├── routes/             # Route handlers
├── services/           # Service integrations
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Adding New Services

To add a new AI service to the gateway:

1. Add service configuration in `registerServices()`:

```typescript
{
  id: 'new-ai-service',
  name: 'New AI Service',
  baseUrl: process.env.NEW_AI_SERVICE_URL || 'http://localhost:3011',
  healthPath: '/health',
  enabled: true,
  routes: ['/api/v1/new-service'],
  rateLimit: { windowMs: 60000, max: 100 }
}
```

2. Add environment variable for the service URL
3. Update documentation

### Testing

```bash
# Run tests
pnpm test

# Type checking
pnpm typecheck
```

## Production Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Kubernetes

The gateway is designed for cloud-native deployment with:

- Horizontal Pod Autoscaling
- Service mesh integration
- Health check endpoints
- Graceful shutdown handling

## Security Considerations

1. **JWT Validation**: Implement proper JWT validation with your auth provider
2. **Rate Limiting**: Configure appropriate limits for your use case
3. **CORS**: Restrict allowed origins in production
4. **SSL/TLS**: Always use HTTPS in production
5. **Network Security**: Deploy in a secure network environment

## Performance

### Optimization Features

- **Connection Pooling**: Efficient HTTP connection management
- **Response Compression**: Gzip compression for responses
- **Caching**: Redis-based health status and metadata caching
- **Async Processing**: Non-blocking request processing

### Metrics

Key performance metrics tracked:

- Request throughput (requests/second)
- Response time distribution
- Error rates by service
- Service availability

## Troubleshooting

### Common Issues

1. **Service Unavailable (503)**
   - Check service health status via `/health`
   - Verify service URLs in environment variables
   - Check network connectivity

2. **Authentication Errors (401)**
   - Verify JWT token validity
   - Check token format in Authorization header

3. **Rate Limit Exceeded (429)**
   - Check rate limit configuration
   - Implement exponential backoff in clients

### Debugging

Enable debug logging:

```bash
NODE_ENV=development DEBUG=api-gateway:* pnpm dev
```

## Contributing

1. Follow TypeScript best practices
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Ensure proper error handling and logging

## License

MIT License - see LICENSE file for details.


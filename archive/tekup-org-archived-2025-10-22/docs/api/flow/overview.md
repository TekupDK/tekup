# Flow API Overview

**TekUp Flow API** is the core multi-tenant backend service providing real-time incident response capabilities for enterprise customers.

## Base URL
```
Development: http://localhost:4000
Production: https://api.tekup.org
```

## Interactive Documentation
When running in development mode, interactive Swagger UI is available at:
```
http://localhost:4000/api/docs
```

## Authentication

### API Key Authentication
All endpoints require an API key via the `x-api-key` header:

```bash
curl -H "x-api-key: your-tenant-api-key" \
     https://api.tekup.org/api/leads
```

### Multi-Tenant Isolation
- Each API key is associated with a specific tenant
- All data access is automatically scoped to the tenant
- Row-level security ensures complete data isolation

## Key Features

### 🚀 **Real-Time Capabilities**
- WebSocket connections for live updates
- Sub-2 minute SLA for incident detection
- Real-time dashboard synchronization

### 🏢 **Multi-Tenant Architecture**
- Complete data isolation per tenant
- Tenant-aware routing and middleware
- Automated tenant context resolution

### 📊 **Comprehensive Monitoring**
- Prometheus metrics at `/metrics` 
- Request/response logging with tenant context
- SLA breach detection and alerting

## API Tags

### `leads`
Lead management, ingestion, and status tracking
- Create, update, delete leads
- Bulk import/export operations
- Status workflow management

### `tenants`
Multi-tenant operations and configuration
- Tenant provisioning
- API key management
- Usage analytics

### `events`
Real-time events and notifications
- WebSocket event streaming
- Push notification configuration
- Event history and audit trails

### `metrics`
System monitoring and health checks
- Performance metrics
- Health status endpoints
- Usage statistics

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2025-01-01T00:00:00.000Z",
    "tenant_id": "tenant-uuid",
    "request_id": "req-uuid"
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [ /* validation errors */ ]
  },
  "meta": {
    "timestamp": "2025-01-01T00:00:00.000Z",
    "request_id": "req-uuid"
  }
}
```

## Rate Limiting

- **Default**: 100 requests per minute per API key
- **Burst**: Up to 200 requests in a 10-second window
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Status Codes

- `200` - Success
- `201` - Created  
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Next Steps

- [Authentication Details](./authentication.md)
- [Leads Management](./leads.md)
- [Tenant Operations](./tenants.md)
- [Real-time Events](./events.md)

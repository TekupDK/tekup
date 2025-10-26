# @tekup/lead-platform

Lead generation and management API

## Overview

TekUp Lead Platform - Advanced multi-tenant lead management and qualification system

**Category:** Business APIs  
**Version:** 0.1.0  
**Base URL:** `http://localhost:3003`

## Quick Start

### Authentication
All endpoints require API key authentication. Include your key in the x-api-key header:

```bash
curl -H "x-api-key: your-api-key-here" \
     http://localhost:3003/api/endpoint
```

### Example Request
```bash
curl -X GET \
  http://localhost:3003/health \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here"
```

## Interactive Documentation

Visit the interactive Swagger documentation at:
[http://localhost:3003/api/docs](http://localhost:3003/api/docs)

## OpenAPI Specification

Download the complete OpenAPI specification:
- [JSON Format](/openapi/tekup-lead-platform.json)

## Postman Collection

Import the Postman collection for easy API testing:
- [Download Collection](/postman/tekup-lead-platform.json)

### Importing to Postman
1. Open Postman
2. Click "Import" button
3. Select "Link" tab
4. Paste: `https://docs.tekup.org/postman/tekup-lead-platform.json`
5. Click "Continue" and "Import"

## Client Libraries

### JavaScript/TypeScript
```bash
npm install @tekup/api-client
```

```typescript
import { createApiClient } from '@tekup/api-client';

const client = createApiClient({
  baseURL: 'http://localhost:3003',
  apiKey: 'your-api-key-here'
});

// Example usage
const result = await client.get('/api/endpoint');
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

## Rate Limits

- **Requests per hour**: 1000 (development), 10000 (production)
- **Concurrent requests**: 10
- **Burst limit**: 100 requests per minute

## Support

- **Issues**: [GitHub Issues](https://github.com/TekUp-org/tekup-org/issues)
- **Documentation**: [API Documentation](/api)
- **Community**: [Discord Server](https://discord.gg/tekup)
- **Email**: api-support@tekup.org

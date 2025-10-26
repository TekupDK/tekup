# API Reference

TekUp platform provides comprehensive REST APIs for all business operations. All APIs follow OpenAPI 3.0 specification and include interactive documentation.

## Available APIs


### @tekup/flow-api

**Category:** Core APIs  
**Description:** Core backend API service for multi-tenant incident response  
**Base URL:** `http://localhost:4000`

No description available.

- [OpenAPI Specification](/openapi/flow-api.json)
- [Postman Collection](/postman/flow-api.json)
- [Interactive Documentation](http://localhost:4000/api/docs)


### @tekup/crm-api

**Category:** Business APIs  
**Description:** Customer relationship management API  
**Base URL:** `http://localhost:3002`

No description available.

- [OpenAPI Specification](/openapi/tekup-crm-api.json)
- [Postman Collection](/postman/tekup-crm-api.json)
- [Interactive Documentation](http://localhost:3002/api/docs)


### @tekup/lead-platform

**Category:** Business APIs  
**Description:** Lead generation and management API  
**Base URL:** `http://localhost:3003`

TekUp Lead Platform - Advanced multi-tenant lead management and qualification system

- [OpenAPI Specification](/openapi/tekup-lead-platform.json)
- [Postman Collection](/postman/tekup-lead-platform.json)
- [Interactive Documentation](http://localhost:3003/api/docs)


### @tekup/secure-platform

**Category:** Security APIs  
**Description:** Security and compliance API  
**Base URL:** `http://localhost:4010`

No description available.

- [OpenAPI Specification](/openapi/secure-platform.json)
- [Postman Collection](/postman/secure-platform.json)
- [Interactive Documentation](http://localhost:4010/api/docs)


### @tekup/voicedk-api

**Category:** AI APIs  
**Description:** Danish voice AI processing API  
**Base URL:** `http://localhost:3002`

VoiceDK - Danish Voice Command Processing API

- [OpenAPI Specification](/openapi/voicedk-api.json)
- [Postman Collection](/postman/voicedk-api.json)
- [Interactive Documentation](http://localhost:3002/api/docs)


### @tekup/rendetalje-os-backend

**Category:** Business APIs  
**Description:** Construction management backend API  
**Base URL:** `http://localhost:3006`

RendetaljeOS Backend - Professional cleaning service management for Danish market

- [OpenAPI Specification](/openapi/rendetalje-os-backend.json)
- [Postman Collection](/postman/rendetalje-os-backend.json)
- [Interactive Documentation](http://localhost:3006/api/docs)



## Authentication

All APIs use API key authentication. Include the key in the x-api-key header:

```
x-api-key: your-api-key-here
```

Some endpoints also support JWT Bearer token authentication:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

APIs are rate limited to prevent abuse:
- **Development**: 1000 requests per hour per IP
- **Production**: 10000 requests per hour per authenticated user

## Error Handling

All APIs return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

## Common Response Formats

### Success Response
```json
{
  "data": {},
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response
```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "message": "Success"
}
```

## SDK and Client Libraries

- **JavaScript/TypeScript**: `@tekup/api-client`
- **Python**: Coming soon
- **PHP**: Coming soon

## Support

- **Documentation**: Browse this comprehensive API documentation
- **GitHub Issues**: [Report API issues](https://github.com/TekUp-org/tekup-org/issues)
- **Community**: Join our [Discord server](https://discord.gg/tekup)
- **Email**: api-support@tekup.org

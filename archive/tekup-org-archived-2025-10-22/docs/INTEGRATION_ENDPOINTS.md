# CRM Integration Endpoints

Documentation for integration endpoints between the CRM and other TekUp services.

## Lead Conversion

### Endpoint
`POST /api/lead-conversion`

### Description
Converts a qualified lead from the lead platform to CRM entities (contact, company, deal).

### Authentication
- API Key required with appropriate permissions
- Tenant context inferred from API key

### Request Body
```json
{
  "leadId": "string",
  "contact": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "jobTitle": "string"
  },
  "company": {
    "name": "string",
    "industry": "string",
    "website": "string"
  },
  "deal": {
    "name": "string",
    "description": "string",
    "value": "number",
    "currency": "string"
  }
}
```

### Response
```json
{
  "contactId": "string",
  "companyId": "string",
  "dealId": "string"
}
```

## Reporting

### Endpoint
`GET /api/reporting/deals-by-stage`

### Description
Retrieves deal counts and values grouped by stage for dashboard reporting.

### Authentication
- JWT token for user access
- API Key for service-to-service access

### Response
```json
{
  "data": [
    {
      "stageName": "string",
      "dealCount": "number",
      "totalValue": "number"
    }
  ]
}
```

## Inbox Integration

### Endpoint
`POST /api/inbox/link`

### Description
Links email communications from inbox-ai to CRM contacts and deals.

### Authentication
- API Key required with appropriate permissions

### Request Body
```json
{
  "emailId": "string",
  "contactId": "string",
  "dealId": "string"
}
```

### Response
```json
{
  "success": "boolean"
}
```

## Mobile Sync

### Endpoint
`GET /api/mobile/sync`

### Description
Provides delta updates for mobile application synchronization.

### Authentication
- JWT token for user access

### Response
```json
{
  "lastSync": "timestamp",
  "contacts": [...],
  "companies": [...],
  "deals": [...],
  "activities": [...]
}
```
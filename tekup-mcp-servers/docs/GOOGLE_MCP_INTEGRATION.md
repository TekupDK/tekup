# Google MCP Integration for Tekup

## Overview

The Google MCP Server integrates Google Workspace (Calendar and Gmail) into the Tekup ecosystem via the Model Context Protocol (MCP), enabling AI chatbots and automation systems to interact with Google services.

## Purpose

This integration was created to:

1. **Enable Google Calendar management** - Create, read, update, and delete calendar events
2. **Enable Gmail operations** - Read, search, and send emails
3. **Support multiple chatbot integrations** - Connect various AI assistants to Google Workspace
4. **Follow Tekup patterns** - Built using the same architecture as tekup-billy MCP server
5. **Use existing credentials** - Leverages Google OAuth setup for info@rendetalje.dk

## Architecture

### Components

```
google-mcp/
├── src/
│   ├── config.ts              # Configuration management
│   ├── types.ts               # TypeScript type definitions
│   ├── index.ts               # STDIO MCP server (for local clients)
│   ├── http-server.ts         # HTTP server (for remote clients)
│   ├── utils/
│   │   ├── logger.ts          # Winston logging
│   │   └── google-auth.ts     # Google authentication
│   └── tools/
│       ├── calendar.ts        # Calendar operations
│       └── gmail.ts           # Gmail operations
├── tests/                     # Integration tests
├── docs/                      # Documentation
└── Dockerfile                 # Docker configuration
```

### Authentication Flow

```
MCP Client/Chatbot
    ↓
Google MCP Server
    ↓
Google Auth Client (JWT)
    ↓
Google APIs (Calendar, Gmail)
    ↓
Domain-wide Delegation
    ↓
Impersonate: info@rendetalje.dk
```

## Features

### Google Calendar Tools

1. **list_calendar_events** - List upcoming calendar events with filters
2. **get_calendar_event** - Get details of a specific event
3. **create_calendar_event** - Create new calendar events
4. **update_calendar_event** - Update existing events
5. **delete_calendar_event** - Delete calendar events
6. **check_calendar_conflicts** - Check for scheduling conflicts

### Gmail Tools

1. **list_emails** - List recent emails with filters
2. **get_email** - Get details of a specific email
3. **search_emails** - Search emails using Gmail query syntax
4. **send_email** - Send emails (text or HTML)
5. **get_email_labels** - Get all email labels
6. **mark_email_as_read** - Mark emails as read

## Deployment Modes

### 1. STDIO Mode (Local MCP Clients)

For Claude Desktop, Cursor, and other local MCP clients:

```json
{
  "mcpServers": {
    "google": {
      "command": "node",
      "args": ["path/to/google-mcp/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_EMAIL": "...",
        "GOOGLE_PRIVATE_KEY": "...",
        "GOOGLE_IMPERSONATED_USER": "info@rendetalje.dk"
      }
    }
  }
}
```

### 2. HTTP Mode (Remote Access)

For cloud-based chatbots and API access:

```bash
# Start HTTP server
pnpm start

# Access via REST API
POST http://localhost:3001/api/v1/tools/call
```

### 3. Docker Container

```bash
docker build -t tekup-google-mcp .
docker run -d -p 3001:3001 --env-file .env tekup-google-mcp
```

## Integration with Other Systems

### Similar to Tekup-Billy Pattern

The Google MCP Server follows the same architectural pattern as tekup-billy:

1. **HTTP REST API** - Same endpoints structure (`/api/v1/tools/call`)
2. **Authentication** - X-API-Key header
3. **Response format** - Consistent JSON structure
4. **Error handling** - Standardized error responses
5. **Logging** - Winston with structured logging
6. **Rate limiting** - 100 requests per 15 minutes

### Example Integration

```javascript
import axios from 'axios';

// Create clients for both servers
const billyClient = axios.create({
  baseURL: 'https://tekup-billy.onrender.com',
  headers: { 'X-API-Key': process.env.BILLY_API_KEY }
});

const googleClient = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'X-API-Key': process.env.GOOGLE_API_KEY }
});

// Use both in your chatbot
async function handleUserRequest(request) {
  // Get upcoming meetings from Google Calendar
  const meetings = await googleClient.post('/api/v1/tools/call', {
    tool: 'list_calendar_events',
    arguments: { maxResults: 5 }
  });
  
  // Get recent invoices from Billy
  const invoices = await billyClient.post('/api/v1/tools/call', {
    tool: 'list_invoices',
    arguments: { state: 'sent' }
  });
  
  // Send summary email via Gmail
  await googleClient.post('/api/v1/tools/call', {
    tool: 'send_email',
    arguments: {
      to: 'user@example.com',
      subject: 'Daily Summary',
      body: `Meetings: ${meetings.data.data.length}, Invoices: ${invoices.data.data.length}`
    }
  });
}
```

## Configuration

### Required Environment Variables

```env
# Google Service Account
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id

# Or use JSON credentials
GOOGLE_CREDENTIALS='{"type":"service_account",...}'

# User to impersonate
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk

# Calendar ID
GOOGLE_CALENDAR_ID=primary

# Server settings
PORT=3001
NODE_ENV=production
API_KEY=secure-random-api-key

# Logging
LOG_LEVEL=info
```

### Google Cloud Requirements

1. **Service Account** with domain-wide delegation
2. **OAuth Scopes** configured in Google Workspace Admin:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
3. **APIs Enabled**:
   - Google Calendar API
   - Gmail API

## Monitoring

### Health Check Endpoint

```bash
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "google": {
    "configured": true,
    "impersonatedUser": "info@rendetalje.dk"
  }
}
```

### Logging

Structured logs using Winston:

```json
{
  "level": "info",
  "message": "Tool executed successfully",
  "timestamp": "2025-11-01 12:00:00",
  "tool": "list_calendar_events",
  "executionTime": 234
}
```

### Metrics

Track:
- Request count
- Error rate
- Response time
- API quota usage

## Security

### Best Practices Implemented

1. ✅ **Service Account** authentication (no user passwords)
2. ✅ **Domain-wide Delegation** for controlled access
3. ✅ **API Key** authentication for HTTP endpoints
4. ✅ **Rate Limiting** (100 req/15min)
5. ✅ **Helmet.js** for HTTP security headers
6. ✅ **CORS** configuration
7. ✅ **Input Validation** with Zod
8. ✅ **Structured Logging** for audit trails

### Security Checklist

- [ ] Rotate credentials quarterly
- [ ] Monitor API usage in Google Cloud Console
- [ ] Set up alerts for unusual activity
- [ ] Use HTTPS in production
- [ ] Restrict access with firewall rules
- [ ] Enable audit logging in Google Workspace
- [ ] Store credentials in secrets manager (not .env in production)

## Development

### Local Setup

```bash
# Install dependencies
cd tekup-mcp-servers/packages/google-mcp
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Start development server
pnpm dev
```

### Testing Tools

```bash
# List calendar events
curl -X POST http://localhost:3001/api/v1/tools/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key" \
  -d '{"tool":"list_calendar_events","arguments":{"maxResults":5}}'

# Send test email
curl -X POST http://localhost:3001/api/v1/tools/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key" \
  -d '{"tool":"send_email","arguments":{"to":"test@example.com","subject":"Test","body":"Hello"}}'
```

## Roadmap

### Phase 1: Core Features ✅

- [x] Google Calendar integration
- [x] Gmail integration
- [x] HTTP server
- [x] STDIO server
- [x] Documentation

### Phase 2: Enhancements (Future)

- [ ] Google Drive integration
- [ ] Google Contacts integration
- [ ] Advanced Calendar features (recurring events, reminders)
- [ ] Gmail drafts and threading
- [ ] Batch operations
- [ ] Webhook support

### Phase 3: Enterprise Features (Future)

- [ ] Multi-user support
- [ ] Role-based access control
- [ ] Advanced analytics
- [ ] SLA monitoring
- [ ] High availability setup

## Troubleshooting

### Common Issues

1. **"Google credentials not configured"**
   - Check environment variables are set correctly

2. **"Failed to create Google auth client"**
   - Verify domain-wide delegation is configured
   - Check OAuth scopes in Google Workspace Admin

3. **"403 Forbidden" from Google APIs**
   - Enable APIs in Google Cloud Console
   - Verify service account has delegation rights

4. **"Rate limit exceeded"**
   - Implement request queuing in client
   - Consider using multiple API keys

## Documentation Links

- [Package README](../packages/google-mcp/README.md) - Full API documentation
- [Deployment Guide](../packages/google-mcp/docs/DEPLOYMENT.md) - Detailed deployment instructions
- [Quick Start (Danish)](../packages/google-mcp/docs/QUICKSTART_DA.md) - Hurtig start guide
- [MCP Specification](https://spec.modelcontextprotocol.io/) - Model Context Protocol docs

## Support

For questions or issues:
- Review documentation in `packages/google-mcp/docs/`
- Check logs: `docker logs google-mcp`
- Contact Tekup team

## Contributors

- Tekup Development Team
- Built following tekup-billy MCP server patterns
- Uses existing Google Workspace setup for info@rendetalje.dk

---

**Status**: ✅ Ready for testing and deployment  
**Version**: 1.0.0  
**Last Updated**: 2025-11-01

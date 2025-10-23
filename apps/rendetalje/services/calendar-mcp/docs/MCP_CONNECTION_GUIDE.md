# RenOS Calendar MCP - Connection Guide

## Oversigt

Denne guide viser hvordan du forbinder RenOS Calendar MCP serveren til dit system.

## 1. MCP Server Setup

### Start MCP Server
```bash
# Development mode
npm run dev

# Production mode
npm start

# HTTP mode (for testing)
npm run start:http
```

### MCP Server Endpoints
- **MCP Protocol**: `ws://localhost:3001` (WebSocket)
- **HTTP API**: `http://localhost:3001` (REST)
- **Health Check**: `http://localhost:3001/health`
- **Tools**: `http://localhost:3001/tools`

## 2. Cursor/Claude Desktop Integration

### Cursor MCP Configuration
Opret `~/.cursor/mcp_servers.json`:

```json
{
  "mcpServers": {
    "renos-calendar": {
      "command": "node",
      "args": ["C:\\Users\\empir\\Tekup-Cloud\\renos-calendar-mcp\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production",
        "SUPABASE_URL": "https://oaevagdgrasfppbrxbey.supabase.co",
        "SUPABASE_ANON_KEY": "your_anon_key",
        "SUPABASE_SERVICE_KEY": "your_service_key",
        "GOOGLE_CLIENT_EMAIL": "renos-319@renos-465008.iam.gserviceaccount.com",
        "GOOGLE_PRIVATE_KEY": "your_private_key",
        "GOOGLE_PROJECT_ID": "renos-465008",
        "GOOGLE_CALENDAR_ID": "your_calendar_id",
        "GOOGLE_IMPERSONATED_USER": "info@rendetalje.dk",
        "TWILIO_ACCOUNT_SID": "your_twilio_sid",
        "TWILIO_AUTH_TOKEN": "your_twilio_token",
        "TWILIO_PHONE_NUMBER": "your_twilio_number",
        "BILLY_API_KEY": "your_billy_key",
        "BILLY_ORGANIZATION_ID": "your_org_id",
        "ENCRYPTION_KEY": "9c22d3c2cebd332a194ca9f30b99e57112d10a290d9188eda881fe09eaa01947",
        "ENCRYPTION_SALT": "9b2af923a0665b2f47c7a799b9484b28",
        "MCP_API_KEY": "renos-calendar-mcp-secret-key-2025",
        "ENABLE_AUTO_INVOICE": "true",
        "ENABLE_FAIL_SAFE_MODE": "true"
      }
    }
  }
}
```

### Claude Desktop Configuration
Opret `~/.claude/mcp_servers.json`:

```json
{
  "mcpServers": {
    "renos-calendar": {
      "command": "node",
      "args": ["C:\\Users\\empir\\Tekup-Cloud\\renos-calendar-mcp\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production",
        "SUPABASE_URL": "https://oaevagdgrasfppbrxbey.supabase.co",
        "SUPABASE_ANON_KEY": "your_anon_key",
        "SUPABASE_SERVICE_KEY": "your_service_key",
        "GOOGLE_CLIENT_EMAIL": "renos-319@renos-465008.iam.gserviceaccount.com",
        "GOOGLE_PRIVATE_KEY": "your_private_key",
        "GOOGLE_PROJECT_ID": "renos-465008",
        "GOOGLE_CALENDAR_ID": "your_calendar_id",
        "GOOGLE_IMPERSONATED_USER": "info@rendetalje.dk",
        "TWILIO_ACCOUNT_SID": "your_twilio_sid",
        "TWILIO_AUTH_TOKEN": "your_twilio_token",
        "TWILIO_PHONE_NUMBER": "your_twilio_number",
        "BILLY_API_KEY": "your_billy_key",
        "BILLY_ORGANIZATION_ID": "your_org_id",
        "ENCRYPTION_KEY": "9c22d3c2cebd332a194ca9f30b99e57112d10a290d9188eda881fe09eaa01947",
        "ENCRYPTION_SALT": "9b2af923a0665b2f47c7a799b9484b28",
        "MCP_API_KEY": "renos-calendar-mcp-secret-key-2025",
        "ENABLE_AUTO_INVOICE": "true",
        "ENABLE_FAIL_SAFE_MODE": "true"
      }
    }
  }
}
```

## 3. HTTP API Integration

### Direct HTTP Calls
```typescript
// Validate booking date
const response = await fetch('http://localhost:3001/validate-booking', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer renos-calendar-mcp-secret-key-2025'
  },
  body: JSON.stringify({
    date: '2025-01-20',
    expectedDayName: 'mandag',
    customerId: 'customer-123'
  })
});

const result = await response.json();
console.log(result);
```

### Available Endpoints
- `POST /validate-booking` - Validate booking date
- `POST /check-conflicts` - Check booking conflicts
- `POST /create-invoice` - Create Billy.dk invoice
- `POST /track-overtime` - Track overtime risk
- `POST /get-customer-memory` - Get customer intelligence
- `GET /health` - Health check
- `GET /tools` - List available tools

## 4. WebSocket MCP Protocol

### MCP Client Connection
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Connect to MCP server
const transport = new StdioClientTransport({
  command: 'node',
  args: ['C:\\Users\\empir\\Tekup-Cloud\\renos-calendar-mcp\\dist\\index.js']
});

const client = new Client({
  name: 'renos-calendar-client',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools);

// Call a tool
const result = await client.callTool({
  name: 'validate_booking_date',
  arguments: {
    date: '2025-01-20',
    expectedDayName: 'mandag',
    customerId: 'customer-123'
  }
});

console.log('Result:', result);
```

## 5. Environment Setup

### Create .env File
```bash
# Copy from deployment/.secrets/
cp deployment/.secrets/google-private-key.txt .env.google-private-key
cp deployment/.secrets/supabase-anon-key.txt .env.supabase-anon-key
cp deployment/.secrets/supabase-service-key.txt .env.supabase-service-key
```

### Environment Variables
```bash
# Database
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Google Calendar
GOOGLE_CLIENT_EMAIL=renos-319@renos-465008.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your_private_key
GOOGLE_PROJECT_ID=renos-465008
GOOGLE_CALENDAR_ID=your_calendar_id
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk

# Twilio Voice
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Billy.dk
BILLY_API_KEY=your_billy_key
BILLY_ORGANIZATION_ID=your_org_id

# Security
ENCRYPTION_KEY=9c22d3c2cebd332a194ca9f30b99e57112d10a290d9188eda881fe09eaa01947
ENCRYPTION_SALT=9b2af923a0665b2f47c7a799b9484b28
MCP_API_KEY=renos-calendar-mcp-secret-key-2025

# Features
ENABLE_AUTO_INVOICE=true
ENABLE_FAIL_SAFE_MODE=true
```

## 6. Testing Connection

### Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T10:00:00Z",
  "services": {
    "supabase": true,
    "google": true,
    "twilio": true,
    "billy": true
  }
}
```

### Tools List
```bash
curl http://localhost:3001/tools
```

Expected response:
```json
{
  "tools": [
    {
      "name": "validate_booking_date",
      "description": "Validate booking date and weekday",
      "inputSchema": { ... }
    },
    {
      "name": "check_booking_conflicts",
      "description": "Check for booking conflicts",
      "inputSchema": { ... }
    },
    {
      "name": "auto_create_invoice",
      "description": "Create Billy.dk invoice",
      "inputSchema": { ... }
    },
    {
      "name": "track_overtime_risk",
      "description": "Track overtime risk",
      "inputSchema": { ... }
    },
    {
      "name": "get_customer_memory",
      "description": "Get customer intelligence",
      "inputSchema": { ... }
    }
  ]
}
```

## 7. Production Deployment

### Render.com Deployment
```bash
# Deploy to Render
./scripts/deploy-render.ps1

# Verify deployment
./scripts/verify-deployment.ps1
```

### Production URLs
- **Backend**: `https://renos-calendar-mcp.onrender.com`
- **Dashboard**: `https://renos-calendar-dashboard.onrender.com`
- **Health**: `https://renos-calendar-mcp.onrender.com/health`

### Production MCP Configuration
```json
{
  "mcpServers": {
    "renos-calendar": {
      "command": "node",
      "args": ["C:\\Users\\empir\\Tekup-Cloud\\renos-calendar-mcp\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production",
        "SUPABASE_URL": "https://oaevagdgrasfppbrxbey.supabase.co",
        "SUPABASE_ANON_KEY": "your_anon_key",
        "SUPABASE_SERVICE_KEY": "your_service_key",
        "GOOGLE_CLIENT_EMAIL": "renos-319@renos-465008.iam.gserviceaccount.com",
        "GOOGLE_PRIVATE_KEY": "your_private_key",
        "GOOGLE_PROJECT_ID": "renos-465008",
        "GOOGLE_CALENDAR_ID": "your_calendar_id",
        "GOOGLE_IMPERSONATED_USER": "info@rendetalje.dk",
        "TWILIO_ACCOUNT_SID": "your_twilio_sid",
        "TWILIO_AUTH_TOKEN": "your_twilio_token",
        "TWILIO_PHONE_NUMBER": "your_twilio_number",
        "BILLY_API_KEY": "your_billy_key",
        "BILLY_ORGANIZATION_ID": "your_org_id",
        "ENCRYPTION_KEY": "9c22d3c2cebd332a194ca9f30b99e57112d10a290d9188eda881fe09eaa01947",
        "ENCRYPTION_SALT": "9b2af923a0665b2f47c7a799b9484b28",
        "MCP_API_KEY": "renos-calendar-mcp-secret-key-2025",
        "ENABLE_AUTO_INVOICE": "true",
        "ENABLE_FAIL_SAFE_MODE": "true"
      }
    }
  }
}
```

## 8. Troubleshooting

### Common Issues

1. **MCP Server Not Starting**
   ```bash
   # Check if port is available
   netstat -an | findstr :3001
   
   # Check logs
   npm run dev
   ```

2. **Environment Variables Missing**
   ```bash
   # Check .env file
   cat .env
   
   # Check deployment/.secrets/
   dir deployment\.secrets\
   ```

3. **Database Connection Failed**
   ```bash
   # Test Supabase connection
   curl -H "apikey: your_anon_key" https://oaevagdgrasfppbrxbey.supabase.co/rest/v1/
   ```

4. **Google Calendar API Error**
   ```bash
   # Check service account key
   echo $GOOGLE_PRIVATE_KEY
   
   # Test Google Calendar API
   curl -H "Authorization: Bearer your_token" https://www.googleapis.com/calendar/v3/calendars/primary/events
   ```

### Debug Mode
```bash
# Enable debug logging
DEBUG=renos-calendar-mcp:* npm run dev

# Verbose logging
LOG_LEVEL=debug npm run dev
```

## 9. Usage Examples

### In Cursor/Claude
```
User: "Valider om mandag den 20. januar 2025 er korrekt for kunde 123"

AI: I'll validate the booking date for customer 123.

[Uses validate_booking_date tool]
- Date: 2025-01-20
- Expected day: mandag
- Customer ID: 123

Result: ✅ Valid - Monday 20th January 2025 is correct for customer 123
```

### Direct API Call
```typescript
// Validate booking
const validation = await fetch('http://localhost:3001/validate-booking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2025-01-20',
    expectedDayName: 'mandag',
    customerId: 'customer-123'
  })
});

const result = await validation.json();
console.log(result.valid); // true/false
```

---

*Denne guide dækker alle aspekter af MCP server forbindelse.*

# Tekup MCP Servers

This repository contains custom MCP (Model Context Protocol) servers for TekupDK, enabling AI chatbots and automation systems to interact with various services.

## Available MCP Servers

### 1. Google MCP Server 🆕

**Status:** ✅ Production Ready

Google Workspace integration providing Google Calendar and Gmail functionality via MCP.

- **Location:** `packages/google-mcp/`
- **Features:**
  - Google Calendar operations (create, read, update, delete events)
  - Gmail operations (read, search, send emails)
  - HTTP REST API and STDIO transport
  - Service account authentication with domain-wide delegation
- **Documentation:** [Google MCP Integration Guide](./docs/GOOGLE_MCP_INTEGRATION.md)
- **Quick Start:** [Quick Start Guide (Danish)](./packages/google-mcp/docs/QUICKSTART_DA.md)
- **Deployment:** [Deployment Guide](./packages/google-mcp/docs/DEPLOYMENT.md)

### 2. Other MCP Servers

- **Base MCP Server** - Template for creating new MCP servers
- **Code Intelligence MCP** - Semantic code search and analysis
- **Database MCP** - Supabase and Prisma integration
- **Knowledge MCP** - Knowledge management and search
- **Performance Monitor** - System monitoring and metrics

## Overview

```
tekup-mcp-servers/
├── packages/
│   ├── google-mcp/           # Google Workspace integration
│   ├── base-mcp-server/      # Base template
│   ├── code-intelligence-mcp/
│   ├── database-mcp/
│   ├── knowledge-mcp/
│   └── performance-monitor/
├── config/                    # Shared configuration
└── docs/                      # Documentation
```

## Quick Start

### Install Dependencies

```bash
# Install all packages
pnpm install

# Install specific package
cd packages/google-mcp
pnpm install
```

### Build a Package

```bash
cd packages/google-mcp
pnpm build
```

### Run a Server

```bash
# HTTP mode
pnpm start

# STDIO mode (for MCP clients)
pnpm dev
```

## Architecture

All MCP servers in this repository follow a consistent architecture:

1. **STDIO Transport** - For local MCP clients (Claude Desktop, Cursor, etc.)
2. **HTTP REST API** - For remote access and chatbot integration
3. **SSE Support** - Real-time MCP protocol over HTTP
4. **Service Account Auth** - Secure authentication with Google/external services
5. **Rate Limiting** - Built-in protection (100 req/15min)
6. **Structured Logging** - Winston-based logging with JSON output
7. **Docker Support** - Containerization for easy deployment

## Integration Examples

### MCP Client Configuration

Add to your MCP client configuration (e.g., `~/.config/claude/mcp.json`):

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "node",
      "args": ["/path/to/google-mcp/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_EMAIL": "...",
        "GOOGLE_PRIVATE_KEY": "...",
        "GOOGLE_IMPERSONATED_USER": "info@rendetalje.dk"
      }
    }
  }
}
```

### HTTP API Usage

```javascript
import axios from 'axios';

const googleMcp = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'X-API-Key': process.env.API_KEY }
});

// List calendar events
const events = await googleMcp.post('/api/v1/tools/call', {
  tool: 'list_calendar_events',
  arguments: { maxResults: 10 }
});

// Send email
await googleMcp.post('/api/v1/tools/call', {
  tool: 'send_email',
  arguments: {
    to: 'recipient@example.com',
    subject: 'Hello',
    body: 'Message body'
  }
});
```

## Docker Deployment

### Single Server

```bash
cd packages/google-mcp
docker build -t tekup-google-mcp .
docker run -d -p 3001:3001 --env-file .env tekup-google-mcp
```

### Docker Compose (All Servers)

```bash
docker-compose up -d
```

## Documentation

- [Google MCP Integration](./docs/GOOGLE_MCP_INTEGRATION.md) - Complete Google MCP guide
- [MCP Project README](./docs/TEKUP_MCP_PROJECT_README.md) - Project overview
- [Security Guide](./docs/TEKUP_MCP_SECURITY.md) - Security best practices
- [Implementation Guide](./docs/TEKUP_MCP_IMPLEMENTATION_GUIDE.md) - Development guide

## Development

### Creating a New MCP Server

1. Copy the base MCP server template:
   ```bash
   cp -r packages/base-mcp-server packages/your-server
   ```

2. Update `package.json` with your server details

3. Implement your tools in `src/tools/`

4. Add configuration in `src/config.ts`

5. Create HTTP and STDIO servers

6. Write tests and documentation

### Testing

```bash
# Run tests for a specific package
cd packages/google-mcp
pnpm test

# Run integration tests
pnpm test:integration
```

## Security

All servers implement security best practices:

- ✅ Service account authentication (no user passwords)
- ✅ API key authentication for HTTP endpoints
- ✅ Rate limiting on all endpoints
- ✅ Helmet.js for HTTP security headers
- ✅ CORS configuration
- ✅ Input validation with Zod
- ✅ Structured audit logging
- ✅ Environment variable configuration

## Monitoring

### Health Checks

All servers expose a `/health` endpoint:

```bash
curl http://localhost:3001/health
```

### Logs

Structured JSON logs using Winston:

```bash
# Docker logs
docker logs -f google-mcp

# Local development
pnpm dev  # Logs to console
```

## Contributing

1. Follow the existing server patterns
2. Write comprehensive tests
3. Document all features and APIs
4. Use TypeScript with strict mode
5. Follow the Tekup code standards

## License

MIT License

## Support

For questions or issues:
- Review package-specific documentation
- Check the main documentation in `docs/`
- Contact the Tekup team

---

**Status:** Active Development  
**Last Updated:** 2025-11-01  
**Maintained by:** Tekup Development Team

# Google MCP Server - Deployment Guide

This guide explains how to deploy and integrate the Google MCP Server into the Tekup ecosystem.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Cloud Setup](#google-cloud-setup)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Connecting to Chatbots](#connecting-to-chatbots)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js >= 18.0.0
- PNPM >= 8.0.0
- Google Workspace account with admin access
- Google Cloud Platform account

## Google Cloud Setup

### 1. Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to "IAM & Admin" > "Service Accounts"
4. Click "Create Service Account"
5. Name: `tekup-google-mcp`
6. Description: `Service account for Tekup Google MCP Server`
7. Click "Create and Continue"
8. No need to grant roles at this step
9. Click "Done"

### 2. Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create"
6. Save the downloaded JSON file securely as `google-credentials.json`

### 3. Enable Domain-Wide Delegation

1. In the service account details page
2. Check "Enable Google Workspace Domain-wide Delegation"
3. Enter a product name (e.g., "Tekup Google MCP")
4. Click "Save"
5. Note the "Client ID" (you'll need this for the next step)

### 4. Configure Domain-Wide Delegation in Google Workspace

1. Go to [Google Admin Console](https://admin.google.com/)
2. Navigate to "Security" > "Access and data control" > "API Controls"
3. Click "Manage Domain Wide Delegation"
4. Click "Add new"
5. Enter the Client ID from step 3
6. Add the following OAuth scopes (one per line):
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.modify
   ```
7. Click "Authorize"

### 5. Enable Required APIs

1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable:
   - **Google Calendar API**
   - **Gmail API**

## Local Development Setup

### 1. Install Dependencies

```bash
cd tekup-mcp-servers/packages/google-mcp
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Parse the JSON credentials file you downloaded
GOOGLE_CLIENT_EMAIL=tekup-google-mcp@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id

# Or use the full JSON as a single string
# GOOGLE_CREDENTIALS='{"type":"service_account",...}'

# User to impersonate
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk

# Calendar ID (usually 'primary')
GOOGLE_CALENDAR_ID=primary

# Server settings
PORT=3001
NODE_ENV=development
API_KEY=dev-api-key-change-in-production

# Logging
LOG_LEVEL=info
```

**Important:** Extract the values from your `google-credentials.json`:
- `GOOGLE_CLIENT_EMAIL`: `client_email` field
- `GOOGLE_PRIVATE_KEY`: `private_key` field (keep the `\n` characters)
- `GOOGLE_PROJECT_ID`: `project_id` field

### 3. Build the Server

```bash
pnpm build
```

### 4. Test the Server

#### STDIO Mode (for MCP clients)

```bash
pnpm dev
```

#### HTTP Mode (for API access)

```bash
pnpm start
```

Then test the health endpoint:

```bash
curl http://localhost:3001/health
```

Test listing calendar events:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-api-key-change-in-production" \
  -d '{"tool":"list_calendar_events","arguments":{"maxResults":5}}' \
  http://localhost:3001/api/v1/tools/call
```

## Production Deployment

### Option 1: Docker Container

Create a `Dockerfile` in the `google-mcp` directory:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@10.17.0
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/http-server.js"]
```

Build and run:

```bash
docker build -t tekup-google-mcp .
docker run -d \
  --name google-mcp \
  -p 3001:3001 \
  --env-file .env \
  tekup-google-mcp
```

### Option 2: Docker Compose

Add to the main `docker-compose.yml` in `tekup-mcp-servers`:

```yaml
services:
  google-mcp:
    build:
      context: ./packages/google-mcp
      dockerfile: Dockerfile
    container_name: tekup-google-mcp
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - GOOGLE_CLIENT_EMAIL=${GOOGLE_CLIENT_EMAIL}
      - GOOGLE_PRIVATE_KEY=${GOOGLE_PRIVATE_KEY}
      - GOOGLE_PROJECT_ID=${GOOGLE_PROJECT_ID}
      - GOOGLE_IMPERSONATED_USER=${GOOGLE_IMPERSONATED_USER}
      - GOOGLE_CALENDAR_ID=${GOOGLE_CALENDAR_ID}
      - API_KEY=${GOOGLE_MCP_API_KEY}
      - LOG_LEVEL=info
    restart: unless-stopped
    networks:
      - tekup-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  tekup-network:
    driver: bridge
```

Start the service:

```bash
docker-compose up -d google-mcp
```

### Option 3: Cloud Deployment (Railway, Render, etc.)

1. Push code to a Git repository
2. Create a new service in your cloud platform
3. Set the following build settings:
   - **Build Command**: `cd tekup-mcp-servers/packages/google-mcp && pnpm install && pnpm build`
   - **Start Command**: `cd tekup-mcp-servers/packages/google-mcp && node dist/http-server.js`
   - **Port**: 3001

4. Set environment variables in the platform dashboard (same as in `.env`)

## Connecting to Chatbots

### Claude Desktop / MCP Clients

Add to your MCP configuration file (e.g., `~/.config/claude/mcp.json` or similar):

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "node",
      "args": [
        "/absolute/path/to/tekup-mcp-servers/packages/google-mcp/dist/index.js"
      ],
      "env": {
        "GOOGLE_CLIENT_EMAIL": "tekup-google-mcp@project.iam.gserviceaccount.com",
        "GOOGLE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
        "GOOGLE_PROJECT_ID": "your-project-id",
        "GOOGLE_IMPERSONATED_USER": "info@rendetalje.dk",
        "GOOGLE_CALENDAR_ID": "primary"
      }
    }
  }
}
```

Restart your MCP client to load the new server.

### Other Chatbots via HTTP API

For chatbots that support HTTP integrations:

1. Deploy the server using one of the production deployment options
2. Configure the chatbot to make HTTP requests to:
   - **Base URL**: `https://your-domain.com`
   - **Tool Call Endpoint**: `/api/v1/tools/call`
   - **Headers**: 
     - `Content-Type: application/json`
     - `X-API-Key: your-production-api-key`

Example HTTP request:

```bash
curl -X POST https://your-domain.com/api/v1/tools/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-production-api-key" \
  -d '{
    "tool": "list_calendar_events",
    "arguments": {
      "maxResults": 10
    }
  }'
```

### Integration with Tekup-Billy Pattern

The Google MCP Server follows the same pattern as tekup-billy, so you can:

1. **Use the same HTTP client** that works with tekup-billy
2. **Apply the same authentication** pattern (X-API-Key header)
3. **Parse responses** in the same format:
   ```json
   {
     "success": true,
     "data": { ... },
     "executionTime": 123
   }
   ```

Example Node.js integration:

```javascript
import axios from 'axios';

const googleMcpClient = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'X-API-Key': process.env.GOOGLE_MCP_API_KEY,
    'Content-Type': 'application/json',
  },
});

// List calendar events
async function getUpcomingEvents() {
  const response = await googleMcpClient.post('/api/v1/tools/call', {
    tool: 'list_calendar_events',
    arguments: { maxResults: 5 },
  });
  
  return response.data.data;
}

// Send email
async function sendNotification(to, subject, body) {
  const response = await googleMcpClient.post('/api/v1/tools/call', {
    tool: 'send_email',
    arguments: { to, subject, body },
  });
  
  return response.data.data;
}
```

## Monitoring and Logging

### Health Checks

Monitor the `/health` endpoint:

```bash
curl http://localhost:3001/health
```

Expected response:

```json
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

### Logs

The server uses Winston for structured logging. Logs are output to console in JSON format.

To view logs in Docker:

```bash
docker logs -f google-mcp
```

Set `LOG_LEVEL` environment variable to control verbosity:
- `error`: Only errors
- `warn`: Warnings and errors
- `info`: Normal operations (default)
- `debug`: Detailed debugging information

## Troubleshooting

### Issue: "Google credentials not configured"

**Solution**: Ensure you've set the required environment variables:
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- Or `GOOGLE_CREDENTIALS` as a JSON string

### Issue: "Failed to create Google auth client"

**Causes**:
1. Private key format is incorrect
   - **Solution**: Make sure newlines are preserved (`\n` in the string)
   
2. Domain-wide delegation not configured
   - **Solution**: Follow steps in [Google Cloud Setup](#google-cloud-setup)

3. OAuth scopes not authorized
   - **Solution**: Check Google Workspace Admin Console for authorized scopes

### Issue: "Unauthorized API request"

**Solution**: Include the correct API key in the `X-API-Key` header

### Issue: Calendar/Gmail API returns 403 Forbidden

**Causes**:
1. APIs not enabled in Google Cloud
   - **Solution**: Enable Google Calendar API and Gmail API

2. Service account doesn't have domain-wide delegation
   - **Solution**: Enable domain-wide delegation in service account settings

3. Impersonated user email is incorrect
   - **Solution**: Verify `GOOGLE_IMPERSONATED_USER` is a valid user in your workspace

### Issue: "Rate limit exceeded"

**Solution**: The server implements rate limiting (100 requests per 15 minutes). If you need higher limits:
1. Adjust `RATE_LIMIT` in the code
2. Use multiple API keys for different clients
3. Implement request queuing in your client

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use strong API keys** in production (32+ characters, random)
3. **Enable HTTPS** for production deployments
4. **Rotate credentials** regularly (quarterly recommended)
5. **Monitor API usage** in Google Cloud Console
6. **Set up alerts** for unusual activity
7. **Use firewall rules** to restrict access to known IPs
8. **Enable audit logging** in Google Workspace

## Next Steps

After successful deployment:

1. Test all tools with your Google Workspace account
2. Integrate with your chatbot/AI agent
3. Monitor logs and performance
4. Set up automated backups of critical data
5. Document any custom configurations

## Support

For issues or questions:
- Check the [main README](../README.md)
- Review [Troubleshooting](#troubleshooting)
- Contact the Tekup team

# Google MCP Server

Google Workspace MCP Server for Tekup - provides Gmail and Google Calendar integration via the Model Context Protocol (MCP).

## Features

### Google Calendar Integration

- ✅ List upcoming calendar events
- ✅ Get specific calendar event details
- ✅ Create new calendar events
- ✅ Update existing calendar events
- ✅ Delete calendar events
- ✅ Check for calendar conflicts

### Gmail Integration

- ✅ List recent emails
- ✅ Get specific email details
- ✅ Search emails using Gmail query syntax
- ✅ Send emails (text and HTML)
- ✅ Get email labels
- ✅ Mark emails as read

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Configuration

The server requires Google Service Account credentials with domain-wide delegation enabled.

### Environment Variables

Create a `.env` file with the following variables:

```env
# Google Service Account Credentials
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id

# Or provide as JSON string
GOOGLE_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"...",...}'

# User to impersonate (for domain-wide delegation)
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk

# Calendar settings
GOOGLE_CALENDAR_ID=primary

# Server settings (for HTTP mode)
PORT=3001
NODE_ENV=development
API_KEY=your-api-key-here

# Dry run mode (testing without actual API calls)
DRY_RUN=false
```

### Setting up Google Service Account

1. **Create a Service Account** in Google Cloud Console:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select or create a project
   - Navigate to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name and description
   - Click "Create and Continue"

2. **Generate Service Account Key**:
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Save the downloaded JSON file securely

3. **Enable Domain-Wide Delegation**:
   - In the service account details, check "Enable Google Workspace Domain-wide Delegation"
   - Note the Client ID (you'll need this for the next step)

4. **Configure Domain-Wide Delegation in Google Workspace Admin**:
   - Go to [Google Admin Console](https://admin.google.com/)
   - Navigate to "Security" > "API Controls" > "Domain-wide Delegation"
   - Click "Add new"
   - Enter the Client ID from step 3
   - Add the following OAuth scopes:
     ```
     https://www.googleapis.com/auth/calendar
     https://www.googleapis.com/auth/gmail.readonly
     https://www.googleapis.com/auth/gmail.send
     https://www.googleapis.com/auth/gmail.modify
     ```
   - Click "Authorize"

5. **Enable Required APIs**:
   - In Google Cloud Console, go to "APIs & Services" > "Library"
   - Enable the following APIs:
     - Google Calendar API
     - Gmail API

## Usage

### STDIO Mode (Local MCP Clients)

For use with Claude Desktop or other local MCP clients:

```bash
# Run with tsx
pnpm dev

# Or build and run
pnpm build
node dist/index.js
```

Add to your MCP client configuration (e.g., Claude Desktop `mcp.json`):

```json
{
  "mcpServers": {
    "google": {
      "command": "node",
      "args": ["/path/to/tekup-mcp-servers/packages/google-mcp/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_EMAIL": "your-service-account@project.iam.gserviceaccount.com",
        "GOOGLE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
        "GOOGLE_IMPERSONATED_USER": "info@rendetalje.dk"
      }
    }
  }
}
```

### HTTP Mode (Remote Access)

For use with other chatbots and HTTP clients:

```bash
# Start HTTP server
pnpm start

# Or in development mode
pnpm dev:http
```

The server will start on the configured PORT (default: 3001).

#### API Endpoints

- **Health Check**: `GET /health`
  ```bash
  curl http://localhost:3001/health
  ```

- **List Tools**: `GET /api/v1/tools/list`
  ```bash
  curl -H "X-API-Key: your-api-key" \
       http://localhost:3001/api/v1/tools/list
  ```

- **Call Tool**: `POST /api/v1/tools/call`
  ```bash
  curl -X POST \
       -H "Content-Type: application/json" \
       -H "X-API-Key: your-api-key" \
       -d '{"tool":"list_calendar_events","arguments":{"maxResults":5}}' \
       http://localhost:3001/api/v1/tools/call
  ```

- **MCP SSE**: `GET /mcp/sse` (for MCP protocol over HTTP)

## Available Tools

### Calendar Tools

#### `list_calendar_events`

List upcoming calendar events with optional filters.

```json
{
  "tool": "list_calendar_events",
  "arguments": {
    "maxResults": 10,
    "timeMin": "2025-11-01T00:00:00Z",
    "timeMax": "2025-11-30T23:59:59Z",
    "query": "meeting"
  }
}
```

#### `get_calendar_event`

Get details of a specific calendar event.

```json
{
  "tool": "get_calendar_event",
  "arguments": {
    "eventId": "event-id-here"
  }
}
```

#### `create_calendar_event`

Create a new calendar event.

```json
{
  "tool": "create_calendar_event",
  "arguments": {
    "summary": "Team Meeting",
    "description": "Quarterly review meeting",
    "location": "Conference Room A",
    "startTime": "2025-11-15T14:00:00Z",
    "endTime": "2025-11-15T15:00:00Z",
    "attendees": ["colleague@company.com"],
    "timeZone": "Europe/Copenhagen"
  }
}
```

#### `update_calendar_event`

Update an existing calendar event.

```json
{
  "tool": "update_calendar_event",
  "arguments": {
    "eventId": "event-id-here",
    "summary": "Updated Meeting Title",
    "startTime": "2025-11-15T15:00:00Z"
  }
}
```

#### `delete_calendar_event`

Delete a calendar event.

```json
{
  "tool": "delete_calendar_event",
  "arguments": {
    "eventId": "event-id-here"
  }
}
```

#### `check_calendar_conflicts`

Check for calendar conflicts in a time range.

```json
{
  "tool": "check_calendar_conflicts",
  "arguments": {
    "startTime": "2025-11-15T14:00:00Z",
    "endTime": "2025-11-15T15:00:00Z",
    "excludeEventId": "optional-event-to-exclude"
  }
}
```

### Gmail Tools

#### `list_emails`

List recent emails with optional filters.

```json
{
  "tool": "list_emails",
  "arguments": {
    "maxResults": 10,
    "query": "is:unread",
    "labelIds": ["INBOX"]
  }
}
```

#### `get_email`

Get details of a specific email.

```json
{
  "tool": "get_email",
  "arguments": {
    "messageId": "message-id-here"
  }
}
```

#### `search_emails`

Search emails using Gmail search syntax.

```json
{
  "tool": "search_emails",
  "arguments": {
    "query": "from:user@example.com subject:invoice",
    "maxResults": 20
  }
}
```

#### `send_email`

Send an email.

```json
{
  "tool": "send_email",
  "arguments": {
    "to": "recipient@example.com",
    "subject": "Hello from Google MCP",
    "body": "This is a test email sent via Google MCP Server.",
    "cc": ["cc@example.com"],
    "isHtml": false
  }
}
```

#### `get_email_labels`

Get all email labels.

```json
{
  "tool": "get_email_labels",
  "arguments": {}
}
```

#### `mark_email_as_read`

Mark an email as read.

```json
{
  "tool": "mark_email_as_read",
  "arguments": {
    "messageId": "message-id-here"
  }
}
```

## Integration with Other Chatbots

The Google MCP Server can be connected to other chatbots via the HTTP API:

1. **Configure the chatbot** to make HTTP requests to the MCP server
2. **Use the `/api/v1/tools/call` endpoint** to invoke tools
3. **Include the API key** in the `X-API-Key` header
4. **Parse the JSON response** to get the tool execution results

### Example Integration (Node.js)

```javascript
import axios from 'axios';

const mcpClient = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json',
  },
});

// List calendar events
const events = await mcpClient.post('/api/v1/tools/call', {
  tool: 'list_calendar_events',
  arguments: { maxResults: 5 },
});

console.log(events.data);

// Send email
const emailResult = await mcpClient.post('/api/v1/tools/call', {
  tool: 'send_email',
  arguments: {
    to: 'recipient@example.com',
    subject: 'Test Email',
    body: 'Hello from the chatbot!',
  },
});

console.log(emailResult.data);
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Run HTTP server in development
pnpm dev:http

# Build
pnpm build

# Run tests
pnpm test
```

## Security

- Always use environment variables for sensitive credentials
- Never commit credentials to version control
- Use API key authentication in production
- Implement rate limiting for public endpoints
- Use HTTPS in production deployments

## Troubleshooting

### "Google credentials not configured"

Make sure you have set the required environment variables:
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- Or `GOOGLE_CREDENTIALS` as a JSON string

### "Unauthorized API request"

If using HTTP mode, ensure you're sending the correct API key in the `X-API-Key` header.

### "Failed to create Google auth client"

Check that:
1. Your service account has domain-wide delegation enabled
2. The OAuth scopes are configured in Google Workspace Admin Console
3. The impersonated user email is valid
4. The private key format is correct (with actual newlines, not `\n` strings)

## License

MIT License - see LICENSE file for details

## Author

Tekup Team

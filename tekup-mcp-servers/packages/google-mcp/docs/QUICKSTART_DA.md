# Google MCP Server - Hurtig Start Guide (Dansk)

En hurtig guide til at komme i gang med Google MCP Serveren for Tekup.

## Hvad er Google MCP Server?

Google MCP Server giver dig mulighed for at integrere Google Calendar og Gmail med AI chatbots via Model Context Protocol (MCP). Dette gør det muligt for chatbots at:

- 📅 Læse, oprette og administrere Google Calendar aftaler
- 📧 Læse, søge og sende Gmail emails
- 🔄 Synkronisere med andre systemer via MCP protokollen

## Hurtig Opsætning

### 1. Installer Dependencies

```bash
cd tekup-mcp-servers/packages/google-mcp
pnpm install
pnpm build
```

### 2. Google Cloud Opsætning

#### Opret Service Account

1. Gå til [Google Cloud Console](https://console.cloud.google.com/)
2. Vælg eller opret et projekt
3. Naviger til "IAM & Admin" > "Service Accounts"
4. Klik "Create Service Account"
5. Navn: `tekup-google-mcp`
6. Download JSON nøglefilen

#### Aktivér Domain-Wide Delegation

1. I service account detaljer, aktivér "Enable Google Workspace Domain-wide Delegation"
2. Notér Client ID

#### Konfigurér i Google Workspace Admin

1. Gå til [Google Admin Console](https://admin.google.com/)
2. Naviger til "Security" > "API Controls" > "Domain-wide Delegation"
3. Tilføj Client ID med følgende scopes:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.modify
   ```

#### Aktivér APIs

I Google Cloud Console, aktivér:

- Google Calendar API
- Gmail API

### 3. Konfigurér Environment Variables

Opret en `.env` fil:

```env
# Fra din Google Service Account JSON fil
GOOGLE_CLIENT_EMAIL=tekup-google-mcp@projekt-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=dit-projekt-id

# Bruger at impersonere (info@rendetalje.dk er allerede konfigureret)
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk

# Server indstillinger
PORT=3001
NODE_ENV=development
API_KEY=din-sikre-api-nøgle
```

### 4. Start Serveren

#### For lokal udvikling (STDIO mode)

```bash
pnpm dev
```

#### For HTTP tilgang

```bash
pnpm start
```

Server kører nu på: `http://localhost:3001`

### 5. Test Serveren

```bash
# Health check
curl http://localhost:3001/health

# List kalender events
curl -X POST http://localhost:3001/api/v1/tools/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: din-sikre-api-nøgle" \
  -d '{"tool":"list_calendar_events","arguments":{"maxResults":5}}'
```

## Tilgængelige Funktioner

### Google Calendar

- `list_calendar_events` - Vis kommende aftaler
- `get_calendar_event` - Hent detaljer om en specifik aftale
- `create_calendar_event` - Opret ny kalenderaftale
- `update_calendar_event` - Opdater eksisterende aftale
- `delete_calendar_event` - Slet kalenderaftale
- `check_calendar_conflicts` - Tjek for konflikter i tidsperiode

### Gmail

- `list_emails` - Vis seneste emails
- `get_email` - Hent detaljer om specifik email
- `search_emails` - Søg i emails
- `send_email` - Send email
- `get_email_labels` - Hent alle email labels
- `mark_email_as_read` - Markér email som læst

## Integration med Chatbots

### Claude Desktop / MCP Klienter

Tilføj til din MCP konfiguration (`mcp.json`):

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "node",
      "args": ["/sti/til/google-mcp/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_EMAIL": "...",
        "GOOGLE_PRIVATE_KEY": "...",
        "GOOGLE_IMPERSONATED_USER": "info@rendetalje.dk"
      }
    }
  }
}
```

### Andre Chatbots via HTTP

Brug HTTP API'et til at kalde tools:

```javascript
// Eksempel med axios
const response = await axios.post('http://localhost:3001/api/v1/tools/call', {
  tool: 'list_calendar_events',
  arguments: { maxResults: 10 }
}, {
  headers: { 'X-API-Key': 'din-api-nøgle' }
});

console.log(response.data);
```

## Eksempler

### Send en email

```bash
curl -X POST http://localhost:3001/api/v1/tools/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: din-api-nøgle" \
  -d '{
    "tool": "send_email",
    "arguments": {
      "to": "modtager@example.com",
      "subject": "Test fra Google MCP",
      "body": "Dette er en test email sendt via Google MCP Server"
    }
  }'
```

### Opret kalenderaftale

```bash
curl -X POST http://localhost:3001/api/v1/tools/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: din-api-nøgle" \
  -d '{
    "tool": "create_calendar_event",
    "arguments": {
      "summary": "Møde med klient",
      "description": "Diskussion om projekt status",
      "location": "Kontor A",
      "startTime": "2025-11-15T14:00:00+01:00",
      "endTime": "2025-11-15T15:00:00+01:00",
      "attendees": ["kollega@firma.dk"]
    }
  }'
```

### Søg i emails

```bash
curl -X POST http://localhost:3001/api/v1/tools/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: din-api-nøgle" \
  -d '{
    "tool": "search_emails",
    "arguments": {
      "query": "from:kunde@example.com subject:faktura",
      "maxResults": 10
    }
  }'
```

## Docker Deployment

### Byg Docker image

```bash
cd tekup-mcp-servers/packages/google-mcp
docker build -t tekup-google-mcp .
```

### Kør container

```bash
docker run -d \
  --name google-mcp \
  -p 3001:3001 \
  --env-file .env \
  tekup-google-mcp
```

### Eller brug Docker Compose

Tilføj til `docker-compose.yml`:

```yaml
services:
  google-mcp:
    build: ./packages/google-mcp
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - GOOGLE_CLIENT_EMAIL=${GOOGLE_CLIENT_EMAIL}
      - GOOGLE_PRIVATE_KEY=${GOOGLE_PRIVATE_KEY}
      - GOOGLE_IMPERSONATED_USER=info@rendetalje.dk
    restart: unless-stopped
```

Start:
```bash
docker-compose up -d google-mcp
```

## Fejlfinding

### "Google credentials not configured"

**Løsning**: Tjek at environment variables er sat korrekt.

### "Failed to create Google auth client"

**Årsager**:

1. Private key format er forkert - Tjek at `\n` er bevaret i nøglen
2. Domain-wide delegation ikke konfigureret - Følg opsætningsguiden
3. OAuth scopes ikke autoriseret - Tjek Google Workspace Admin Console

### "Unauthorized API request"

**Løsning**: Inkludér korrekt API nøgle i `X-API-Key` header.

### API returnerer 403 Forbidden

**Løsning**:

1. Tjek at APIs er aktiveret i Google Cloud
2. Verificér domain-wide delegation er konfigureret korrekt
3. Kontrollér at impersoneret bruger email er korrekt

## Sikkerhed

⚠️ **Vigtige sikkerhedspraksisser:**

1. **Aldrig commit credentials** til version control
2. **Brug stærke API nøgler** i produktion
3. **Aktivér HTTPS** i produktion
4. **Rotér credentials regelmæssigt**
5. **Overvåg API forbrug** i Google Cloud Console

## Yderligere Dokumentation

- [Fuld README](../README.md) - Komplet dokumentation på engelsk
- [Deployment Guide](./DEPLOYMENT.md) - Detaljeret deployment guide
- [API Reference](../README.md#available-tools) - Liste over alle tools og parametre

## Support

For spørgsmål eller problemer:

- Kontakt Tekup teamet
- Se troubleshooting sektionen ovenfor
- Tjek logs: `docker logs google-mcp` eller `pnpm dev`

## Næste Skridt

1. ✅ Test alle tools med din Google Workspace konto
2. ✅ Integrér med din chatbot
3. ✅ Opsæt monitoring og logging
4. ✅ Deploy til produktion
5. ✅ Dokumentér eventuelle tilpasninger

---

**Godt arbejde med din Google MCP Server integration! 🚀**

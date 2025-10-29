# RenOS Calendar MCP - Shortwave.ai Integration Guide

## Oversigt

Denne guide viser hvordan du integrerer RenOS Calendar MCP med Shortwave.ai for automatisk email analyse og kunde intelligence.

## 1. Shortwave.ai Setup

### Opret Shortwave.ai Account

1. Gå til [shortwave.ai](https://shortwave.ai)
2. Opret account med din business email
3. Verificer email adresse
4. Setup workspace for RenOS

### Shortwave.ai API Access

```bash
# Shortwave.ai API endpoints
SHORTWAVE_API_URL=https://api.shortwave.ai/v1
SHORTWAVE_API_KEY=your_shortwave_api_key
SHORTWAVE_WORKSPACE_ID=your_workspace_id
```

## 2. MCP Server Integration

### Start MCP Server med Shortwave Support

```bash
# Start MCP server
cd C:\Users\empir\Tekup-Cloud\renos-calendar-mcp
npm run dev

# Test Shortwave connection
curl -X POST http://localhost:3001/shortwave/connect \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"your_shortwave_api_key","workspaceId":"your_workspace_id"}'
```

### Shortwave.ai MCP Tools

```typescript
// Available Shortwave.ai tools
const shortwaveTools = [
  'analyze_email_content',      // Analyse email indhold
  'extract_booking_info',       // Udtræk booking information
  'detect_customer_sentiment',  // Detekter kunde sentiment
  'classify_email_type',        // Klassificer email type
  'extract_contact_info',       // Udtræk kontakt information
  'monitor_email_patterns'      // Overvåg email mønstre
];
```

## 3. Email Analysis Workflow

### Automatisk Email Analyse

```typescript
// Analyse indgående emails
const emailAnalysis = await analyzeEmailContent({
  emailId: 'email_123',
  content: 'Hej, jeg vil gerne booke rengøring til næste uge',
  sender: 'kunde@example.com',
  subject: 'Booking anmodning'
});

// Resultat
{
  type: 'booking_request',
  confidence: 0.95,
  extractedInfo: {
    serviceType: 'rengøring',
    urgency: 'normal',
    customerId: 'customer_123',
    preferredDate: 'next_week'
  },
  sentiment: 'positive',
  actionRequired: 'create_booking'
}
```

## 4. MCP Server Configuration

### Shortwave.ai MCP Tools

```typescript
// MCP tools for Shortwave.ai integration
export const shortwaveTools = [
  {
    name: 'analyze_email_content',
    description: 'Analyse email indhold og udtræk information',
    inputSchema: {
      type: 'object',
      properties: {
        emailId: { type: 'string', description: 'Email ID' },
        content: { type: 'string', description: 'Email indhold' },
        sender: { type: 'string', description: 'Afsender email' },
        subject: { type: 'string', description: 'Email emne' }
      },
      required: ['emailId', 'content', 'sender']
    }
  }
];
```

## 5. Usage Examples

### In Cursor/Claude with Shortwave.ai

```
User: "Analyser den seneste email fra kunde@example.com"

AI: I'll analyze the latest email from customer@example.com using Shortwave.ai.

[Uses analyze_email_content tool]
- Email ID: email_123
- Content: "Hej, jeg vil gerne booke rengøring til næste uge"
- Sender: customer@example.com
- Subject: "Booking anmodning"

Result: 
✅ Email Type: Booking Request
✅ Confidence: 95%
✅ Service Type: Rengøring
✅ Urgency: Normal
✅ Customer Sentiment: Positive
✅ Action Required: Create Booking
```

## 6. Environment Variables

### Shortwave.ai Configuration

```bash
# Shortwave.ai configuration
SHORTWAVE_API_KEY=your_shortwave_api_key
SHORTWAVE_WORKSPACE_ID=your_workspace_id
SHORTWAVE_EMAIL_DOMAIN=rendetalje.dk
SHORTWAVE_INBOX_FILTER=renos-calendar

# Email monitoring
EMAIL_MONITORING_ENABLED=true
EMAIL_ANALYSIS_ENABLED=true
CUSTOMER_INTELLIGENCE_ENABLED=true
```

## 7. Testing

### Test Shortwave.ai Connection

```bash
# Test API connection
curl -X POST http://localhost:3001/shortwave/test \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"your_shortwave_api_key"}'

# Test email analysis
curl -X POST http://localhost:3001/shortwave/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hej, jeg vil gerne booke rengøring til næste uge",
    "sender": "kunde@example.com",
    "subject": "Booking anmodning"
  }'
```

## 8. Production Deployment

### Deploy with Shortwave.ai Support

```bash
# Deploy with Shortwave.ai integration
./scripts/deploy-all.ps1

# Verify Shortwave.ai connection
curl https://renos-calendar-mcp.onrender.com/shortwave/health
```

---

*Denne guide dækker Shortwave.ai integration med RenOS Calendar MCP.*

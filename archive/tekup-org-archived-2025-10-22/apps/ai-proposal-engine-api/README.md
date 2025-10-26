# AI Proposal Engine

An autonomous AI system that converts sales call transcripts into precision-targeted proposals using MCP (Model Context Protocol) agent architecture.

## Overview

The AI Proposal Engine dramatically reduces proposal generation time from 4+ hours to 10 minutes while increasing accuracy and personalization. It automatically:

- Extracts buying signals from sales call transcripts
- Conducts live research to strengthen proposals
- Generates compelling narratives tailored to prospect psychology
- Assembles professional Google Docs ready to send

## Architecture

The system uses a modular MCP-based architecture with the following components:

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Airtable      │    │    MCP Host          │    │   Google Docs       │
│  (Transcripts)  │───▶│   (Orchestrator)     │───▶│   (Final Proposal)  │
└─────────────────┘    └──────────────────────┘    └─────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │    MCP Servers       │
                    │                      │
                    │ • Transcript Intel   │
                    │ • Signal Extraction  │
                    │ • Live Research      │
                    │ • Narrative Gen      │
                    │ • Document Assembly  │
                    └──────────────────────┘
```

### MCP Servers

1. **Transcript Intelligence**: Processes call transcripts from Airtable
2. **Buying Signal Extraction**: Identifies psychological triggers and pain points
3. **Live Research Integration**: Conducts real-time research via Perplexity API
4. **Narrative Generation**: Creates compelling proposal content
5. **Document Assembly**: Generates styled Google Docs

## Features

### 🎯 Precision Targeting
- Extracts buying signals with sniper precision
- Identifies urgency, budget, authority, and pain point indicators
- Adapts tone and messaging to prospect psychology

### 🔍 Live Research Integration
- Real-time industry trend analysis
- Company-specific intelligence gathering
- Solution validation with supporting statistics
- Competitive positioning insights

### 📝 Autonomous Document Generation
- Professional Google Docs styling
- Consistent branding and formatting
- Shareable links for immediate delivery
- Export capabilities (PDF, DOCX, HTML)

### ⚡ Speed & Efficiency
- 15-minute setup process
- 10-minute proposal generation
- Zero manual intervention required
- Scalable across multiple prospects

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-proposal-engine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## Configuration

### Required API Keys

Create a `.env` file with the following configuration:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Perplexity API Configuration (optional, falls back to OpenAI)
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
AIRTABLE_TABLE_NAME=Sales_Calls

# Google APIs Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=your_redirect_uri_here
GOOGLE_REFRESH_TOKEN=your_refresh_token_here

# MCP Configuration
MCP_HOST_PORT=3000
MCP_SERVER_PORTS_START=3001
```

### Airtable Setup

Your Airtable base should have a table with the following fields:
- `Transcript` (Long text): The call transcript content
- `Recording Date` (Date): When the call took place
- `Duration` (Number): Call duration in seconds
- `Participants` (Multiple select): Call participants
- `Company` (Single line text): Prospect company name
- `Industry` (Single line text): Company industry

### Google APIs Setup

1. Create a Google Cloud Project
2. Enable Google Docs API and Google Drive API
3. Create OAuth 2.0 credentials
4. Generate a refresh token for your account

## Usage

### Starting the System

**Development mode (with hot reload):**
```bash
# Start the MCP host
npm run dev:host

# In separate terminals, start each server:
npm run dev:transcript
npm run dev:signals
npm run dev:research
npm run dev:narrative
npm run dev:assembly
```

**Production mode:**
```bash
# Start all services
npm start

# Or start individual services:
npm run start:host
npm run start:transcript
npm run start:signals
npm run start:research
npm run start:narrative
npm run start:assembly
```

### Generating a Proposal

The system exposes MCP tools that can be called programmatically:

```typescript
// Generate a complete proposal
const result = await mcpHost.callTool('generate_proposal', {
  transcriptId: 'rec123456789',
  templateId: 'optional-template-id',
  targetAudience: 'C-level executives',
  customInstructions: 'Focus on ROI and quick implementation'
});

// Analyze transcript only
const analysis = await mcpHost.callTool('analyze_transcript', {
  transcriptId: 'rec123456789'
});
```

### API Integration

The system can be integrated into existing workflows via:
- Direct MCP client connections
- REST API wrapper (custom implementation)
- Webhook triggers from Airtable
- Scheduled batch processing

## Results & Performance

Based on real-world implementations:

- **$8,500 closed** from single transcript
- **4+ hours → 10 minutes** proposal time reduction
- **"Most comprehensive strategy document ever received"** - client feedback
- **Zero manual work** required after setup
- **Insane accuracy** in targeting prospect needs

## Development

### Project Structure

```
ai-proposal-engine/
├── src/
│   ├── mcp-host/           # Main orchestrator
│   ├── servers/            # MCP servers
│   │   ├── transcript-intelligence/
│   │   ├── buying-signal-extraction/
│   │   ├── live-research/
│   │   ├── narrative-generation/
│   │   └── document-assembly/
│   ├── shared/             # Shared utilities
│   └── types/              # TypeScript types
├── config/                 # Configuration files
├── tests/                  # Test suites
└── docs/                   # Documentation
```

### Adding New Features

1. **New MCP Server**: Create in `src/servers/new-server/`
2. **New Tools**: Add to existing servers' tool handlers
3. **New Types**: Define in `src/types/index.ts`
4. **New Utilities**: Add to `src/shared/utils.ts`

### Testing

```bash
npm test
```

## Deployment

### For Tekup Organization

The system integrates with Tekup's existing infrastructure:

- **Backend**: NestJS + TypeScript + Prisma
- **Frontend**: Next.js 15 + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Design**: Glassmorphism + neon effects
- **Authentication**: Unified with other Tekup services

### Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   LOG_LEVEL=info
   ```

2. **Process Management**
   ```bash
   # Using PM2
   pm2 start ecosystem.config.js
   
   # Using Docker
   docker-compose up -d
   ```

3. **Monitoring**
   - Health checks on all MCP servers
   - API rate limit monitoring
   - Document generation success rates
   - Error tracking and alerting

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify all API keys are correctly set in `.env`
   - Check API quotas and billing status

2. **Google APIs Issues**
   - Ensure OAuth 2.0 is properly configured
   - Verify refresh token is valid
   - Check API permissions and scopes

3. **Airtable Connection**
   - Verify base ID and table name
   - Check field names match expected schema
   - Ensure API key has read permissions

4. **MCP Server Communication**
   - Check server ports are available
   - Verify servers are running and responsive
   - Review logs for connection errors

### Logs and Debugging

```bash
# View logs
tail -f logs/ai-proposal-engine.log

# Debug mode
LOG_LEVEL=debug npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the Tekup AI Team
- Review the documentation in `/docs`

---

**Built with ❤️ by the Tekup AI Team**

# TekUp Gmail Automation - Copilot Instructions

## Project Overview
**Python 3.8+ MCP server** for intelligent Gmail PDF forwarding and receipt processing, integrated with e-conomic accounting system. Dual operation modes: traditional Gmail forwarder and Model Context Protocol (MCP) server for AI agent integration.

## Architecture & Data Flow

### Dual-Mode Operation
```
Gmail API ──┬─→ GmailPDFForwarder (Traditional)
            │   └─→ PDF filtering → Label management → Forward to e-conomic
            │
            └─→ GmailMCPServer (AI Integration)
                └─→ MCP Tools → Gmail operations → Resource management
```

**Key Components:**
- `src/core/gmail_forwarder.py` - Core Gmail OAuth + PDF processing logic
- `gmail_mcp_server.py` - Generic Gmail MCP server with auto-OAuth
- `tekup_gmail_mcp_server.py` - TekUp-specific MCP integration
- `src/integrations/` - e-conomic API + RenOS backend integration
- `src/processors/` - Google Photos receipt processing + analytics

### Authentication Strategy (Critical)
**Two authentication paths** - NEVER mix them:

1. **Service Account (Headless)** - Production/Docker preferred:
   ```python
   GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
   GOOGLE_IMPERSONATED_USER=user@domain.com
   ```

2. **OAuth 2.0 (Interactive)** - Local development fallback:
   ```python
   GMAIL_CLIENT_ID=*.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=GOCSPX-*
   # Requires browser interaction, saves token.json
   ```

**Implementation:** `src/core/gmail_forwarder.py::authenticate()` tries service account first, falls back to OAuth if not configured. Check `token.pickle` or `token.json` existence to determine active mode.

## Critical Development Patterns

### Environment Configuration (MANDATORY)
All configuration via `.env` - NEVER hardcode credentials:

```bash
# Core required vars (see .env.example for full list)
GMAIL_USER_EMAIL=your-email@gmail.com
ECONOMIC_RECEIPT_EMAIL=receipts@e-conomic.dk
PROCESSED_LABEL=Videresendt_econ
DAYS_BACK=180
MAX_EMAILS=100
```

**Validation:** `GmailPDFForwarder.validate_config()` fails fast on missing vars. Email regex pattern enforced.

### MCP Server Tools Pattern
**Tool registration in `gmail_mcp_server.py`:**
- `@server.list_tools()` - Declare available operations with JSON schemas
- `@server.call_tool()` - Route tool calls to internal methods
- `@server.list_resources()` / `@server.read_resource()` - Resource management

**Example tool call flow:**
```python
call_tool("send_email", {...}) 
  → _send_email() 
  → gmail_service.users().messages().send()
  → [TextContent(type="text", text=json.dumps(result))]
```

## Common Development Tasks

### Running the System
```bash
# Traditional forwarder (one-time run)
python -m src.core.main start

# Daemon mode with auto-retry
python -m src.core.main start --daemon --interval 300

# MCP server for AI agents
python gmail_mcp_server.py

# TekUp-specific MCP server
python tekup_gmail_mcp_server.py
```

### Testing Workflow
```bash
# Quick system validation (no API calls)
python test_system_simple.py

# Gmail forwarder functional test
python test_gmail_only.py

# MCP server integration test
python test_mcp_simple.py

# Full test suite (requires credentials)
pytest tests/
```

**Test Environment:** Windows 10, Python 3.13.7 verified. 100% pass rate (17/17 tests) as of v1.2.0.

### Adding New Gmail Operations

1. **Add tool definition** in `gmail_mcp_server.py::list_tools()`:
   ```python
   Tool(
       name="your_operation",
       description="...",
       inputSchema={
           "type": "object",
           "properties": {...},
           "required": [...]
       }
   )
   ```

2. **Implement handler** in same file:
   ```python
   async def _your_operation(self, param1, param2):
       """Always async, always return dict"""
       try:
           result = self.gmail_service.users()...execute()
           return {"status": "success", "data": result}
       except HttpError as e:
           logger.error(f"Gmail API error: {e}")
           return {"error": str(e)}
   ```

3. **Route in `call_tool()`**:
   ```python
   elif name == "your_operation":
       result = await self._your_operation(arguments["param1"], ...)
   ```

## Key File Purposes

| File/Directory | Purpose | Modify When... |
|----------------|---------|----------------|
| `src/core/gmail_forwarder.py` | Gmail OAuth + PDF filtering | Changing email search logic, label management, forwarding rules |
| `gmail_mcp_server.py` | Generic MCP server | Adding Gmail tools for AI agents (send, search, mark read, etc.) |
| `tekup_gmail_mcp_server.py` | TekUp-specific wrapper | Integrating with TekUp organization config, RenOS backend |
| `src/integrations/gmail_economic_api_forwarder.py` | e-conomic API client | Adding e-conomic endpoints, receipt submission logic |
| `src/processors/google_photos_receipt_processor.py` | Photo receipt OCR | Changing image processing, Tesseract config, duplicate detection |
| `pyproject.toml` | Dependencies + CLI entrypoint | Adding Python packages, changing `tekup-gmail` CLI commands |
| `.env.example` | Environment template | New config vars (always update example when adding to code) |

## Docker Deployment

**Multi-container setup** with nginx reverse proxy:

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f tekup-gmail-automation

# Rebuild after code changes
docker-compose build --no-cache tekup-gmail-automation
```

**Container architecture:**
- `tekup-gmail-automation` - Main Python app (port 8000)
- `redis` - Celery task queue for async processing
- `postgres` - Metadata storage (processed emails, analytics)
- `nginx` - TLS termination, reverse proxy (port 80/443)

**Health check:** `http://localhost:8000/health` (30s interval)

## Integration Points

### e-conomic API
**Entry:** `src/integrations/gmail_economic_api_forwarder.py`

```python
# Forward PDF to e-conomic receipt inbox
forwarder = EconomicApiForwarder()
forwarder.forward_to_economic(
    pdf_path="path/to/receipt.pdf",
    metadata={"supplier": "...", "amount": "..."}
)
```

**Config:** `ECONOMIC_RECEIPT_EMAIL`, `ECONOMIC_APP_SECRET_TOKEN`, `ECONOMIC_AGREEMENT_GRANT_TOKEN`

### RenOS Backend/Frontend
**Status:** Integration ready, implementation in `tekup_config.json`:
```json
{
  "renos_integration": true,
  "organization": "TekUp",
  "economic_email": "788bilag1714566@e-conomic.dk"
}
```

### Google Photos Receipt Processing
**Entry:** `src/processors/google_photos_receipt_processor.py`

- **OCR Engine:** Tesseract (Danish language pack in Dockerfile)
- **Duplicate Detection:** SHA256 hash comparison
- **Supported Formats:** JPEG, PNG (converted to PIL Image for processing)

## Common Pitfalls

1. **Service Account Private Key Formatting**
   - Must include literal `\n` in env var: `-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----`
   - NOT actual newlines in `.env` file

2. **OAuth Token Stale**
   - Delete `token.json` or `token.pickle` to force re-authentication
   - Check `token_uri` in error messages - indicates OAuth flow needed

3. **Docker Volume Permissions**
   - Container runs as non-root `tekup` user
   - Ensure `logs/`, `data/`, `config/` are writable: `chmod -R 777` locally or mount as volumes

4. **MCP Server Not Responding**
   - Check if `gmail_service` is None - means authentication failed
   - All MCP tool responses MUST be `List[TextContent]`, not raw dicts

5. **Label Creation Race Condition**
   - `GmailPDFForwarder` auto-creates `PROCESSED_LABEL` if missing
   - Concurrent runs may fail - use `get_or_create_label()` pattern

## Code Quality Standards

**Enforced by CI/CD** (`.github/workflows/ci.yml`):
- **Formatter:** Black (88 char line length)
- **Import Sorter:** isort (compatible with Black)
- **Linter:** ruff (replaces flake8)
- **Type Checker:** mypy (strict mode enabled)

**Pre-commit hooks:**
```bash
pre-commit install
pre-commit run --all-files
```

## Monitoring & Debugging

**Structured Logging** (Loguru):
- Console: Colored, timestamp + module + function context
- File: `logs/tekup-gmail.log` (rotated at 10MB, 30-day retention, gzipped)

**Key log patterns:**
```python
logger.info(f"Processing {count} emails from last {days} days")
logger.error(f"Gmail API error: {e}", exc_info=True)
logger.debug(f"Email metadata: {json.dumps(metadata, indent=2)}")
```

**Health Check Endpoint:**
```bash
curl http://localhost:8000/health
# Returns: {"status": "healthy", "version": "1.2.0", "gmail_connected": true}
```

## Version History Context
- **v1.2.0 (2024-10-14):** Production-ready restructure, Docker support, comprehensive testing
- **v1.1.0 (2024-10-13):** Added e-conomic API, RenOS integration, Google Photos processing
- **v1.0.0 (2024-10-12):** Initial MCP server + basic PDF forwarding

**Current Test Status:** 17/17 passing (100% success rate)

---

**Quick Start:** Copy `.env.example` to `.env`, add Gmail credentials, run `python -m src.core.main start`. For MCP integration, use `python gmail_mcp_server.py` instead.

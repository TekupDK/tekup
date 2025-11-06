# Copilot MCP Configuration for Tekup AI v2

Dette workspace er konfigureret med **Model Context Protocol (MCP)** servere for at forbedre GitHub Copilot's funktionalitet.

## Installerede MCP Servere

### 1. **Playwright** - Browser Automation

Gør det muligt for Copilot at automatisere browser-interaktioner.

**Eksempel brug i Copilot Chat:**

```
@copilot åbn https://localhost:5000 og test login formularen
```

### 2. **PostgreSQL** - Database Access

Direkte adgang til din PostgreSQL database for queries og schema exploration.

**Eksempel brug:**

```
@copilot vis mig alle tabeller i databasen
@copilot kør en query der finder customers med mere end 5 cases
```

### 3. **Filesystem** - Sikre File Operations

Copilot kan læse og skrive filer sikkert inden for workspace scope.

**Eksempel brug:**

```
@copilot find alle TypeScript filer der bruger trpc
@copilot refaktorer alle komponenter i client/src/components
```

### 4. **Fetch** - Web Content Fetching

Hent og konverter web content til LLM-venligt format.

**Eksempel brug:**

```
@copilot hent dokumentation fra https://orm.drizzle.team/docs/overview
```

## Hvordan Bruger Du Det?

### Agent Mode

Tryk `Ctrl+Shift+P` (eller `Cmd+Shift+P` på Mac) og vælg:

```
GitHub Copilot: Open Agent Chat
```

I agent mode kan Copilot automatisk bruge MCP tools når det er nødvendigt.

### Chat Mode

I standard Copilot Chat kan du eksplicit bede om at bruge tools:

```
@copilot brug playwright til at teste min email form
```

## Workspace Context

Din `.copilot/context.json` indeholder:

- **Project information**: Stack, arkitektur, og key features
- **Development commands**: Alle pnpm scripts
- **Case data**: Training data fra customer cases
- **Coding guidelines**: TypeScript best practices og conventions

Copilot vil automatisk bruge denne kontekst når du arbejder i projektet.

## Environment Variables

MCP servere bruger din `.env.dev` fil. Sørg for at `DATABASE_URL` er sat korrekt:

```bash
# .env.dev
DATABASE_URL=postgresql://user:password@localhost:5432/tekup_dev
```

## Fejlfinding

### MCP Server virker ikke

1. Genstart VS Code
2. Åbn Output panel (`Ctrl+Shift+U`) og vælg "GitHub Copilot Chat"
3. Tjek for fejlbeskeder

### Database Connection Fejl

- Verificer at `DATABASE_URL` environment variable er sat
- Test connection: `pnpm db:push:dev`

### Playwright Timeout

- Første gang kan tage længere tid mens Playwright downloader browsers
- Check internet connection

## Tips & Tricks

### 1. Kombiner MCP Tools

```
@copilot hent customer data fra databasen og generer en rapport
```

### 2. Browser Testing Workflow

```
@copilot start dev server, åbn browser, og test email inbox funktionalitet
```

### 3. Database Schema Exploration

```
@copilot beskriv strukturen af emailThreads tabellen og vis relationer
```

### 4. Refactoring med Context

```
@copilot refaktorer CustomerProfile.tsx til at bruge den nye case analysis structure
```

## Yderligere MCP Servere

Ønsker du flere capabilities? Her er nogle relevante servere:

- **@modelcontextprotocol/server-slack** - Slack integration
- **@modelcontextprotocol/server-github** - GitHub API access
- **@modelcontextprotocol/server-puppeteer** - Alternative browser automation
- **@browserbase/mcp-server-browserbase** - Cloud browser automation

Tilføj dem til `.vscode/settings.json` under `github.copilot.chat.mcp.servers`.

## Support

For mere info om MCP:

- [VS Code MCP Documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)
- [GitHub Copilot Docs](https://docs.github.com/copilot)

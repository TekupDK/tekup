# ✅ MCP Konfiguration Opdateret!

## Vigtigt: Åbn Workspace Korrekt

MCP konfigurationen er nu i **`tekup-ai-v2.code-workspace`** filen.

### Sådan Aktiverer Du MCP:

1. **Luk VS Code helt** (alle vinduer)

2. **Åbn workspace filen:**
   - I Windows Explorer: Dobbeltklik på `tekup-ai-v2.code-workspace`
   - ELLER i VS Code: `File → Open Workspace from File` → vælg `tekup-ai-v2.code-workspace`

3. **Verificer at workspace er åbnet:**
   - Kig i venstre hjørne af VS Code - du skal se "TEKUP-AI-V2 (WORKSPACE)"
   - IKKE bare "tekup-ai-v2" (folder mode)

## Test MCP Nu

Efter at have åbnet workspace'et, åbn Copilot Chat og test:

```
@copilot hvilke MCP servere har jeg tilgængelige?
```

eller

```
@copilot brug filesystem mcp til at vise strukturen af server/ mappen
```

## MCP Servere Tilgængelige

- 🎭 **Playwright** - Browser automation og testing
- 🐘 **PostgreSQL** - Database queries (bruger DATABASE_URL fra .env.supabase)
- 📁 **Filesystem** - Smart file operations i workspace
- 🌐 **Fetch** - Hent eksterne resources

## Hvorfor Workspace Fil?

`.vscode/settings.json` gælder kun når du åbner mappen direkte.
`tekup-ai-v2.code-workspace` gælder for workspace mode og er den anbefalede måde.

**Status:** ✅ MCP er nu konfigureret i den rigtige fil!

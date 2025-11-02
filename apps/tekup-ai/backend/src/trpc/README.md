# tRPC Integration - Tekup Friday AI Backend

**Status:** ✅ Implementeret  
**Version:** 1.0.0  
**Dato:** November 2025

## Oversigt

Denne mappe indeholder tRPC integration for Tekup Friday AI backend, der giver type-sikker kommunikation mellem backend og FridayOS mobile applikation. Integrationen følger Tekup AI patterns og bruger eksisterende services (McpService, AiService) via dependency injection.

## Arkitektur

```
┌─────────────────────┐
│  FridayOS Mobile    │
│  (React Native)     │
└──────────┬──────────┘
           │ tRPC (HTTP)
           │ JWT Auth
           ▼
┌─────────────────────┐
│  Tekup AI Backend   │
│  /trpc endpoint     │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐  ┌─────────┐
│ Email   │  │ AI      │
│ Router  │  │ Router  │
└────┬────┘  └────┬────┘
     │            │
     ▼            ▼
┌─────────┐  ┌─────────┐
│ McpSvc  │  │ AiSvc   │
│ Gmail   │  │ Claude  │
└─────────┘  └─────────┘
```

## Struktur

```
src/trpc/
├── router.ts              # Hovedrouter (kombinerer alle sub-routers)
├── trpc.instance.ts        # tRPC instance med context og error handling
├── trpc.context.ts         # Request context med user, Prisma, services
├── trpc.service.ts         # NestJS service der eksporterer router
├── trpc.module.ts          # NestJS module
├── trpc-adapter.ts         # Express adapter (ikke aktivt brugt)
└── routers/
    ├── email.router.ts     # Email procedures (MCP → Gmail)
    └── ai.router.ts        # AI chat procedures (AiService wrapper)
```

## Email Router Procedures

### `email.list`

Liste emails fra Gmail via MCP server.

**Input:**
```typescript
{
  maxResults?: number;  // 1-500, default: 50
  labelIds?: string[];  // Gmail label IDs
  q?: string;           // Gmail search query
}
```

**Output:**
```typescript
{
  emails: Email[];
  resultSizeEstimate: number;
}
```

### `email.get`

Hent enkelt email by message ID.

**Input:**
```typescript
{
  messageId: string;
}
```

### `email.search`

Søg emails med Gmail search syntax.

**Input:**
```typescript
{
  query: string;        // Gmail search query
  maxResults?: number;  // 1-100, default: 20
}
```

### `email.send`

Send email via Gmail MCP server.

**Input:**
```typescript
{
  to: string;           // Email address
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
}
```

**Output:**
```typescript
{
  messageId: string;
  threadId: string;
  success: boolean;
}
```

### `email.getLabels`

Hent alle Gmail labels.

**Output:**
```typescript
{
  labels: Label[];
}
```

## AI Router Procedures

### `ai.chat`

Send besked til AI og få respons (non-streaming).

**Input:**
```typescript
{
  conversationId?: string;
  message: string;
  model?: string;
  temperature?: number;  // 0-2
  maxTokens?: number;
  systemPrompt?: string;
}
```

**Output:**
```typescript
{
  conversationId: string;
  messageId: string;
  content: string;
  model: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
}
```

### `ai.getModels`

Hent tilgængelige AI modeller.

**Output:**
```typescript
{
  models: Array<{
    id: string;
    name: string;
    provider: string;
  }>;
  default: string;
}
```

## Authentication

Alle tRPC procedures kræver JWT authentication. Tokenet skal være inkluderet i HTTP header:

```
Authorization: Bearer <jwt_token>
```

Authentication håndteres automatisk via Passport JWT strategy, der ekstraherer user info fra token og tilføjer det til request context.

## Context

Hver tRPC request har adgang til:

- `userId`: User ID fra JWT token
- `userEmail`: User email fra JWT token
- `prisma`: Prisma client for database operations
- `mcpService`: McpService instance for MCP operations
- `aiService`: AiService instance for AI operations
- `req`: Express request object

## Error Handling

tRPC bruger standard error codes:

- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Access denied
- `NOT_FOUND` (404): Resource not found
- `BAD_REQUEST` (400): Invalid input
- `INTERNAL_SERVER_ERROR` (500): Server error

Errors formateres med HTTP status codes for kompatibilitet med mobile clients.

## Integration med NestJS

tRPC er integreret i `main.ts` som Express middleware:

```typescript
app.use('/trpc', async (req, res, next) => {
  const context = await trpcService.createContext(req);
  const handler = fetchRequestHandler({
    endpoint: '/trpc',
    req,
    router: trpcService.appRouter,
    createContext: () => Promise.resolve(context),
  });
  return handler;
});
```

## Gmail MCP Server Configuration

Email router forventer at Gmail MCP server er konfigureret i:

- `aiMcpServerRegistry` table (server registry)
- `aiUserSettings.enabledMcpServers` (user's enabled servers)

Server findes ved at søge efter server med navn/displayName der indeholder "gmail".

## TypeScript Type Export

Router types eksporteres fra `router.ts`:

```typescript
export type AppRouter = typeof appRouter;
```

Dette type kan importeres i mobile app for fuld type-sikkerhed.

## Testing

For at teste tRPC endpoints:

1. Start backend: `pnpm dev`
2. tRPC er tilgængelig på: `http://localhost:3001/trpc`
3. Brug tRPC client fra mobile app eller tRPC Playground

## Vedligeholdelse

- Alle nye email operations skal tilføjes til `email.router.ts`
- Alle nye AI operations skal tilføjes til `ai.router.ts`
- Context kan udvides i `trpc.context.ts` hvis nye services er nødvendige
- Authentication patterns skal følge eksisterende Tekup AI patterns

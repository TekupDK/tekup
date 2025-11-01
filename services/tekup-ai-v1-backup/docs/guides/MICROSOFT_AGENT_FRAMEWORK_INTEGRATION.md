# Microsoft Agent Framework Integration

Denne dokumentation beskriver integrationen af Microsoft Agent Framework i Renos systemet.

## Oversigt

Microsoft Agent Framework integrationen giver Renos adgang til enterprise-grade agent orchestration, thread-based state management, telemetry og plugin systemer. Integrationen er designet til at være gradual og backward-compatible med det eksisterende Renos system.

## Arkitektur

### Core Komponenter

1. **ThreadManager** - Thread-based state management
2. **AgentOrchestrator** - Multi-agent orchestration
3. **TelemetryService** - Enterprise monitoring og observability
4. **PluginManager** - Type-safe plugin system
5. **HybridController** - Gradual migration controller

### Hybrid Approach

Systemet bruger en hybrid tilgang der giver mulighed for:

- **Legacy Mode**: Bruger eksisterende Renos system
- **Hybrid Mode**: Kombinerer Microsoft og Legacy systemer
- **Microsoft Mode**: Fuldt Microsoft Agent Framework

## Konfiguration

### Environment Variables

```bash
# Feature Flags
ENABLE_MICROSOFT_ORCHESTRATION=false
ENABLE_MICROSOFT_THREADS=false
ENABLE_MICROSOFT_TELEMETRY=false
ENABLE_MICROSOFT_PLUGINS=false
ENABLE_MICROSOFT_HYBRID=true

# Performance Settings
MICROSOFT_MAX_CONCURRENT_AGENTS=5
MICROSOFT_AGENT_TIMEOUT_MS=30000
MICROSOFT_RETRY_ATTEMPTS=2

# Telemetry Settings
MICROSOFT_TELEMETRY_ENABLED=true
MICROSOFT_TELEMETRY_RETENTION_DAYS=30
MICROSOFT_PERFORMANCE_TRACKING=true

# Thread Management
MICROSOFT_THREAD_RETENTION_DAYS=90
MICROSOFT_MAX_THREADS_PER_CUSTOMER=10

# Plugin System
MICROSOFT_PLUGIN_TIMEOUT_MS=30000
MICROSOFT_PLUGIN_RETRY_ATTEMPTS=2
MICROSOFT_ALLOW_CUSTOM_PLUGINS=true

# Debug Settings
MICROSOFT_DEBUG=false
MICROSOFT_VERBOSE_LOGGING=false
MICROSOFT_ENABLE_METRICS=true
```

### Konfiguration via API

```typescript
// Opdater hybrid controller konfiguration
PUT /api/microsoft/config
{
  "enableMicrosoftOrchestration": true,
  "enableThreadManagement": true,
  "enableTelemetry": true,
  "enablePluginSystem": false,
  "debugMode": false
}
```

## API Endpoints

### Status og Initialisering

- `GET /api/microsoft/status` - Get framework status
- `POST /api/microsoft/initialize` - Initialize framework
- `GET /api/microsoft/stats` - Get processing statistics

### Telemetry

- `GET /api/microsoft/telemetry` - Get telemetry metrics
- `GET /api/microsoft/telemetry/performance` - Get agent performance report
- `GET /api/microsoft/telemetry/business` - Get business intelligence report

### Plugin Management

- `GET /api/microsoft/plugins` - List all plugins
- `GET /api/microsoft/plugins/health` - Get plugin health status
- `POST /api/microsoft/plugins/register` - Register new plugin
- `PUT /api/microsoft/plugins/:name/config` - Update plugin configuration
- `DELETE /api/microsoft/plugins/:name` - Unregister plugin

### Thread Management

- `GET /api/microsoft/threads/:threadId` - Get thread information
- `GET /api/microsoft/threads/:threadId/summary` - Get thread conversation summary

## Brug

### Basic Usage

```typescript
import { getHybridController } from './agents/microsoft';

const hybridController = getHybridController();

// Process message with hybrid approach
const result = await hybridController.processMessage(
    message,
    context,
    lead,
    history
);
```

### Thread Management

```typescript
import { getThreadManager } from './agents/microsoft';

const threadManager = getThreadManager();

// Get or create thread
const thread = await threadManager.getOrCreateThread(
    customerId,
    leadId,
    conversationId
);

// Update thread state
await threadManager.updateThread(threadId, {
    businessContext: updatedContext,
    conversationState: updatedState,
});
```

### Telemetry

```typescript
import { getTelemetryService } from './agents/microsoft';

const telemetryService = getTelemetryService();

// Track agent execution
await telemetryService.trackAgentExecution(
    'intent-classifier',
    'classify-intent',
    true,
    1500
);

// Get metrics
const metrics = telemetryService.getMetrics();
```

### Plugin System

```typescript
import { getPluginManager, createMicrosoftPlugin } from './agents/microsoft';

const pluginManager = getPluginManager();

// Create plugin
const plugin = createMicrosoftPlugin(
    'custom-agent',
    '1.0.0',
    'Custom agent for specific tasks',
    'Renos Team',
    ['custom'],
    async (context) => {
        // Plugin logic
        return {
            success: true,
            output: { result: 'processed' },
            errors: [],
            warnings: [],
            executionTime: 1000,
        };
    }
);

// Register plugin
await pluginManager.registerPlugin(plugin);

// Execute plugin
const result = await pluginManager.executePlugin(
    'custom-agent',
    context
);
```

## Migration Strategy

### Fase 1: Foundation (Anbefalet start)

1. **Enable Thread Management**
   ```bash
   ENABLE_MICROSOFT_THREADS=true
   ```

2. **Enable Telemetry**
   ```bash
   ENABLE_MICROSOFT_TELEMETRY=true
   ```

3. **Test med Hybrid Mode**
   ```bash
   ENABLE_MICROSOFT_HYBRID=true
   ```

### Fase 2: Advanced Features

1. **Enable Orchestration for Complex Cases**
   ```bash
   ENABLE_MICROSOFT_ORCHESTRATION=true
   ```

2. **Enable Plugin System**
   ```bash
   ENABLE_MICROSOFT_PLUGINS=true
   ```

### Fase 3: Full Migration

1. **Disable Legacy Fallback**
   ```bash
   ENABLE_MICROSOFT_HYBRID=false
   ```

2. **Enable All Features**
   ```bash
   ENABLE_MICROSOFT_ORCHESTRATION=true
   ENABLE_MICROSOFT_THREADS=true
   ENABLE_MICROSOFT_TELEMETRY=true
   ENABLE_MICROSOFT_PLUGINS=true
   ```

## Monitoring og Debugging

### Logs

Microsoft Agent Framework bruger structured logging:

```typescript
logger.info({
    telemetry: {
        type: "agent_execution",
        agentType: "intent-classifier",
        success: true,
        executionTime: 1500,
    }
}, "Agent execution tracked");
```

### Metrics

Systemet samler automatisk metrics for:

- Agent performance
- Customer satisfaction
- Business KPIs
- Error tracking
- System health

### Debug Mode

Aktiver debug mode for detaljeret logging:

```bash
MICROSOFT_DEBUG=true
MICROSOFT_VERBOSE_LOGGING=true
```

## Fejlfinding

### Common Issues

1. **Initialization Failed**
   - Check environment variables
   - Verify dependencies
   - Check logs for specific errors

2. **Agent Execution Timeout**
   - Increase `MICROSOFT_AGENT_TIMEOUT_MS`
   - Check agent complexity
   - Review performance metrics

3. **Plugin Registration Failed**
   - Verify plugin format
   - Check dependencies
   - Review plugin validation

### Health Checks

```bash
# Check framework status
curl http://localhost:3000/api/microsoft/status

# Check plugin health
curl http://localhost:3000/api/microsoft/plugins/health

# Get processing stats
curl http://localhost:3000/api/microsoft/stats
```

## Performance Considerations

### Memory Usage

- Thread data persists in memory
- Consider `MICROSOFT_MAX_THREADS_PER_CUSTOMER` limit
- Monitor memory usage in production

### Execution Time

- Parallel agent execution can improve performance
- Consider `MICROSOFT_MAX_CONCURRENT_AGENTS` limit
- Monitor execution times via telemetry

### Database Impact

- Thread data can be persisted to database
- Consider retention policies
- Monitor database performance

## Security Considerations

### Plugin Security

- Validate plugin inputs
- Sandbox plugin execution
- Review plugin permissions

### Data Privacy

- Thread data may contain sensitive information
- Implement proper data retention
- Consider GDPR compliance

### API Security

- All endpoints require authentication
- Rate limiting applies
- Input validation enforced

## Roadmap

### Short Term (1-2 måneder)

- [ ] Complete thread persistence to database
- [ ] Add more built-in plugins
- [ ] Improve error handling and recovery
- [ ] Add performance optimizations

### Medium Term (3-6 måneder)

- [ ] Azure AI Foundry integration
- [ ] Advanced analytics dashboard
- [ ] Custom plugin marketplace
- [ ] Multi-tenant support

### Long Term (6+ måneder)

- [ ] Full Microsoft ecosystem integration
- [ ] Advanced AI capabilities
- [ ] Enterprise features
- [ ] Global scaling support

## Support

For support og spørgsmål:

1. Check logs for error details
2. Review configuration settings
3. Test with debug mode enabled
4. Contact development team

## Changelog

### v1.0.0 (Initial Release)

- Thread-based state management
- Multi-agent orchestration
- Enterprise telemetry
- Plugin system
- Hybrid controller
- API endpoints
- Configuration management

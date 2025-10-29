# Performance Monitoring for Tekup MCP Servers

This guide covers the comprehensive performance monitoring implementation across all 4 MCP servers in the Tekup ecosystem.

## Overview

All Tekup MCP servers now include built-in performance monitoring capabilities that provide real-time insights into server health, tool execution performance, and resource usage. This monitoring is designed to integrate seamlessly with the Tekup Cloud Dashboard analytics system.

## Architecture

### Performance Monitoring Infrastructure

The monitoring system consists of two main components:

1. **PerformanceMonitor** (for HTTP-based servers)
2. **StdioPerformanceMonitor** (for stdio-based servers)

Both provide consistent metrics across different server architectures while being optimized for their respective communication protocols.

### Monitored Servers

| Server | Type | Port | Monitoring Endpoints |
|--------|------|------|---------------------|
| autonomous-browser-tester | Stdio | N/A | Log-based |
| code-intelligence-mcp | HTTP | 8050 | `/health`, `/metrics`, `/metrics/summary` |
| database-mcp | HTTP | 8050 | `/health`, `/metrics`, `/metrics/summary` |
| knowledge-mcp | HTTP | 8050 | `/health`, `/metrics`, `/metrics/summary` |

## Metrics Collected

### Resource Usage

- **Memory Usage**: Heap used/total, percentage
- **CPU Usage**: Approximation based on process usage
- **Uptime**: Server uptime in human-readable format

### Request/Response Metrics (HTTP Servers)

- **Total Requests**: Count of all HTTP requests
- **Success/Failure**: Request success and failure counts
- **Response Time**: Average response time in milliseconds
- **Requests Per Minute**: Calculated throughput

### Tool Performance Metrics

- **Tools Executed**: Total tool executions
- **Tool Success Rate**: Percentage of successful executions
- **Execution Times**: Per-tool timing statistics (min, max, average)
- **Tool Performance**: Most/least efficient tools

### Health Status

- **Status Levels**: `healthy`, `degraded`, `unhealthy`
- **Status Factors**: Error rates, memory usage, performance thresholds

## HTTP Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "metrics": {
    "serverId": "code-intelligence-mcp",
    "serverVersion": "1.0.0",
    "uptime": 3600,
    "memoryUsage": {
      "used": 15728640,
      "total": 33554432,
      "percentage": 47
    },
    "toolsExecuted": 156,
    "toolsSucceeded": 145,
    "toolsFailed": 11,
    "averageResponseTime": 234
  }
}
```

### Detailed Metrics

```http
GET /metrics
```

Returns comprehensive performance metrics including:

- All timing data
- Tool-specific statistics
- Resource usage details
- Error information

### Dashboard Summary

```http
GET /metrics/summary
```

Returns dashboard-optimized summary with:

- Human-readable status
- Performance trends
- Top tools by usage
- Key performance indicators

## Integration with Dashboard

### Dashboard Endpoints

Configure your dashboard to poll these endpoints:

```typescript
// Example integration
const MCP_SERVERS = [
  {
    name: 'Code Intelligence',
    baseUrl: 'http://localhost:8050',
    healthPath: '/health',
    metricsPath: '/metrics/summary',
    id: 'code-intelligence-mcp'
  },
  {
    name: 'Database',
    baseUrl: 'http://localhost:8051', 
    healthPath: '/health',
    metricsPath: '/metrics/summary',
    id: 'database-mcp'
  },
  // etc...
];
```

### Real-time Data Flow

1. **Data Collection**: Each MCP server collects metrics in real-time
2. **HTTP Endpoints**: Servers expose metrics via REST endpoints
3. **Dashboard Polling**: Dashboard polls endpoints every 30 seconds
4. **Visualization**: Metrics displayed in real-time charts and tables
5. **Alerts**: Automated alerts based on threshold violations

## Configuration

### Environment Variables

Configure monitoring via environment variables:

```bash
# Base monitoring configuration
MONITORING_ENABLED=true
MONITORING_INTERVAL=30000  # 30 seconds
MONITORING_LOG_LEVEL=info

# Per-server configuration
CODE_INTELLIGENCE_PORT=8050
DATABASE_PORT=8051
KNOWLEDGE_PORT=8052

# Alert thresholds
CPU_THRESHOLD_WARNING=70
CPU_THRESHOLD_CRITICAL=90
MEMORY_THRESHOLD_WARNING=75
MEMORY_THRESHOLD_CRITICAL=90
ERROR_RATE_THRESHOLD_WARNING=20
ERROR_RATE_THRESHOLD_CRITICAL=50
```

### Per-Server Configuration

Each server can be configured independently:

**code-intelligence-mcp:**
```typescript
const performanceMonitor = new PerformanceMonitor(
  'code-intelligence-mcp',
  '1.0.0',
  Number.parseInt(process.env.PORT || "8050", 10)
);
```

**autonomous-browser-tester:**
```typescript
const performanceMonitor = new StdioPerformanceMonitor(
  'autonomous-browser-tester',
  '1.0.0'
);
```

## Monitoring Features

### Automatic Health Assessment

The system automatically determines server health based on:

- Error rates (tools and HTTP requests)
- Memory usage thresholds
- Performance degradation indicators
- Resource constraints

### Tool-Specific Monitoring

Each tool execution is monitored individually:

- Execution time tracking
- Success/failure rates
- Performance trends
- Error categorization

### Real-time Alerts

Built-in alerting for:

- High error rates (>20% warning, >50% critical)
- Memory usage spikes (>75% warning, >90% critical)
- Slow tool performance (tools taking >10 seconds average)
- Server unavailability

## Dashboard Integration Examples

### React Component for Server Status

```tsx
import React, { useEffect, useState } from 'react';

interface ServerStatus {
  serverId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: string;
  memoryUsage: string;
  averageResponseTime: number;
  toolSuccessRate: number;
}

const MCP_SERVERS = [
  { name: 'Code Intelligence', url: 'http://localhost:8050' },
  { name: 'Database', url: 'http://localhost:8051' },
  { name: 'Knowledge', url: 'http://localhost:8052' }
];

function ServerDashboard() {
  const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>([]);

  useEffect(() => {
    const fetchStatuses = async () => {
      const promises = MCP_SERVERS.map(async (server) => {
        try {
          const response = await fetch(`${server.url}/metrics/summary`);
          const data = await response.json();
          return { ...data, name: server.name };
        } catch (error) {
          return {
            serverId: server.name,
            status: 'unhealthy',
            uptime: '0s',
            memoryUsage: 'N/A',
            averageResponseTime: 0,
            toolSuccessRate: 0
          };
        }
      });

      const statuses = await Promise.all(promises);
      setServerStatuses(statuses);
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="server-dashboard">
      <h2>MCP Server Status</h2>
      {serverStatuses.map((server) => (
        <div key={server.serverId} className={`server-card ${server.status}`}>
          <h3>{server.serverId}</h3>
          <p>Status: {server.status}</p>
          <p>Uptime: {server.uptime}</p>
          <p>Memory: {server.memoryUsage}</p>
          <p>Avg Response: {server.averageResponseTime}ms</p>
          <p>Tool Success Rate: {server.toolSuccessRate}%</p>
        </div>
      ))}
    </div>
  );
}
```

## Best Practices

### 1. Monitoring Intervals

- **Health Checks**: Every 30 seconds
- **Detailed Metrics**: Every 5 minutes
- **Performance Analysis**: Every 15 minutes

### 2. Alert Thresholds

- **Memory Usage Warning**: 75%
- **Memory Usage Critical**: 90%
- **Error Rate Warning**: 20%
- **Error Rate Critical**: 50%
- **Response Time Warning**: 5 seconds
- **Response Time Critical**: 10 seconds

### 3. Performance Optimization

- Monitor tool execution times to identify performance bottlenecks
- Track memory usage trends to prevent memory leaks
- Use response time data to optimize server configurations

### 4. Error Handling

- All monitoring operations include error handling
- Failed monitoring calls don't affect core server functionality
- Graceful degradation when monitoring is unavailable

## Troubleshooting

### Common Issues

**High Memory Usage**
```bash
# Check current memory usage
curl http://localhost:8050/metrics | jq '.memoryUsage'

# Monitor memory trends
watch 'curl -s http://localhost:8050/metrics | jq ".memoryUsage.percentage"'
```

**High Error Rates**
```bash
# Check tool execution success rates
curl http://localhost:8050/metrics | jq '.toolsSucceeded, .toolsFailed'

# Identify failing tools
curl http://localhost:8050/metrics | jq '.toolExecutionTimes | to_entries[] | select(.value.averageTime > 10000)'
```

**Slow Response Times**
```bash
# Check average response times
curl http://localhost:8050/metrics | jq '.averageResponseTime'

# Identify slow endpoints
curl http://localhost:8050/metrics | jq '.toolExecutionTimes | to_entries[] | select(.value.averageTime > 5000)'
```

### Debug Mode

Enable detailed logging:
```bash
MONITORING_LOG_LEVEL=debug
```

## Security Considerations

1. **Internal Network**: Monitoring endpoints are designed for internal use
2. **Authentication**: Consider adding authentication for production deployments
3. **Rate Limiting**: Implement rate limiting to prevent monitoring abuse
4. **Data Privacy**: Monitored data doesn't include sensitive content, only performance metrics

## Future Enhancements

Planned improvements:

1. **Distributed Tracing**: Track requests across multiple services
2. **Advanced Analytics**: Machine learning for anomaly detection
3. **Custom Metrics**: Allow servers to register custom business metrics
4. **Integration APIs**: Webhook support for external monitoring systems
5. **Historical Data**: Long-term storage and trend analysis

## Support

For issues with performance monitoring:

1. Check server logs for monitoring-related errors
2. Verify monitoring endpoints are accessible
3. Ensure monitoring dependencies are properly installed
4. Review threshold configurations for your environment

---

_This monitoring system is designed to provide comprehensive visibility into MCP server performance while maintaining minimal overhead and maximum reliability._

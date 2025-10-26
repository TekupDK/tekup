# Microsoft Agent Framework Operation Guide

## 🎯 **OVERBLIK**

Microsoft Agent Framework er fuldt integreret i RenOS og giver enterprise-grade agent orchestration, thread-based state management, telemetry og plugin systemer.

## 🏗️ **ARKITEKTUR**

### **Core Komponenter:**
- **ThreadManager**: Thread-based state management
- **AgentOrchestrator**: Multi-agent orchestration  
- **TelemetryService**: Enterprise monitoring og observability
- **PluginManager**: Type-safe plugin system
- **HybridController**: Gradual migration controller

### **Integration Points:**
- **Chat Controller**: Hybrid processing med fallback
- **API Routes**: `/api/microsoft/*` endpoints
- **Configuration**: Environment variables og runtime config

## 🔧 **OPERATIONELLE PROCEDURES**

### **1. System Status Check**

```bash
# Check overall status
curl https://tekup-renos.onrender.com/api/microsoft/status

# Check telemetry
curl https://tekup-renos.onrender.com/api/microsoft/telemetry

# Check processing stats
curl https://tekup-renos.onrender.com/api/microsoft/stats
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "initialized": true,
    "components": {
      "threadManager": true,
      "orchestrator": true,
      "telemetry": true,
      "pluginManager": true,
      "hybridController": true
    },
    "configuration": {
      "enableOrchestration": true,
      "enableThreadManagement": true,
      "enableTelemetry": true,
      "enablePluginSystem": false,
      "debugMode": true
    }
  }
}
```

### **2. Configuration Management**

```bash
# Update configuration
curl -X PUT https://tekup-renos.onrender.com/api/microsoft/config \
  -H "Content-Type: application/json" \
  -d '{
    "enableMicrosoftOrchestration": true,
    "enableThreadManagement": true,
    "enableTelemetry": true,
    "enablePluginSystem": false,
    "debugMode": false
  }'
```

### **3. Thread Management**

```bash
# Get thread information
curl https://tekup-renos.onrender.com/api/microsoft/threads/{threadId}

# Get thread summary
curl https://tekup-renos.onrender.com/api/microsoft/threads/{threadId}/summary
```

### **4. Telemetry Monitoring**

```bash
# Get performance report
curl https://tekup-renos.onrender.com/api/microsoft/telemetry/performance

# Get business intelligence
curl https://tekup-renos.onrender.com/api/microsoft/telemetry/business
```

### **5. Plugin Management**

```bash
# List plugins
curl https://tekup-renos.onrender.com/api/microsoft/plugins

# Check plugin health
curl https://tekup-renos.onrender.com/api/microsoft/plugins/health
```

## 🚀 **DEPLOYMENT PROCEDURES**

### **Environment Variables**

```bash
# Core Microsoft Features
ENABLE_MICROSOFT_ORCHESTRATION=true
ENABLE_MICROSOFT_THREADS=true
ENABLE_MICROSOFT_TELEMETRY=true
ENABLE_MICROSOFT_PLUGINS=false
ENABLE_MICROSOFT_HYBRID=true

# Performance Settings
MICROSOFT_MAX_CONCURRENT_AGENTS=5
MICROSOFT_AGENT_TIMEOUT_MS=30000
MICROSOFT_RETRY_ATTEMPTS=2

# Debug Settings
MICROSOFT_DEBUG=false
MICROSOFT_VERBOSE_LOGGING=false
```

### **Deployment Steps**

1. **Code Deployment**
   ```bash
   git push origin main
   # Render auto-deploys
   ```

2. **Configuration Update**
   ```bash
   # Via API (runtime)
   curl -X PUT /api/microsoft/config
   
   # Via Environment (restart required)
   # Update in Render Dashboard
   ```

3. **Verification**
   ```bash
   # Health check
   curl https://tekup-renos.onrender.com/health
   
   # Microsoft status
   curl https://tekup-renos.onrender.com/api/microsoft/status
   ```

## 📊 **MONITORING OG OBSERVABILITY**

### **Key Metrics**

| Metric | Description | Threshold |
|--------|-------------|-----------|
| **Uptime** | System availability | > 99.9% |
| **Response Time** | API response time | < 200ms |
| **Memory Usage** | System memory | < 80% |
| **CPU Usage** | System CPU | < 70% |
| **Active Threads** | Concurrent threads | < 100 |
| **Database Connections** | DB pool usage | < 80% |

### **Alerting Rules**

```yaml
# System Health
- Alert: HighMemoryUsage
  Condition: memoryUsage > 80
  Action: Scale up instance

- Alert: HighCPUUsage  
  Condition: cpuUsage > 70
  Action: Check for performance issues

- Alert: HighErrorRate
  Condition: errorRate > 5%
  Action: Investigate errors

# Business Metrics
- Alert: LowConversionRate
  Condition: conversionRate < 10%
  Action: Review lead quality

- Alert: HighLeadVolume
  Condition: dailyLeads > 100
  Action: Scale processing capacity
```

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

#### **1. Microsoft Framework Not Initialized**
```bash
# Symptoms: 502 errors on /api/microsoft/*
# Solution: Check logs for initialization errors
curl https://tekup-renos.onrender.com/api/microsoft/status
```

#### **2. Thread Management Issues**
```bash
# Symptoms: "Thread not found" errors
# Solution: Verify thread creation and persistence
curl https://tekup-renos.onrender.com/api/microsoft/threads/{threadId}
```

#### **3. Telemetry Data Missing**
```bash
# Symptoms: Empty metrics in telemetry endpoints
# Solution: Check telemetry service initialization
curl https://tekup-renos.onrender.com/api/microsoft/telemetry
```

#### **4. Plugin Registration Failed**
```bash
# Symptoms: "Invalid plugin format" errors
# Solution: Check plugin structure and dependencies
curl https://tekup-renos.onrender.com/api/microsoft/plugins/health
```

### **Debug Commands**

```bash
# Enable debug mode
curl -X PUT https://tekup-renos.onrender.com/api/microsoft/config \
  -H "Content-Type: application/json" \
  -d '{"debugMode": true}'

# Check detailed status
curl https://tekup-renos.onrender.com/api/microsoft/status

# View logs (Render Dashboard)
# Go to Logs tab for detailed error information
```

## 🔒 **SECURITY CONSIDERATIONS**

### **API Security**
- All endpoints require authentication
- Rate limiting applied
- Input validation enforced
- CORS properly configured

### **Data Privacy**
- Thread data may contain sensitive information
- Implement proper data retention policies
- Consider GDPR compliance
- Audit logging enabled

### **Plugin Security**
- Validate plugin inputs
- Sandbox plugin execution
- Review plugin permissions
- Monitor plugin behavior

## 📈 **PERFORMANCE OPTIMIZATION**

### **Memory Management**
- Thread data persists in memory
- Consider `MICROSOFT_MAX_THREADS_PER_CUSTOMER` limit
- Monitor memory usage in production
- Implement cleanup policies

### **Execution Time**
- Parallel agent execution improves performance
- Consider `MICROSOFT_MAX_CONCURRENT_AGENTS` limit
- Monitor execution times via telemetry
- Optimize agent logic

### **Database Impact**
- Thread data can be persisted to database
- Consider retention policies
- Monitor database performance
- Use connection pooling

## 🚀 **BEST PRACTICES**

### **1. Gradual Migration**
- Start with `ENABLE_MICROSOFT_HYBRID=true`
- Enable features one by one
- Monitor performance impact
- Keep fallback mechanisms active

### **2. Configuration Management**
- Use environment variables for settings
- Document all configuration options
- Test changes in staging first
- Version control configuration

### **3. Monitoring**
- Set up comprehensive monitoring
- Create alerting rules
- Regular health checks
- Performance trend analysis

### **4. Plugin Development**
- Follow plugin interface standards
- Implement proper error handling
- Add comprehensive logging
- Test thoroughly before deployment

### **5. Thread Management**
- Use meaningful thread IDs
- Implement proper cleanup
- Monitor thread lifecycle
- Handle edge cases gracefully

## 📋 **MAINTENANCE CHECKLIST**

### **Daily**
- [ ] Check system health metrics
- [ ] Review error logs
- [ ] Monitor performance trends
- [ ] Verify API endpoints

### **Weekly**
- [ ] Review telemetry data
- [ ] Check plugin health
- [ ] Analyze business metrics
- [ ] Update documentation

### **Monthly**
- [ ] Performance optimization review
- [ ] Security audit
- [ ] Capacity planning
- [ ] Feature usage analysis

## 🎯 **SUCCESS METRICS**

### **Technical Metrics**
- **Uptime**: > 99.9%
- **Response Time**: < 200ms
- **Error Rate**: < 1%
- **Memory Usage**: < 80%

### **Business Metrics**
- **Lead Processing**: Automated
- **Customer Satisfaction**: High
- **Conversion Rate**: Improved
- **Revenue**: Increased

### **Operational Metrics**
- **Deployment Success**: 100%
- **Configuration Changes**: Smooth
- **Incident Response**: < 1 hour
- **Documentation**: Up to date

---

**Last Updated**: October 5, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
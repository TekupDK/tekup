# TekUp MCP Docker Port Mapping

## 🔍 **Port Konflikt Løsning**

Docker Network isolering løser automatisk port konflikter! Her er hvordan:

## 📊 **Port Mapping Oversigt**

### **MCP Services (13000-13999 range)**
| Service | Internal Port | External Port | URL |
|---------|--------------|---------------|-----|
| **MCP Gateway** | 3000 | **13000** | http://localhost:13000 |
| **Browser MCP** | 3001 | **13001** | http://localhost:13001 |
| **Filesystem MCP** | 3002 | **13002** | http://localhost:13002 |
| **Search MCP** | 3003 | **13003** | http://localhost:13003 |

### **Debug Ports (19200-19999 range)**
| Service | Internal Debug | External Debug | Connection |
|---------|---------------|----------------|------------|
| **MCP Gateway** | 9229 | **19229** | chrome://inspect → localhost:19229 |
| **Browser MCP** | 9229 | **19230** | chrome://inspect → localhost:19230 |
| **Filesystem MCP** | 9229 | **19231** | chrome://inspect → localhost:19231 |
| **Search MCP** | 9229 | **19232** | chrome://inspect → localhost:19232 |

### **Monitoring Stack**
| Service | Internal Port | External Port | URL | Credentials |
|---------|--------------|---------------|-----|-------------|
| **Prometheus** | 9090 | **19090** | http://localhost:19090 | None |
| **Grafana** | 3000 | **13100** | http://localhost:13100 | admin/admin123 |
| **Jaeger** | 16686 | **16686** | http://localhost:16686 | None |
| **Redis** | 6379 | **16379** | redis://localhost:16379 | Pass: devpassword123 |
| **Nginx Proxy** | 80 | **18080** | http://localhost:18080 | None |
| **Elasticsearch** | 9200 | **19200** | http://localhost:19200 | None |
| **Kibana** | 5601 | **15601** | http://localhost:15601 | None |

## 🏗️ **Docker Network Isolering**

### **Intern Communication (Container-to-Container)**
```yaml
# Containers taler sammen via Docker network uden port konflikter
services:
  mcp-gateway:
    environment:
      MCP_SERVICES_BROWSER_URL: http://mcp-browser:3001      # Internal
      MCP_SERVICES_FILESYSTEM_URL: http://mcp-filesystem:3002 # Internal
      MCP_SERVICES_SEARCH_URL: http://mcp-search:3003        # Internal
```

### **Ekstern Access (Host-to-Container)**
```bash
# Fra host system - bruger mapped ports
curl http://localhost:13000/health        # Gateway
curl http://localhost:13001/health        # Browser MCP
curl http://localhost:13002/health        # Filesystem MCP
curl http://localhost:13003/health        # Search MCP
```

## 🚀 **Fordele ved Docker Port Mapping**

### ✅ **Automatisk Konflikt Løsning**
- **Før**: Port 3000 konflikte med Jarvis (3000), RestaurantIQ (3000), osv.
- **Efter**: Alle TekUp apps kan køre samtidigt uden konflikter

### ✅ **Service Isolering** 
- **Før**: Alle services konkurrerede om samme ports
- **Efter**: Hver service har sit eget port-range

### ✅ **Parallel Development**
```bash
# Alle kan køre samtidigt nu:
npm run dev                    # Main TekUp apps (3000-3999)
npm run docker:mcp:dev         # MCP services (13000-13999) 
python jarvis_lite.py          # JarvisLite (separate ports)
```

### ✅ **Environment Consistency**
```bash
# Development
MCP_GATEWAY_URL=http://localhost:13000

# Production  
MCP_GATEWAY_URL=https://mcp-gateway.tekup.org

# Docker Internal (same across environments)
MCP_SERVICES_BROWSER_URL=http://mcp-browser:3001
```

## 🔧 **Configuration Updates Required**

### **Environment Variables**
```bash
# Old conflicts
TEKUP_API_URL=http://localhost:3000      # Conflicted with multiple apps
MCP_GATEWAY_URL=http://localhost:3000    # Same conflict

# New isolated
TEKUP_API_URL=http://localhost:3000      # Main apps unchanged
MCP_GATEWAY_URL=http://localhost:13000   # MCP on separate range
```

### **Editor MCP Configurations**
```json
// .vscode/settings.json
{
  "mcp.servers": {
    "tekup-gateway": {
      "url": "http://localhost:13000",
      "transport": "http"
    }
  }
}

// .cursor/mcp.json
{
  "mcpServers": {
    "tekup-unified": {
      "command": "curl",
      "args": ["http://localhost:13000/mcp/browser"]
    }
  }
}
```

## 🧪 **Testing Port Isolation**

### **Verify No Conflicts**
```bash
# Test all services running simultaneously
npm run dev &                 # Main TekUp (ports 3000-3999)
npm run docker:mcp:dev &       # MCP services (ports 13000-13999)
python C:/Users/empir/JarvisLite/main.py &  # JarvisLite

# Check all services are accessible
curl http://localhost:3000/health       # Main TekUp
curl http://localhost:13000/health      # MCP Gateway
curl http://localhost:13001/health      # Browser MCP
curl http://localhost:13002/health      # Filesystem MCP  
curl http://localhost:13003/health      # Search MCP
```

### **Debug Multiple Services**
```bash
# Open Chrome DevTools for debugging
chrome://inspect

# Available debug targets:
# - localhost:19229 (MCP Gateway)
# - localhost:19230 (Browser MCP)  
# - localhost:19231 (Filesystem MCP)
# - localhost:19232 (Search MCP)
```

## 🎯 **Quick Start Commands**

### **Start MCP Services (No Conflicts)**
```bash
# Start MCP services on isolated ports
npm run docker:mcp:dev

# Verify services
curl http://localhost:13000/api/services

# Access monitoring
open http://localhost:13100      # Grafana
open http://localhost:19090      # Prometheus
open http://localhost:16686      # Jaeger
```

### **Development Workflow**
```bash
# Terminal 1: Main TekUp development
npm run dev

# Terminal 2: MCP services  
npm run docker:mcp:dev

# Terminal 3: Monitoring
npm run docker:mcp:dev:logs

# Terminal 4: JarvisLite (if needed)
python C:/Users/empir/JarvisLite/main.py
```

## 📈 **Performance Benefits**

### **Resource Distribution**
- **Main Apps**: Ports 3000-3999 (existing)
- **MCP Services**: Ports 13000-13999 (new isolated range)
- **Debug Ports**: Ports 19000-19999 (development only)
- **Monitoring**: Ports 15000-19999 (shared utilities)

### **Conflict-Free Development**
```bash
# All these can run simultaneously now:
✅ TekUp CRM API (3000)
✅ TekUp Flow API (3001)  
✅ TekUp Lead Platform (3002)
✅ Jarvis Frontend (3000)
✅ MCP Gateway (13000)         # No conflicts!
✅ MCP Browser Service (13001)  # Isolated!
✅ MCP Filesystem (13002)       # Safe!
✅ MCP Search (13003)          # Clean!
```

## 🔐 **Security Implications**

### **Network Isolation**
- **Docker Internal**: Services communicate via `tekup-mcp-network`
- **Host Access**: Only mapped ports exposed to host system
- **Production**: External ports can be completely blocked

### **Port-based Security**
```bash
# Firewall rules can target specific ranges
# Development: Allow 13000-13999 for MCP
# Production: Block all external access, use reverse proxy
```

Dette løser alle port konflikter elegant! 🚀

# TekUp Port Management System

## 📊 **Overview**

The TekUp Port Management System provides centralized, automated port allocation and management across all services in the Tekup ecosystem. This system ensures conflict-free port assignments, supports multiple environments, and scales with your growing service architecture.

## 🎯 **Key Features**

### ✅ **Automated Port Allocation**
- **Intelligent Assignment**: Automatically finds available ports within defined ranges
- **Conflict Detection**: Prevents port collisions before they happen
- **Environment Isolation**: Separate port ranges for dev, staging, production, and testing

### ✅ **Centralized Registry**
- **Single Source of Truth**: All port assignments in one YAML configuration
- **Version Control**: Track port changes with Git history
- **Service Discovery**: Map services to ports with health endpoints

### ✅ **Developer Tools**
- **CLI Management**: PowerShell-based tool for all port operations
- **Health Monitoring**: Automated health checks for all services
- **Docker Integration**: Generate Docker Compose files from registry

### ✅ **CI/CD Integration**
- **Automated Validation**: GitHub Actions workflows validate port configurations
- **Security Scanning**: Detect dangerous port assignments
- **PR Comments**: Automatic validation results in pull requests

## 🏗️ **Architecture**

### **Port Range Strategy**
```yaml
# Environment-based port offsets
development: base_port + 0      # 8000-8999
staging:     base_port + 10000  # 18000-18999  
production:  base_port + 20000  # 28000-28999
testing:     base_port + 30000  # 38000-38999
```

### **Category-based Allocation**
| Category | Range | Description | Examples |
|----------|-------|-------------|----------|
| **Frontend Apps** | 3000-3999 | React, Vue, Angular apps | CRM Web (3005), Website (3080) |
| **Backend APIs** | 8000-8999 | NestJS, Express, FastAPI | Unified Platform (8000), Flow API (8001) |
| **Databases** | 5432-5499 | PostgreSQL instances | Dev (5432), Staging (5433) |
| **Monitoring** | 9000-9999 | Observability tools | Prometheus (9090), Grafana (9091) |
| **Dev Tools** | 4000-4999 | Development utilities | pgAdmin (4080), Redis Commander (4081) |
| **MCP Services** | 13000-13999 | Model Context Protocol | Gateway (13000), Browser (13001) |

## 🚀 **Getting Started**

### **1. Initialize Port Manager**
```powershell
# Setup directories and validate configuration
./scripts/tekup-port.ps1 init
```

### **2. View Current Port Allocations**
```powershell
# List all services and their ports
./scripts/tekup-port.ps1 list

# View status for specific environment
./scripts/tekup-port.ps1 list -Environment staging
```

### **3. Check Port Availability**
```powershell
# Check if specific port is available
./scripts/tekup-port.ps1 check -Port 8005

# Scan for conflicts across all services
./scripts/tekup-port.ps1 conflicts
```

### **4. Health Monitoring**
```powershell
# Check health of all services
./scripts/tekup-port.ps1 health

# Check specific service
./scripts/tekup-port.ps1 health -Service tekup-unified-platform
```

### **5. Allocate New Service Port**
```powershell
# Auto-assign port in category
./scripts/tekup-port.ps1 allocate -Service my-new-api -Category backend_apis

# Assign specific port
./scripts/tekup-port.ps1 allocate -Service my-service -Category frontend_apps -Port 3090
```

## 📁 **File Structure**

```
tekup-org/
├── config/ports/
│   └── registry.yaml                 # Central port registry
├── scripts/
│   └── tekup-port.ps1               # CLI management tool
├── .github/workflows/
│   └── port-validation.yml          # Automated validation
├── logs/
│   └── port-manager.log             # Operation logs
└── docs/
    └── PORT_MANAGEMENT.md           # This documentation
```

## ⚙️ **Configuration**

### **Registry Schema**
The `config/ports/registry.yaml` file contains:

```yaml
metadata:
  version: "1.0.0"
  last_updated: "2025-01-13"
  environments: ["development", "staging", "production", "testing"]

port_ranges:
  frontend_apps:
    range: "3000-3999"
    description: "Frontend applications"
    offset_per_env:
      development: 0
      staging: 10000
      # ...

services:
  tekup-unified-platform:
    category: "backend_apis"
    base_port: 8000
    protocol: "http"
    health_endpoint: "/health"
    dependencies: ["postgres", "redis"]
    environments:
      development: 8000
      staging: 18000
      production: 28000
      testing: 38000
```

### **Service Configuration Fields**
| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `category` | ✅ | Service category for port range | `"backend_apis"` |
| `base_port` | ✅ | Base port number | `8000` |
| `protocol` | ✅ | Network protocol | `"http"`, `"tcp"` |
| `health_endpoint` | ❌ | Health check URL path | `"/health"` |
| `dependencies` | ❌ | Required services | `["postgres", "redis"]` |
| `environments` | ✅ | Port per environment | `{ development: 8000 }` |
| `description` | ❌ | Service description | `"Main API service"` |

## 🛠️ **CLI Commands Reference**

### **Basic Operations**
```powershell
# Initialize system
./scripts/tekup-port.ps1 init

# Show system status
./scripts/tekup-port.ps1 status

# List all services
./scripts/tekup-port.ps1 list [-Environment dev|staging|prod|test]
```

### **Port Management**
```powershell
# Check port availability
./scripts/tekup-port.ps1 check -Port 8080

# Find port conflicts
./scripts/tekup-port.ps1 conflicts [-Environment development]

# Allocate new port
./scripts/tekup-port.ps1 allocate -Service "my-service" -Category "backend_apis" [-Port 8005] [-Force]
```

### **Health & Monitoring**
```powershell
# Health check all services
./scripts/tekup-port.ps1 health

# Health check specific service
./scripts/tekup-port.ps1 health -Service "tekup-unified-platform"
```

### **Docker Integration**
```powershell
# Generate Docker Compose file
./scripts/tekup-port.ps1 generate

# This creates: docker-compose.generated.yml
```

### **Command Options**
| Option | Description | Example |
|--------|-------------|---------|
| `-Environment` | Target environment | `-Environment staging` |
| `-Service` | Service name | `-Service tekup-crm-web` |
| `-Category` | Port category | `-Category backend_apis` |
| `-Port` | Specific port number | `-Port 8080` |
| `-Force` | Override conflicts | `-Force` |
| `-Verbose` | Detailed logging | `-Verbose` |

## 🔒 **Security Features**

### **Automated Security Scanning**
The system includes security validation to prevent:
- **Dangerous Ports**: SSH (22), Telnet (23), RDP (3389)
- **Production HTTP**: HTTP ports in production without HTTPS
- **Database Exposure**: Database ports exposed in production
- **Reserved Ports**: System and well-known service ports

### **Validation Rules**
```yaml
allocation_rules:
  validation:
    check_conflicts: true
    check_system_ports: true
    require_health_endpoint: true
    require_category: true
```

### **Security Scan Results**
```powershell
# Manual security scan
python .github/workflows/security_scan.py

# Example output:
# ✅ No security issues found in port configuration
# ⚠️ Service my-service using HTTP port 8080 in production
# ❌ Service dangerous-service using dangerous port 22 in development
```

## 📈 **Monitoring & Logging**

### **Log Files**
- **Location**: `logs/port-manager.log`
- **Format**: `[TIMESTAMP] [LEVEL] MESSAGE`
- **Rotation**: Manual (consider implementing logrotate)

### **Health Checks**
All services with `health_endpoint` defined get automatic health monitoring:

```yaml
# Service configuration
tekup-unified-platform:
  health_endpoint: "/health"
  environments:
    development: 8000

# Health check URL: http://localhost:8000/health
```

### **Monitoring Integration**
- **Prometheus**: Port 9090 - Metrics collection
- **Grafana**: Port 9091 - Visualization dashboards  
- **GitHub Actions**: Automated validation and reporting

## 🧪 **Testing Strategy**

### **Automated Tests**
1. **Port Registry Validation**: YAML syntax and schema validation
2. **Conflict Detection**: Port collision scanning
3. **Range Validation**: Ensure ports fall within defined ranges
4. **Security Scanning**: Dangerous port detection
5. **Health Check Testing**: Service endpoint validation

### **Manual Testing**
```powershell
# Test port allocation workflow
./scripts/tekup-port.ps1 allocate -Service "test-service" -Category "backend_apis"
./scripts/tekup-port.ps1 check -Port [allocated_port]
./scripts/tekup-port.ps1 health -Service "test-service"
```

## 🔄 **Migration Guide**

### **Migrating Existing Services**

#### **Step 1: Inventory Current Ports**
```powershell
# Scan current Docker Compose files
grep -r "ports:" docker-compose*.yml

# Check package.json files
find . -name "package.json" -exec grep -l "port\|PORT" {} \;
```

#### **Step 2: Update Registry**
Add each service to `config/ports/registry.yaml`:

```yaml
services:
  existing-service:
    category: "backend_apis"
    base_port: 8080  # Current port
    protocol: "http"
    health_endpoint: "/health"
    environments:
      development: 8080
      staging: 18080   # New staging port
      production: 28080 # New production port
```

#### **Step 3: Update Docker Compose**
Replace hardcoded ports with registry-generated values:

```yaml
# Before
services:
  my-service:
    ports:
      - "8080:8080"

# After (using generated compose file)
services:
  my-service:
    ports:
      - "8080:8080"  # Development
      - "18080:8080" # Staging
```

#### **Step 4: Validate Changes**
```powershell
./scripts/tekup-port.ps1 conflicts
./scripts/tekup-port.ps1 health
```

## 🚀 **Future Expansion**

### **Planned Enhancements**
1. **Web Dashboard**: Browser-based port management UI
2. **API Endpoints**: REST API for programmatic access
3. **Service Discovery**: Integration with Consul/etcd
4. **Load Balancer Integration**: Automatic upstream configuration
5. **Kubernetes Support**: Port management for K8s services

### **Scalability Planning**
```yaml
expansion:
  reserved_ranges:
    ai_services: "7000-7999"      # AI/ML microservices
    external_apis: "6000-6999"   # External API gateways  
    worker_services: "5000-5999" # Background workers
    websocket_services: "4500-4599" # WebSocket connections
  
  capacity_planning:
    max_services_per_category: 100
    growth_projection: "50% per year"
    emergency_buffer: "10% of total range"
```

### **Integration Roadmap**
- **VS Code Extension**: IDE-integrated port management
- **Terraform Provider**: Infrastructure as Code integration
- **Helm Charts**: Kubernetes deployment automation
- **Service Mesh**: Istio/Linkerd port coordination

## 📞 **Support & Troubleshooting**

### **Common Issues**

#### **Port Already in Use**
```powershell
# Problem: Port 8000 is already in use
# Solution: Find what's using it
netstat -ano | findstr :8000
tasklist /fi "pid eq [PID]"

# Or use the CLI tool
./scripts/tekup-port.ps1 check -Port 8000
```

#### **Health Check Failures**
```powershell
# Problem: Service health check failing
# Debug steps:
1. ./scripts/tekup-port.ps1 check -Port [service_port]
2. curl http://localhost:[port]/health
3. Check service logs
4. Verify service is running
```

#### **Registry Validation Errors**
```powershell
# Problem: YAML syntax errors
# Solution: Validate syntax
python -c "import yaml; yaml.safe_load(open('config/ports/registry.yaml'))"

# Or use online YAML validator
```

### **Getting Help**
1. **Documentation**: Check this file and inline comments
2. **Logs**: Review `logs/port-manager.log`
3. **CLI Help**: `./scripts/tekup-port.ps1 -?`
4. **GitHub Issues**: Report bugs and feature requests
5. **Team Chat**: Ask in development channels

## 📚 **Best Practices**

### **✅ Do's**
- Always use the port registry for new services
- Run conflict checks before deploying
- Document service dependencies
- Include health endpoints for all HTTP services
- Use environment-specific port ranges
- Validate configurations in CI/CD

### **❌ Don'ts**
- Don't hardcode ports in application code
- Don't use system/reserved ports
- Don't skip security scanning
- Don't deploy without health checks
- Don't modify registry without validation
- Don't forget to update documentation

### **Development Workflow**
1. **New Service**: Use CLI to allocate port
2. **Configuration**: Update registry with service details
3. **Testing**: Run health checks and conflict detection
4. **PR Review**: Automated validation in GitHub Actions
5. **Deployment**: Use generated Docker Compose files
6. **Monitoring**: Verify service health post-deployment

---

## 📄 **Quick Reference Card**

### **Essential Commands**
```powershell
# System status
./scripts/tekup-port.ps1 status

# List services  
./scripts/tekup-port.ps1 list

# Check conflicts
./scripts/tekup-port.ps1 conflicts  

# Health checks
./scripts/tekup-port.ps1 health

# New service
./scripts/tekup-port.ps1 allocate -Service "my-api" -Category "backend_apis"
```

### **File Locations**
- **Registry**: `config/ports/registry.yaml`
- **CLI Tool**: `scripts/tekup-port.ps1` 
- **Logs**: `logs/port-manager.log`
- **Validation**: `.github/workflows/port-validation.yml`

### **Port Ranges Quick Reference**
- **Frontend**: 3000-3999 (+10k per env)
- **Backend**: 8000-8999 (+10k per env)  
- **Databases**: 5432-5499 (PostgreSQL), 6379-6399 (Redis)
- **Monitoring**: 9000-9999
- **Dev Tools**: 4000-4999
- **MCP**: 13000-13999

---

*This documentation is part of the TekUp Port Management System v1.0.0*
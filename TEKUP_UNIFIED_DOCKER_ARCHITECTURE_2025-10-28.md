graph TB
    subgraph "TekupDK Unified Docker Architecture"
        subgraph "Local Development Environment"
            subgraph "PostgreSQL Stack"
                PG[PostgreSQL 15<br/>localhost:5432]
                PGAdmin[pgAdmin4<br/>http://localhost:5050]
                Redis[Redis Cache<br/>localhost:6379]
            end

            subgraph "Application Containers"
                Backend[Backend-NestJS<br/>Port 3001]
                Frontend[Frontend-NextJS<br/>Port 3002]
                MCP[Rendetalje MCP Server<br/>Port 3003]
            end
            
            subgraph "Configuration Management"
                EnvLocal[.env.local<br/>PostgreSQL + Redis]
                EnvCloud[.env.cloud<br/>Supabase + Cache]
                ConfigSwitch[Database Switcher<br/>local/cloud toggle]
            end
        end
        
        subgraph "Production Cloud Services"
            subgraph "Supabase Stack"
                SupabasePG[Supabase PostgreSQL<br/>db.oaevagdgrasfppbrxbey.supabase.co:5432]
                SupabaseAuth[Supabase Auth<br/>Token Management]
                SupabaseStorage[Supabase Storage<br/>File Management]
                SupabaseRealtime[Supabase Realtime<br/>Live Updates]
            end
            
            subgraph "AI Development Tools"
                MCPCloud[Supabase MCP<br/>mcp.supabase.com]
                VSCopilot[VS Code Copilot<br/>AI Integration]
            end
        end
        
        subgraph "Network & Security"
            DockerNet[Docker Bridge Network<br/>renos-dev]
            LocalSSL[Local SSL<br/>Development certificates]
            CloudSSL[Cloud SSL<br/>Production certificates]
        end
    end
    
    %% Connections
    Backend -.->|Optional| PG
    Backend -.->|Primary| SupabasePG
    Frontend -.->|Development| Backend
    Frontend -.->|Production| SupabaseAuth
    MCP -.->|Query| PG
    MCP -.->|Query| SupabasePG
    PGAdmin -.->|Management| PG
    PGAdmin -.->|Management| SupabasePG
    
    %% Configuration flows
    ConfigSwitch -.->|Local| EnvLocal
    ConfigSwitch -.->|Cloud| EnvCloud
    EnvLocal -.->|Local Services| PG
    EnvCloud -.->|Cloud Services| SupabasePG
    
    %% AI Integration
    VSCopilot -.->|MCP Protocol| MCP
    VSCopilot -.->|MCP Protocol| MCPCloud
    MCP -.->|Database Tools| SupabasePG
```

## 🎯 Unified Docker Architecture Strategy

### **Core Principles:**

1. **Hybrid Local/Cloud Approach** - Like tekup-secrets
2. **Same Infrastructure Parity** - PostgreSQL + pgAdmin4 + Redis  
3. **MCP Server Integration** - For VS Code Copilot AI assistance
4. **Configuration Switching** - Easy toggle between local and cloud
5. **Production Ready** - Following established patterns from tekup-secrets

### **Architecture Components:**

#### **Local Stack (Development)**
- **PostgreSQL 15** - Local database for development
- **pgAdmin4** - SQL editor interface (http://localhost:5050)
- **Redis** - Caching and session management
- **Application containers** - Backend + Frontend

#### **Cloud Stack (Production/Testing)**
- **Supabase PostgreSQL** - Production database
- **Supabase Auth** - Authentication service
- **Supabase Storage** - File storage
- **Supabase MCP** - AI database integration

#### **AI Development Tools**
- **Rendetalje MCP Server** - Custom MCP server for Rendetalje
- **VS Code Copilot** - AI-assisted development
- **Database queries** - Natural language to SQL
- **Schema exploration** - AI-powered database discovery

### **Configuration Management:**

```yaml
# Database Configuration Switching
environments:
  local:
    database_url: "postgresql://postgres:localpass@localhost:5432/rendetalje"
    cache_url: "redis://localhost:6379"
    use_local_db: true
    
  cloud:
    database_url: "postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres"
    cache_url: "redis://localhost:6379" 
    use_local_db: false
    supabase_url: "https://oaevagdgrasfppbrxbey.supabase.co"
```

### **MCP Server Implementation:**

#### **Rendetalje MCP Server Features:**

- **Database queries** - Convert natural language to SQL
- **Schema exploration** - AI-powered table discovery
- **Data analysis** - Statistical insights and trends
- **Code generation** - Generate API endpoints from schema
- **Migration assistance** - AI-guided database changes

#### **VS Code Integration:**

- **Copilot extension** - MCP server provides database context
- **SQL IntelliSense** - AI-enhanced SQL editing
- **Schema documentation** - Auto-generated API docs
- **Test generation** - Automated test case creation

## 📋 Implementation Phases

### **Phase 1: Infrastructure Setup (Week 1)**

- ✅ **PostgreSQL + pgAdmin4 setup** (like tekup-secrets)
- ✅ **Redis container configuration**
- ✅ **Network configuration and health checks**
- ✅ **Environment configuration switching**

### **Phase 2: MCP Server Development (Week 2)**

- 🔧 **Rendetalje MCP server implementation**
- 🔧 **Database query processing**
- 🔧 **Schema exploration capabilities**
- 🔧 **VS Code integration testing**

### **Phase 3: AI Integration (Week 3)**

- 🤖 **VS Code Copilot integration**
- 🤖 **Natural language to SQL conversion**
- 🤖 **Schema documentation generation**
- 🤖 **Test case generation automation**

### **Phase 4: Documentation & Optimization (Week 4)**

- 📚 **Comprehensive documentation** (following tekup-secrets pattern)
- 📚 **Developer workflow guides**
- 📚 **Troubleshooting and debugging guides**
- 📚 **Performance optimization and monitoring**

## 🏗️ File Structure

```
apps/rendetalje/
├── docker-compose.yml           # Main Docker setup
├── docker-compose.dev.yml       # Development environment
├── .dockerignore               # Build optimization
├── docker/
│   ├── start.sh               # Linux/Mac startup
│   ├── start.ps1              # Windows startup
│   ├── pgadmin-servers.json   # Database configurations
│   ├── mcp.json              # VS Code MCP config
│   └── nginx.conf            # Reverse proxy config
├── mcp/
│   ├── server.ts             # Rendetalje MCP server
│   ├── package.json          # MCP dependencies
│   └── README.md             # MCP setup guide
├── docs/
│   ├── DOCKER_SETUP.md       # Complete Docker guide
│   ├── MCP_INTEGRATION.md    # VS Code setup
│   └── DEVELOPMENT.md        # Local workflow
├── config/
│   ├── databases.env         # Database connections
│   ├── mcp.env              # MCP configuration
│   └── local.env            # Local development
└── scripts/
    ├── start-dev.sh          # Development startup
    ├── start-prod.sh         # Production startup
    └── switch-db.sh          # Database switching
```

## 🔧 Configuration Examples

### **Environment Switching:**

```bash
# Start with local database
./scripts/start-dev.sh --local

# Start with cloud database  
./scripts/start-dev.sh --cloud

# Switch database on the fly
./scripts/switch-db.sh local
./scripts/switch-db.sh cloud
```

### **MCP Server Registration:**

```json
{
  "mcpServers": {
    "rendetalje-db": {
      "command": "npx",
      "args": ["-y", "@rendetalje/mcp-server", "--database", "local"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}",
        "REDIS_URL": "${REDIS_URL}"
      }
    },
    "supabase": {
      "command": "npx", 
      "args": ["-y", "@supabase/mcp-server", "--project-ref", "oaevagdgrasfppbrxbey"]
    }
  }
}
```

### **VS Code Settings:**

```json
{
  "mcp.servers": {
    "rendetalje-db": {
      "command": "node",
      "args": ["./mcp/server.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  },
  "rendetalje.database": {
    "mode": "local", // or "cloud"
    "connectionString": "${env:DATABASE_URL}",
    "autoSwitch": true
  }
}
```

## 🚀 Success Criteria

### **Infrastructure Parity with tekup-secrets:**

- ✅ **PostgreSQL + pgAdmin4** - Same as tekup-secrets
- ✅ **Complete Docker setup** - Production-ready containers
- ✅ **Health monitoring** - Container and service status
- ✅ **Cross-platform support** - Windows/Mac/Linux

### **Enhanced Capabilities:**

- ✅ **MCP Server integration** - AI-assisted database work
- ✅ **VS Code Copilot support** - AI-powered development
- ✅ **Hybrid configuration** - Local/Cloud switching
- ✅ **Automated documentation** - AI-generated guides

### **Developer Experience:**

- ✅ **5-minute setup** - Like tekup-secrets quick start
- ✅ **Zero configuration** - Automatic environment detection
- ✅ **AI assistance** - Natural language to database operations
- ✅ **Local development** - No cloud dependencies required

---

**Architecture Created:** October 28, 2025  
**Status:** Ready for Implementation Approval  
**Next Step:** Implementation via Code Mode

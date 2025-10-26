# Tekup 2.0 - Tekniske Specifikationer

Dette dokument indeholder detaljerede tekniske specifikationer for Tekup 2.0 implementering.

Relaterede dokumenter:
- `docs/TEKUP_2_0_PRODUCT_SPEC.md`
- `docs/TEKUP_2_0_PROJECT_PLAN.md`
- `docs/TEKUP_ARCHITECTURE_OVERVIEW.md`

---

## 1) Systemarkitektur

### 1.1 Overordnet Arkitektur
```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                        │
│                  (NGINX + SSL)                          │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                  API Gateway                            │
│              (Kong + Rate Limiting)                     │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                AgentScope Core                          │
│            (MsgHub + Pipeline + ReAct)                  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│              Microservices Layer                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ Console │ │ Jarvis  │ │  Lead   │ │   CRM   │        │
│  │ Service │ │ Service │ │ Service │ │ Service │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │Workflow │ │ Secure  │ │ Inbox   │ │ Voice   │        │
│  │ Service │ │ Service │ │ Service │ │ Service │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                Data Layer                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │PostgreSQL│ │ Redis   │ │MongoDB  │ │  S3     │        │
│  │(Primary) │ │(Cache)  │ │(Logs)   │ │(Files)  │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
└─────────────────────────────────────────────────────────┘
```

### 1.2 AgentScope Integration
```typescript
// Core AgentScope Service
export class TekupAgentScopeService {
  private msgHub: MsgHub;
  private pipeline: Pipeline;
  private reactEngine: ReActEngine;
  
  constructor() {
    this.msgHub = new MsgHub({
      channels: ['lead', 'crm', 'compliance', 'voice'],
      persistence: true,
      encryption: true
    });
    
    this.pipeline = new Pipeline({
      execution: 'async',
      retry: { attempts: 3, backoff: 'exponential' },
      monitoring: true
    });
    
    this.reactEngine = new ReActEngine({
      model: 'gpt-4',
      tools: this.getToolRegistry(),
      memory: new InMemoryMemory()
    });
  }
  
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    // 1. Route to appropriate agent
    const agent = await this.getAgent(request.agentType);
    
    // 2. Process with ReAct paradigm
    const response = await this.reactEngine.process({
      agent,
      request,
      context: request.context
    });
    
    // 3. Coordinate with other agents if needed
    if (response.requiresCoordination) {
      await this.coordinateAgents(response);
    }
    
    return response;
  }
}
```

---

## 2) Database Design

### 2.1 Multi-Tenant Schema
```sql
-- Core tenant table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User management with tenant isolation
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  permissions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Agent definitions
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  config JSONB NOT NULL,
  tools JSONB,
  policies JSONB,
  status VARCHAR(50) DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent execution logs
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  request JSONB NOT NULL,
  response JSONB,
  status VARCHAR(50) NOT NULL,
  execution_time INTEGER, -- milliseconds
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Business Data Models
```sql
-- Lead management
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  phone VARCHAR(50),
  source VARCHAR(100),
  score INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'new',
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CRM deals
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  value DECIMAL(12,2),
  stage VARCHAR(100) NOT NULL,
  owner_id UUID REFERENCES users(id),
  contact_id UUID,
  company_id UUID,
  probability INTEGER DEFAULT 0,
  close_date DATE,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow definitions
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,
  triggers JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3) API Gateway Configuration

### 3.1 Kong Configuration
```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: unified-console
    url: http://console-service:3000
    routes:
      - name: console-route
        paths: ["/api/v1/console"]
        methods: ["GET", "POST", "PUT", "DELETE"]
    plugins:
      - name: rate-limiting
        config:
          minute: 1000
          hour: 10000
      - name: jwt
        config:
          secret_is_base64: false
          key_claim_name: "iss"
          algorithm: "HS256"

  - name: jarvis-service
    url: http://jarvis-service:3001
    routes:
      - name: jarvis-route
        paths: ["/api/v1/jarvis"]
        methods: ["GET", "POST", "PUT", "DELETE"]
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          hour: 1000
      - name: request-transformer
        config:
          add:
            headers: ["X-Tenant-ID:$(headers.x-tenant-id)"]

  - name: lead-platform
    url: http://lead-service:3002
    routes:
      - name: lead-route
        paths: ["/api/v1/leads"]
        methods: ["GET", "POST", "PUT", "DELETE"]
    plugins:
      - name: rate-limiting
        config:
          minute: 500
          hour: 5000

  - name: crm-service
    url: http://crm-service:3003
    routes:
      - name: crm-route
        paths: ["/api/v1/crm"]
        methods: ["GET", "POST", "PUT", "DELETE"]
    plugins:
      - name: rate-limiting
        config:
          minute: 500
          hour: 5000
```

### 3.2 Rate Limiting Strategy
```typescript
// Rate limiting configuration
export const rateLimits = {
  'unified-console': {
    minute: 1000,
    hour: 10000,
    day: 100000
  },
  'jarvis-service': {
    minute: 100,
    hour: 1000,
    day: 10000
  },
  'lead-platform': {
    minute: 500,
    hour: 5000,
    day: 50000
  },
  'crm-service': {
    minute: 500,
    hour: 5000,
    day: 50000
  },
  'workflow-engine': {
    minute: 200,
    hour: 2000,
    day: 20000
  }
};
```

---

## 4) AgentScope Implementation

### 4.1 MsgHub Configuration
```typescript
// MsgHub setup for multi-tenant communication
export class TekupMsgHub {
  private channels: Map<string, Channel> = new Map();
  private tenants: Map<string, TenantContext> = new Map();
  
  constructor() {
    this.initializeChannels();
  }
  
  private initializeChannels() {
    // Lead processing channel
    this.channels.set('lead', new Channel({
      name: 'lead',
      persistence: true,
      encryption: true,
      retention: '7d'
    }));
    
    // CRM operations channel
    this.channels.set('crm', new Channel({
      name: 'crm',
      persistence: true,
      encryption: true,
      retention: '30d'
    }));
    
    // Compliance checking channel
    this.channels.set('compliance', new Channel({
      name: 'compliance',
      persistence: true,
      encryption: true,
      retention: '1y'
    }));
    
    // Voice processing channel
    this.channels.set('voice', new Channel({
      name: 'voice',
      persistence: false,
      encryption: true,
      retention: '1d'
    }));
  }
  
  async sendMessage(tenantId: string, channel: string, message: Message) {
    const tenantContext = this.tenants.get(tenantId);
    if (!tenantContext) {
      throw new Error(`Tenant ${tenantId} not found`);
    }
    
    const channelInstance = this.channels.get(channel);
    if (!channelInstance) {
      throw new Error(`Channel ${channel} not found`);
    }
    
    // Add tenant context to message
    message.tenantId = tenantId;
    message.timestamp = new Date();
    
    await channelInstance.publish(message);
  }
  
  async subscribe(tenantId: string, channel: string, callback: (message: Message) => void) {
    const channelInstance = this.channels.get(channel);
    if (!channelInstance) {
      throw new Error(`Channel ${channel} not found`);
    }
    
    await channelInstance.subscribe((message: Message) => {
      // Only process messages for this tenant
      if (message.tenantId === tenantId) {
        callback(message);
      }
    });
  }
}
```

### 4.2 Pipeline Implementation
```typescript
// Pipeline for multi-agent workflows
export class TekupPipeline {
  private steps: PipelineStep[] = [];
  private context: PipelineContext;
  
  constructor(config: PipelineConfig) {
    this.context = new PipelineContext(config);
  }
  
  addStep(step: PipelineStep) {
    this.steps.push(step);
    return this;
  }
  
  async execute(input: any): Promise<PipelineResult> {
    const execution = new PipelineExecution({
      steps: this.steps,
      context: this.context,
      input
    });
    
    try {
      const result = await execution.run();
      return {
        success: true,
        result,
        executionTime: execution.getExecutionTime(),
        steps: execution.getStepResults()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: execution.getExecutionTime(),
        steps: execution.getStepResults()
      };
    }
  }
}

// Example workflow: Lead Qualification
export class LeadQualificationPipeline extends TekupPipeline {
  constructor() {
    super({
      name: 'lead-qualification',
      timeout: 30000,
      retry: { attempts: 3, backoff: 'exponential' }
    });
    
    this.addStep(new LeadInputStep())
         .addStep(new AIScoringStep())
         .addStep(new CRMEnrichmentStep())
         .addStep(new ComplianceCheckStep())
         .addStep(new DecisionStep());
  }
}
```

### 4.3 ReAct Engine Implementation
```typescript
// ReAct engine for agent reasoning
export class TekupReActEngine {
  private model: LLMModel;
  private tools: ToolRegistry;
  private memory: MemoryManager;
  
  constructor(config: ReActConfig) {
    this.model = new LLMModel(config.model);
    this.tools = new ToolRegistry(config.tools);
    this.memory = new MemoryManager(config.memory);
  }
  
  async process(request: AgentRequest): Promise<AgentResponse> {
    const context = await this.buildContext(request);
    
    // Reasoning phase
    const reasoning = await this.reason(context);
    
    // Acting phase
    const action = await this.act(reasoning);
    
    // Observation phase
    const observation = await this.observe(action);
    
    // Update memory
    await this.memory.store({
      request,
      reasoning,
      action,
      observation,
      timestamp: new Date()
    });
    
    return {
      reasoning,
      action,
      observation,
      confidence: this.calculateConfidence(reasoning, action, observation)
    };
  }
  
  private async reason(context: AgentContext): Promise<Reasoning> {
    const prompt = this.buildReasoningPrompt(context);
    const response = await this.model.generate(prompt);
    
    return {
      thought: response.thought,
      reasoning: response.reasoning,
      nextAction: response.nextAction
    };
  }
  
  private async act(reasoning: Reasoning): Promise<Action> {
    if (reasoning.nextAction.type === 'tool_call') {
      const tool = this.tools.get(reasoning.nextAction.tool);
      return await tool.execute(reasoning.nextAction.parameters);
    }
    
    return {
      type: 'response',
      content: reasoning.nextAction.content
    };
  }
  
  private async observe(action: Action): Promise<Observation> {
    return {
      result: action.result,
      success: action.success,
      metadata: action.metadata
    };
  }
}
```

---

## 5) Security Implementation

### 5.1 Authentication & Authorization
```typescript
// JWT-based authentication
export class TekupAuthService {
  private jwtSecret: string;
  private refreshSecret: string;
  
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
    this.refreshSecret = process.env.REFRESH_SECRET!;
  }
  
  async generateTokens(user: User): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      tenant: user.tenantId,
      role: user.role,
      permissions: user.permissions
    };
    
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '15m',
      issuer: 'tekup'
    });
    
    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      this.refreshSecret,
      { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
  
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const payload = jwt.verify(refreshToken, this.refreshSecret) as any;
    
    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('Invalid refresh token');
    }
    
    const user = await this.getUserById(payload.sub);
    return this.generateTokens(user);
  }
}

// RBAC authorization
export class TekupAuthzService {
  private permissions: Map<string, Permission[]> = new Map();
  
  constructor() {
    this.initializePermissions();
  }
  
  private initializePermissions() {
    // Owner permissions
    this.permissions.set('owner', [
      { resource: '*', actions: ['*'] }
    ]);
    
    // Admin permissions
    this.permissions.set('admin', [
      { resource: 'users', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'agents', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'workflows', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'settings', actions: ['read', 'update'] }
    ]);
    
    // Manager permissions
    this.permissions.set('manager', [
      { resource: 'leads', actions: ['read', 'create', 'update'] },
      { resource: 'deals', actions: ['read', 'create', 'update'] },
      { resource: 'reports', actions: ['read', 'create'] }
    ]);
    
    // Operator permissions
    this.permissions.set('operator', [
      { resource: 'leads', actions: ['read', 'update'] },
      { resource: 'deals', actions: ['read', 'update'] },
      { resource: 'workflows', actions: ['read', 'execute'] }
    ]);
  }
  
  async checkPermission(user: User, resource: string, action: string): Promise<boolean> {
    const userPermissions = this.permissions.get(user.role) || [];
    
    return userPermissions.some(permission => {
      if (permission.resource === '*' || permission.resource === resource) {
        return permission.actions.includes('*') || permission.actions.includes(action);
      }
      return false;
    });
  }
}
```

### 5.2 Data Encryption
```typescript
// Encryption service for sensitive data
export class TekupEncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }
  
  encrypt(data: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('tekup'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(encryptedData: EncryptedData): string {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('tekup'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

---

## 6) Monitoring & Observability

### 6.1 Prometheus Metrics
```typescript
// Custom metrics for Tekup 2.0
export class TekupMetrics {
  private register: Registry;
  
  constructor() {
    this.register = new Registry();
    this.initializeMetrics();
  }
  
  private initializeMetrics() {
    // API request metrics
    this.httpRequestsTotal = new Counter({
      name: 'tekup_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'tenant']
    });
    
    // Agent execution metrics
    this.agentExecutionsTotal = new Counter({
      name: 'tekup_agent_executions_total',
      help: 'Total number of agent executions',
      labelNames: ['agent_type', 'tenant', 'status']
    });
    
    // Agent execution duration
    this.agentExecutionDuration = new Histogram({
      name: 'tekup_agent_execution_duration_seconds',
      help: 'Duration of agent executions',
      labelNames: ['agent_type', 'tenant'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
    });
    
    // Workflow execution metrics
    this.workflowExecutionsTotal = new Counter({
      name: 'tekup_workflow_executions_total',
      help: 'Total number of workflow executions',
      labelNames: ['workflow_id', 'tenant', 'status']
    });
    
    // Database connection metrics
    this.databaseConnections = new Gauge({
      name: 'tekup_database_connections_active',
      help: 'Number of active database connections'
    });
    
    // Memory usage metrics
    this.memoryUsage = new Gauge({
      name: 'tekup_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type']
    });
  }
  
  recordHttpRequest(method: string, route: string, statusCode: number, tenant: string) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
      tenant
    });
  }
  
  recordAgentExecution(agentType: string, tenant: string, status: string, duration: number) {
    this.agentExecutionsTotal.inc({
      agent_type: agentType,
      tenant,
      status
    });
    
    this.agentExecutionDuration.observe({
      agent_type: agentType,
      tenant
    }, duration);
  }
}
```

### 6.2 Grafana Dashboards
```json
{
  "dashboard": {
    "title": "Tekup 2.0 - System Overview",
    "panels": [
      {
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(tekup_http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Agent Execution Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(tekup_agent_executions_total[5m])",
            "legendFormat": "{{agent_type}}"
          }
        ]
      },
      {
        "title": "Agent Execution Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(tekup_agent_execution_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "singlestat",
        "targets": [
          {
            "expr": "tekup_database_connections_active"
          }
        ]
      }
    ]
  }
}
```

---

## 7) Deployment Configuration

### 7.1 Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  # API Gateway
  kong:
    image: kong:3.0
    ports:
      - "8000:8000"
      - "8001:8001"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
    volumes:
      - ./kong.yml:/var/lib/kong/kong.yml
    depends_on:
      - console-service
      - jarvis-service
      - lead-service
      - crm-service

  # Core Services
  console-service:
    build: ./apps/console
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/tekup
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  jarvis-service:
    build: ./apps/jarvis
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/tekup
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis

  lead-service:
    build: ./apps/lead-platform
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/tekup
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  crm-service:
    build: ./apps/crm
    ports:
      - "3003:3003"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/tekup
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  # Data Layer
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: tekup
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Monitoring
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

### 7.2 Kubernetes Deployment
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tekup-console
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tekup-console
  template:
    metadata:
      labels:
        app: tekup-console
    spec:
      containers:
      - name: console
        image: tekup/console:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: tekup-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: tekup-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: tekup-console-service
spec:
  selector:
    app: tekup-console
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## 8) Performance Optimization

### 8.1 Caching Strategy
```typescript
// Multi-level caching implementation
export class TekupCacheService {
  private l1Cache: Map<string, any> = new Map(); // In-memory cache
  private l2Cache: Redis; // Redis cache
  private l3Cache: Database; // Database cache
  
  constructor() {
    this.l2Cache = new Redis(process.env.REDIS_URL!);
  }
  
  async get<T>(key: string): Promise<T | null> {
    // L1 Cache (fastest)
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key);
    }
    
    // L2 Cache (Redis)
    const l2Value = await this.l2Cache.get(key);
    if (l2Value) {
      const parsed = JSON.parse(l2Value);
      this.l1Cache.set(key, parsed);
      return parsed;
    }
    
    // L3 Cache (Database)
    const l3Value = await this.l3Cache.get(key);
    if (l3Value) {
      await this.l2Cache.setex(key, 3600, JSON.stringify(l3Value));
      this.l1Cache.set(key, l3Value);
      return l3Value;
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    // Set in all cache levels
    this.l1Cache.set(key, value);
    await this.l2Cache.setex(key, ttl, JSON.stringify(value));
    await this.l3Cache.set(key, value, ttl);
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Invalidate L1 cache
    for (const key of this.l1Cache.keys()) {
      if (key.includes(pattern)) {
        this.l1Cache.delete(key);
      }
    }
    
    // Invalidate L2 cache
    const keys = await this.l2Cache.keys(pattern);
    if (keys.length > 0) {
      await this.l2Cache.del(...keys);
    }
    
    // Invalidate L3 cache
    await this.l3Cache.invalidate(pattern);
  }
}
```

### 8.2 Database Optimization
```sql
-- Indexes for performance
CREATE INDEX CONCURRENTLY idx_leads_tenant_status 
ON leads(tenant_id, status) 
WHERE status IN ('new', 'contacted', 'qualified');

CREATE INDEX CONCURRENTLY idx_deals_tenant_stage 
ON deals(tenant_id, stage) 
WHERE stage IN ('prospecting', 'qualification', 'proposal');

CREATE INDEX CONCURRENTLY idx_agent_executions_tenant_created 
ON agent_executions(tenant_id, created_at DESC);

-- Partitioning for large tables
CREATE TABLE agent_executions_2024_01 PARTITION OF agent_executions
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Materialized views for analytics
CREATE MATERIALIZED VIEW mv_lead_analytics AS
SELECT 
  tenant_id,
  DATE(created_at) as date,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
  AVG(score) as avg_score
FROM leads
GROUP BY tenant_id, DATE(created_at);

-- Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lead_analytics;
```

---

## 9) Testing Strategy

### 9.1 Unit Tests
```typescript
// Example unit test for AgentScope service
describe('TekupAgentScopeService', () => {
  let service: TekupAgentScopeService;
  let mockMsgHub: jest.Mocked<MsgHub>;
  let mockPipeline: jest.Mocked<Pipeline>;
  
  beforeEach(() => {
    mockMsgHub = {
      sendMessage: jest.fn(),
      subscribe: jest.fn()
    } as any;
    
    mockPipeline = {
      execute: jest.fn()
    } as any;
    
    service = new TekupAgentScopeService(mockMsgHub, mockPipeline);
  });
  
  describe('processRequest', () => {
    it('should process request successfully', async () => {
      const request: AgentRequest = {
        agentType: 'lead',
        data: { name: 'Test Lead', email: 'test@example.com' },
        context: { tenantId: 'tenant-123' }
      };
      
      const expectedResponse: AgentResponse = {
        success: true,
        data: { score: 85, recommendations: [] },
        confidence: 0.9
      };
      
      mockPipeline.execute.mockResolvedValue(expectedResponse);
      
      const result = await service.processRequest(request);
      
      expect(result).toEqual(expectedResponse);
      expect(mockPipeline.execute).toHaveBeenCalledWith(request);
    });
    
    it('should handle errors gracefully', async () => {
      const request: AgentRequest = {
        agentType: 'lead',
        data: { name: 'Test Lead' },
        context: { tenantId: 'tenant-123' }
      };
      
      mockPipeline.execute.mockRejectedValue(new Error('Processing failed'));
      
      await expect(service.processRequest(request)).rejects.toThrow('Processing failed');
    });
  });
});
```

### 9.2 Integration Tests
```typescript
// Example integration test
describe('Lead Platform Integration', () => {
  let app: Application;
  let agentScopeService: TekupAgentScopeService;
  
  beforeAll(async () => {
    app = await createTestApp();
    agentScopeService = app.get(TekupAgentScopeService);
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('POST /api/v1/leads', () => {
    it('should create lead and trigger AI analysis', async () => {
      const leadData = {
        name: 'Test Lead',
        email: 'test@example.com',
        company: 'Test Corp'
      };
      
      const response = await request(app)
        .post('/api/v1/leads')
        .send(leadData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: leadData.name,
        email: leadData.email,
        company: leadData.company,
        score: expect.any(Number)
      });
      
      // Verify AI analysis was triggered
      expect(agentScopeService.processRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          agentType: 'lead',
          data: leadData
        })
      );
    });
  });
});
```

### 9.3 E2E Tests
```typescript
// Example E2E test
describe('Lead to Deal Conversion Flow', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  it('should convert lead to deal successfully', async () => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.type('[data-testid="email"]', 'admin@test.com');
    await page.type('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to leads
    await page.waitForSelector('[data-testid="leads-page"]');
    await page.click('[data-testid="leads-page"]');
    
    // Select a lead
    await page.waitForSelector('[data-testid="lead-item"]');
    await page.click('[data-testid="lead-item"]');
    
    // Convert to deal
    await page.click('[data-testid="convert-button"]');
    await page.type('[data-testid="deal-value"]', '50000');
    await page.click('[data-testid="save-deal"]');
    
    // Verify deal was created
    await page.waitForSelector('[data-testid="deal-created"]');
    expect(await page.textContent('[data-testid="deal-created"]')).toBe('Deal created successfully');
  });
});
```

---

## 10) Documentation Standards

### 10.1 API Documentation
```typescript
/**
 * @api {post} /api/v1/leads Create Lead
 * @apiName CreateLead
 * @apiGroup Leads
 * @apiVersion 1.0.0
 * 
 * @apiDescription Creates a new lead and triggers AI analysis
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiHeader {String} X-Tenant-ID Tenant identifier
 * 
 * @apiParam {String} name Lead name
 * @apiParam {String} email Lead email
 * @apiParam {String} company Company name
 * @apiParam {String} [phone] Phone number
 * @apiParam {String} [source] Lead source
 * @apiParam {Object} [data] Additional lead data
 * 
 * @apiSuccess {String} id Lead ID
 * @apiSuccess {String} name Lead name
 * @apiSuccess {String} email Lead email
 * @apiSuccess {String} company Company name
 * @apiSuccess {Number} score AI-generated score
 * @apiSuccess {Array} recommendations AI recommendations
 * @apiSuccess {String} status Lead status
 * @apiSuccess {String} createdAt Creation timestamp
 * 
 * @apiError {String} error Error message
 * @apiError {Number} status HTTP status code
 * 
 * @apiExample {json} Request:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "company": "Example Corp",
 *   "phone": "+45 12 34 56 78",
 *   "source": "website"
 * }
 * 
 * @apiExample {json} Response:
 * {
 *   "id": "lead-123",
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "company": "Example Corp",
 *   "score": 85,
 *   "recommendations": ["Schedule discovery call", "Send proposal"],
 *   "status": "new",
 *   "createdAt": "2024-01-20T14:30:00Z"
 * }
 */
```

### 10.2 Code Documentation
```typescript
/**
 * TekupAgentScopeService - Core service for multi-agent coordination
 * 
 * This service integrates with AgentScope to provide:
 * - Multi-agent communication via MsgHub
 * - Workflow execution via Pipeline
 * - AI reasoning via ReAct paradigm
 * 
 * @example
 * ```typescript
 * const service = new TekupAgentScopeService();
 * const response = await service.processRequest({
 *   agentType: 'lead',
 *   data: { name: 'John Doe', email: 'john@example.com' },
 *   context: { tenantId: 'tenant-123' }
 * });
 * ```
 */
export class TekupAgentScopeService {
  /**
   * Process a request through the agent system
   * 
   * @param request - The agent request to process
   * @returns Promise resolving to agent response
   * @throws {AgentError} When agent processing fails
   * @throws {ValidationError} When request validation fails
   */
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    // Implementation...
  }
}
```

---

Dette dokument fungerer som reference for teknisk implementering. Opdateres løbende baseret på ændringer og feedback.

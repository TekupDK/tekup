# Technology Decision Records (ADRs)

## Overview

This document contains the Technology Decision Records (ADRs) for the TekUp platform. ADRs capture important architectural decisions, their context, rationale, and consequences to provide historical context and guide future decisions.

## ADR Template

Each ADR follows this standard format:
- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Date**: Decision date
- **Context**: The situation that led to the decision
- **Decision**: The chosen solution
- **Consequences**: Positive and negative outcomes
- **Alternatives Considered**: Other options that were evaluated

---

## ADR-001: Multi-tenant Architecture with PostgreSQL RLS

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Architecture Team, CTO

### Context

TekUp needs to serve multiple customers (tenants) while ensuring complete data isolation, maintaining performance, and keeping operational complexity manageable. We evaluated several multi-tenancy approaches:

1. **Separate Databases**: Each tenant gets their own database
2. **Shared Database, Separate Schemas**: Single database with schema per tenant
3. **Shared Database, Shared Schema with RLS**: Single schema with Row Level Security
4. **Hybrid Approach**: Combination based on tenant size

### Decision

Implement multi-tenancy using **PostgreSQL Row Level Security (RLS)** with a shared database and shared schema approach.

### Rationale

- **Security**: Database-level isolation provides strongest security guarantees
- **Performance**: Shared resources enable better resource utilization
- **Operational Simplicity**: Single database to manage, backup, and monitor
- **Cost Efficiency**: Shared infrastructure reduces per-tenant costs
- **Scalability**: Can handle thousands of tenants without operational overhead

### Implementation Details

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create isolation policies
CREATE POLICY tenant_isolation ON leads
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Tenant context setting
SELECT set_config('app.current_tenant', 'tenant-uuid', true);
```

### Consequences

**Positive**:
- Complete data isolation at database level
- Simplified application logic (no tenant routing)
- Efficient resource utilization
- Single point of backup and monitoring
- Strong security guarantees

**Negative**:
- PostgreSQL-specific implementation
- Potential performance overhead for RLS checks
- Complex migration if we need to change approaches
- Requires careful index design for performance

**Mitigation**:
- Comprehensive indexing strategy with tenant_id as first column
- Connection pooling and read replicas for performance
- Monitoring and alerting for RLS policy effectiveness

---

## ADR-002: NestJS for Backend Framework

**Status**: Accepted  
**Date**: 2024-01-20  
**Deciders**: Backend Team, Tech Lead

### Context

We needed a robust backend framework that supports:
- TypeScript-first development
- Dependency injection and modular architecture
- OpenAPI/Swagger documentation
- WebSocket support for real-time features
- Enterprise-grade scalability patterns

### Alternatives Considered

1. **Express.js**: Minimal, flexible, large ecosystem
2. **Fastify**: High performance, TypeScript support
3. **NestJS**: Enterprise framework, Angular-inspired
4. **Koa.js**: Modern Express alternative
5. **tRPC**: Type-safe API framework

### Decision

Adopt **NestJS** as the primary backend framework for all API services.

### Rationale

- **TypeScript First**: Built with TypeScript, excellent type safety
- **Dependency Injection**: Clean architecture with IoC container
- **Modular Design**: Promotes clean, maintainable code structure
- **Ecosystem**: Rich ecosystem with guards, interceptors, pipes
- **Documentation**: Built-in OpenAPI/Swagger support
- **WebSocket**: Native Socket.IO integration
- **Testing**: Comprehensive testing utilities
- **Enterprise Ready**: Used by many large-scale applications

### Implementation Pattern

```typescript
// Module structure
@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [LeadController],
  providers: [LeadService, LeadRepository],
  exports: [LeadService]
})
export class LeadModule {}

// Service with dependency injection
@Injectable()
export class LeadService {
  constructor(
    private leadRepository: LeadRepository,
    private cacheService: CacheService,
    private eventBus: EventBus
  ) {}
}
```

### Consequences

**Positive**:
- Strong typing throughout the application
- Clean, maintainable architecture
- Excellent developer experience
- Built-in features reduce boilerplate
- Strong community and ecosystem
- Easy testing and mocking

**Negative**:
- Learning curve for developers new to NestJS
- More opinionated than Express
- Larger bundle size than minimal frameworks
- Framework lock-in

**Mitigation**:
- Comprehensive documentation and training
- Gradual adoption with clear patterns
- Abstract business logic from framework specifics

---

## ADR-003: Next.js with App Router for Frontend

**Status**: Accepted  
**Date**: 2024-01-25  
**Deciders**: Frontend Team, Tech Lead

### Context

We need a modern React framework that provides:
- Server-side rendering for performance
- File-based routing system
- Built-in optimization features
- TypeScript support
- API routes capability
- Static site generation options

### Alternatives Considered

1. **Create React App**: Simple setup, limited features
2. **Vite + React Router**: Fast development, manual configuration
3. **Remix**: Full-stack React framework
4. **Next.js Pages Router**: Established Next.js routing
5. **Next.js App Router**: New Next.js routing system

### Decision

Adopt **Next.js 15 with App Router** for all frontend applications.

### Rationale

- **Performance**: Built-in SSR, SSG, and optimization features
- **Developer Experience**: Excellent tooling and development server
- **App Router**: Modern routing with layouts and streaming
- **TypeScript**: First-class TypeScript support
- **Ecosystem**: Large ecosystem and community
- **Deployment**: Seamless Vercel deployment
- **API Routes**: Can handle simple backend needs
- **Image Optimization**: Built-in image optimization

### Implementation Pattern

```typescript
// App Router structure
app/
├── layout.tsx          // Root layout
├── page.tsx           // Home page
├── leads/
│   ├── layout.tsx     // Leads layout
│   ├── page.tsx       // Leads list
│   └── [id]/
│       └── page.tsx   // Lead detail
└── api/
    └── health/
        └── route.ts   // API route
```

### Consequences

**Positive**:
- Excellent performance out of the box
- Modern React features (Server Components, Suspense)
- Built-in optimizations (images, fonts, scripts)
- Great developer experience
- Strong TypeScript integration
- Automatic code splitting

**Negative**:
- App Router is relatively new (potential bugs)
- Framework lock-in with Next.js
- Learning curve for App Router patterns
- Vercel-optimized (though works elsewhere)

**Mitigation**:
- Gradual migration from Pages Router
- Comprehensive testing of App Router features
- Documentation of patterns and best practices

---

## ADR-004: pnpm Workspaces for Monorepo Management

**Status**: Accepted  
**Date**: 2024-02-01  
**Deciders**: DevOps Team, Tech Lead

### Context

We have multiple related applications and shared packages that need:
- Efficient dependency management
- Code sharing between applications
- Consistent tooling and scripts
- Fast installation and builds
- Proper dependency isolation

### Alternatives Considered

1. **npm Workspaces**: Built into npm, basic features
2. **Yarn Workspaces**: Mature, good performance
3. **pnpm Workspaces**: Fast, efficient, strict
4. **Lerna**: Monorepo management tool
5. **Nx**: Enterprise monorepo solution

### Decision

Use **pnpm Workspaces** with **Nx** for build orchestration.

### Rationale

- **Performance**: Fastest package manager, efficient disk usage
- **Strict**: Prevents phantom dependencies
- **Workspace Support**: Excellent monorepo features
- **Compatibility**: Works with existing npm ecosystem
- **Disk Efficiency**: Content-addressable storage
- **Security**: Better security than npm/yarn
- **Nx Integration**: Powerful build system and caching

### Implementation

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
```

```json
// package.json
{
  "scripts": {
    "dev": "nx run-many --target=dev --all",
    "build": "nx run-many --target=build --all",
    "test": "nx run-many --target=test --all"
  }
}
```

### Consequences

**Positive**:
- Fastest installation and builds
- Efficient disk usage (saves ~30% space)
- Prevents dependency issues
- Excellent workspace features
- Strong security model
- Great CI/CD performance

**Negative**:
- Less adoption than npm/yarn
- Some tools may not support pnpm
- Learning curve for team
- Strict mode can be challenging initially

**Mitigation**:
- Team training on pnpm concepts
- Documentation of common patterns
- Fallback strategies for incompatible tools

---

## ADR-005: Socket.IO for Real-time Communication

**Status**: Accepted  
**Date**: 2024-02-10  
**Deciders**: Backend Team, Frontend Team

### Context

We need real-time communication for:
- Dashboard updates when leads change
- Voice command execution and responses
- Multi-user collaboration features
- System notifications and alerts
- Live status updates

### Alternatives Considered

1. **Native WebSockets**: Low-level, maximum control
2. **Socket.IO**: High-level, feature-rich
3. **Server-Sent Events (SSE)**: Simple, one-way
4. **GraphQL Subscriptions**: Type-safe, complex
5. **WebRTC**: Peer-to-peer, complex setup

### Decision

Implement real-time communication using **Socket.IO**.

### Rationale

- **Reliability**: Automatic fallbacks and reconnection
- **Feature Rich**: Rooms, namespaces, broadcasting
- **Cross-platform**: Works across all browsers and platforms
- **Easy Integration**: Simple client and server APIs
- **Scalability**: Built-in clustering and Redis adapter
- **TypeScript**: Good TypeScript support
- **Ecosystem**: Large community and ecosystem

### Implementation Pattern

```typescript
// Server-side implementation
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/events'
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-tenant')
  handleJoinTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string }
  ) {
    client.join(`tenant:${data.tenantId}`);
  }

  broadcastToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }
}

// Client-side implementation
const socket = io('/events', {
  auth: { tenantKey: 'tenant-api-key' }
});

socket.on('lead_created', (lead) => {
  // Update UI with new lead
});
```

### Consequences

**Positive**:
- Reliable real-time communication
- Automatic connection management
- Rich feature set (rooms, namespaces)
- Good performance and scalability
- Excellent browser compatibility
- Easy to implement and maintain

**Negative**:
- Additional complexity vs simple HTTP
- Connection state management
- Potential memory leaks if not handled properly
- Debugging can be more complex

**Mitigation**:
- Comprehensive connection management
- Proper error handling and reconnection logic
- Memory leak prevention patterns
- Monitoring and alerting for WebSocket health

---

## ADR-006: Zustand for State Management

**Status**: Accepted  
**Date**: 2024-02-15  
**Deciders**: Frontend Team

### Context

We need client-side state management for:
- User authentication state
- Tenant context and switching
- Lead data and filters
- Voice agent state
- UI state (modals, forms)

### Alternatives Considered

1. **Redux Toolkit**: Mature, powerful, complex
2. **Zustand**: Simple, lightweight, flexible
3. **Jotai**: Atomic state management
4. **Valtio**: Proxy-based state
5. **React Context**: Built-in, limited features

### Decision

Use **Zustand** for client-side state management.

### Rationale

- **Simplicity**: Minimal boilerplate, easy to learn
- **Performance**: Efficient re-renders, selective subscriptions
- **TypeScript**: Excellent TypeScript support
- **Flexibility**: Works with any React pattern
- **Size**: Very small bundle size (~2KB)
- **DevTools**: Good debugging experience
- **SSR**: Works well with Next.js SSR

### Implementation Pattern

```typescript
// Auth store
interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,
  
  login: async (credentials) => {
    const { user, tenant } = await authService.login(credentials);
    set({ user, tenant, isAuthenticated: true });
  },
  
  logout: () => {
    authService.logout();
    set({ user: null, tenant: null, isAuthenticated: false });
  },
  
  switchTenant: async (tenantId) => {
    const tenant = await tenantService.switchTenant(tenantId);
    set({ tenant });
  }
}));

// Usage in components
const LoginForm = () => {
  const { login, isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      login(formData);
    }}>
      {/* form fields */}
    </form>
  );
};
```

### Consequences

**Positive**:
- Very easy to learn and use
- Minimal boilerplate code
- Excellent performance
- Great TypeScript integration
- Small bundle size impact
- Flexible and unopinionated

**Negative**:
- Less mature ecosystem than Redux
- Fewer debugging tools
- Less structured than Redux patterns
- Team needs to establish conventions

**Mitigation**:
- Establish clear patterns and conventions
- Create reusable store patterns
- Document best practices for the team

---

## ADR-007: Prisma ORM for Database Access

**Status**: Accepted  
**Date**: 2024-02-20  
**Deciders**: Backend Team

### Context

We need a database access layer that provides:
- Type-safe database queries
- Schema migration management
- Multi-database support
- Good performance
- Developer experience

### Alternatives Considered

1. **TypeORM**: Mature, decorator-based, complex
2. **Prisma**: Modern, type-safe, schema-first
3. **Sequelize**: Mature, promise-based, less type-safe
4. **Knex.js**: Query builder, flexible, manual typing
5. **Raw SQL**: Maximum control, no abstraction

### Decision

Use **Prisma** as the primary ORM for database access.

### Rationale

- **Type Safety**: Generated types from schema
- **Developer Experience**: Excellent tooling and IDE support
- **Schema Management**: Declarative schema with migrations
- **Performance**: Efficient queries and connection pooling
- **Multi-database**: Supports PostgreSQL, MySQL, SQLite
- **Introspection**: Can generate schema from existing database
- **Client Generation**: Auto-generated, type-safe client

### Implementation Pattern

```prisma
// schema.prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  apiKey    String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  leads     Lead[]
  users     User[]
  
  @@map("tenants")
}

model Lead {
  id        String   @id @default(cuid())
  tenantId  String   @map("tenant_id")
  name      String
  email     String?
  status    String   @default("NEW")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  @@map("leads")
  @@index([tenantId, status])
  @@index([tenantId, createdAt])
}
```

```typescript
// Usage in service
@Injectable()
export class LeadService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<Lead[]> {
    return this.prisma.lead.findMany({
      where: { tenantId },
      include: { tenant: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}
```

### Consequences

**Positive**:
- Excellent type safety and IDE support
- Great developer experience
- Automatic migration generation
- Efficient query generation
- Good performance characteristics
- Strong ecosystem and community

**Negative**:
- Relatively new compared to TypeORM
- Schema-first approach may not suit all teams
- Generated client can be large
- Less flexibility than raw SQL

**Mitigation**:
- Team training on Prisma concepts
- Establish patterns for complex queries
- Monitor generated client size
- Use raw queries for complex operations when needed

---

## ADR-008: Redis for Caching and Session Storage

**Status**: Accepted  
**Date**: 2024-02-25  
**Deciders**: Backend Team, DevOps Team

### Context

We need caching and session storage for:
- API response caching
- Session management
- WebSocket connection state
- Rate limiting data
- Temporary data storage

### Alternatives Considered

1. **Redis**: In-memory, feature-rich, mature
2. **Memcached**: Simple, fast, limited features
3. **In-memory caching**: Simple, not distributed
4. **Database caching**: Persistent, slower
5. **DynamoDB**: Managed, expensive for caching

### Decision

Use **Redis** for caching and session storage.

### Rationale

- **Performance**: Extremely fast in-memory operations
- **Features**: Rich data structures and operations
- **Persistence**: Optional data persistence
- **Clustering**: Built-in clustering and replication
- **Ecosystem**: Excellent tooling and libraries
- **Scalability**: Horizontal scaling capabilities
- **Use Cases**: Perfect for caching, sessions, queues

### Implementation Pattern

```typescript
// Redis configuration
@Module({
  imports: [
    RedisModule.forRoot({
      config: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        retryAttempts: 3,
        retryDelay: 1000,
      }
    })
  ]
})
export class CacheModule {}

// Cache service
@Injectable()
export class CacheService {
  constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

### Consequences

**Positive**:
- Excellent performance for caching
- Rich feature set for various use cases
- Good clustering and high availability
- Strong ecosystem and tooling
- Flexible data structures
- Good monitoring and debugging tools

**Negative**:
- Additional infrastructure to manage
- Memory usage can be high
- Data loss risk if not configured properly
- Complexity for simple use cases

**Mitigation**:
- Proper Redis configuration and monitoring
- Backup and persistence strategies
- Memory usage monitoring and optimization
- Fallback strategies for cache misses

---

## ADR-009: Gemini Live API for Voice Processing

**Status**: Accepted  
**Date**: 2024-03-01  
**Deciders**: AI Team, Product Team

### Context

We need voice processing capabilities for:
- Danish language voice commands
- Real-time voice interaction
- Natural language understanding
- Voice-to-text conversion
- Text-to-speech generation

### Alternatives Considered

1. **OpenAI Whisper + GPT**: Separate services, complex integration
2. **Google Cloud Speech-to-Text**: Good accuracy, limited features
3. **Azure Speech Services**: Enterprise features, complex pricing
4. **Gemini Live API**: Integrated solution, real-time
5. **AWS Transcribe**: Good integration, limited real-time

### Decision

Use **Gemini Live API** for voice processing and real-time interaction.

### Rationale

- **Real-time**: Built for real-time voice interaction
- **Integration**: Single API for speech and language understanding
- **Danish Support**: Good Danish language support
- **Streaming**: Real-time streaming capabilities
- **Context**: Maintains conversation context
- **Performance**: Low latency for real-time use
- **Cost**: Competitive pricing model

### Implementation Pattern

```typescript
// Gemini Live service
@Injectable()
export class GeminiLiveService {
  private client: GeminiLiveClient;

  constructor() {
    this.client = new GeminiLiveClient({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-live-v1'
    });
  }

  async startVoiceSession(tenantId: string): Promise<VoiceSession> {
    const session = await this.client.createSession({
      language: 'da-DK',
      context: {
        tenantId,
        capabilities: await this.getTenantCapabilities(tenantId)
      }
    });

    session.on('speech_recognized', (text) => {
      this.handleVoiceCommand(tenantId, text);
    });

    return session;
  }

  private async handleVoiceCommand(tenantId: string, command: string) {
    const intent = await this.extractIntent(command);
    const result = await this.executeCommand(tenantId, intent);
    
    // Send response back through WebSocket
    this.eventGateway.broadcastToTenant(tenantId, 'voice_response', result);
  }
}
```

### Consequences

**Positive**:
- Excellent real-time performance
- Good Danish language support
- Integrated speech and language understanding
- Streaming capabilities for responsive UX
- Competitive pricing
- Good developer experience

**Negative**:
- Vendor lock-in with Google
- Relatively new service (potential stability issues)
- Limited customization compared to separate services
- Dependency on Google's infrastructure

**Mitigation**:
- Abstraction layer for voice processing
- Fallback to alternative services
- Monitoring and alerting for service availability
- Regular evaluation of alternatives

---

## ADR-010: Kubernetes for Container Orchestration

**Status**: Accepted  
**Date**: 2024-03-10  
**Deciders**: DevOps Team, CTO

### Context

We need container orchestration for:
- Application deployment and scaling
- Service discovery and load balancing
- Health monitoring and auto-recovery
- Configuration and secret management
- Rolling updates and rollbacks

### Alternatives Considered

1. **Docker Compose**: Simple, limited scalability
2. **Docker Swarm**: Docker-native, simpler than K8s
3. **Kubernetes**: Industry standard, complex, powerful
4. **AWS ECS**: Managed, AWS-specific
5. **Nomad**: Simple, less ecosystem

### Decision

Use **Kubernetes** for container orchestration in production.

### Rationale

- **Industry Standard**: Widely adopted, large ecosystem
- **Scalability**: Excellent horizontal scaling capabilities
- **Features**: Rich feature set for enterprise needs
- **Ecosystem**: Huge ecosystem of tools and integrations
- **Multi-cloud**: Works across different cloud providers
- **Community**: Large community and support
- **Future-proof**: Likely to remain relevant long-term

### Implementation Pattern

```yaml
# Deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flow-api
  namespace: tekup-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flow-api
  template:
    metadata:
      labels:
        app: flow-api
    spec:
      containers:
      - name: flow-api
        image: tekup/flow-api:latest
        ports:
        - containerPort: 4000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
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
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Consequences

**Positive**:
- Excellent scalability and reliability
- Rich ecosystem and tooling
- Industry standard with good support
- Multi-cloud portability
- Advanced deployment strategies
- Comprehensive monitoring and logging

**Negative**:
- High complexity and learning curve
- Resource overhead
- Operational complexity
- Potential over-engineering for simple applications

**Mitigation**:
- Managed Kubernetes service (EKS, GKE, AKS)
- Comprehensive training and documentation
- Start with simple configurations
- Use Helm charts for standardization

---

## ADR-011: Prometheus and Grafana for Monitoring

**Status**: Accepted  
**Date**: 2024-03-15  
**Deciders**: DevOps Team, SRE Team

### Context

We need comprehensive monitoring for:
- Application performance metrics
- Infrastructure health monitoring
- Business metrics tracking
- Alerting and incident response
- Capacity planning and optimization

### Alternatives Considered

1. **Prometheus + Grafana**: Open source, powerful, complex
2. **DataDog**: Managed, expensive, feature-rich
3. **New Relic**: APM focused, expensive
4. **AWS CloudWatch**: AWS-native, limited features
5. **Elastic Stack**: Log-focused, can do metrics

### Decision

Use **Prometheus** for metrics collection and **Grafana** for visualization and alerting.

### Rationale

- **Open Source**: No vendor lock-in, cost-effective
- **Powerful**: Excellent query language (PromQL)
- **Ecosystem**: Large ecosystem of exporters
- **Scalability**: Handles high-cardinality metrics well
- **Integration**: Great Kubernetes integration
- **Alerting**: Built-in alerting with Alertmanager
- **Visualization**: Grafana provides excellent dashboards

### Implementation Pattern

```yaml
# Prometheus configuration
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'tekup-api'
    static_configs:
      - targets: ['flow-api:4000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

```typescript
// Application metrics
@Injectable()
export class MetricsService {
  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code', 'tenant_id'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  });

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    tenantId?: string
  ) {
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString(), tenant_id: tenantId || 'unknown' },
      duration
    );
  }
}
```

### Consequences

**Positive**:
- Comprehensive monitoring capabilities
- Cost-effective open source solution
- Excellent Kubernetes integration
- Powerful query language and alerting
- Great visualization with Grafana
- Large community and ecosystem

**Negative**:
- Operational complexity to manage
- Storage and retention management
- Learning curve for PromQL
- High cardinality can cause performance issues

**Mitigation**:
- Managed Prometheus services where available
- Proper metric design and cardinality management
- Regular training on PromQL and best practices
- Automated backup and retention policies

---

## ADR-012: GitHub Actions for CI/CD

**Status**: Accepted  
**Date**: 2024-03-20  
**Deciders**: DevOps Team, Development Team

### Context

We need CI/CD pipeline for:
- Automated testing on pull requests
- Code quality checks and linting
- Security scanning
- Automated deployments
- Multi-environment promotion

### Alternatives Considered

1. **GitHub Actions**: Native GitHub integration, free tier
2. **GitLab CI**: Integrated with GitLab, powerful
3. **Jenkins**: Self-hosted, very flexible, complex
4. **CircleCI**: Cloud-based, good performance
5. **Azure DevOps**: Microsoft ecosystem, enterprise features

### Decision

Use **GitHub Actions** for CI/CD pipelines.

### Rationale

- **Integration**: Native GitHub integration
- **Cost**: Generous free tier for open source
- **Ecosystem**: Large marketplace of actions
- **Simplicity**: YAML-based, easy to understand
- **Performance**: Good performance and reliability
- **Security**: Built-in secret management
- **Matrix Builds**: Easy parallel testing

### Implementation Pattern

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Run tests
      run: pnpm test:ci
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Build Docker image
      run: |
        docker build -t tekup/flow-api:${{ github.sha }} .
        docker tag tekup/flow-api:${{ github.sha }} tekup/flow-api:latest
    
    - name: Push to registry
      if: github.ref == 'refs/heads/main'
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push tekup/flow-api:${{ github.sha }}
        docker push tekup/flow-api:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      uses: azure/k8s-deploy@v1
      with:
        manifests: |
          k8s/deployment.yaml
          k8s/service.yaml
        images: |
          tekup/flow-api:${{ github.sha }}
        kubeconfig: ${{ secrets.KUBE_CONFIG }}
```

### Consequences

**Positive**:
- Seamless GitHub integration
- Cost-effective for our use case
- Easy to set up and maintain
- Good performance and reliability
- Rich ecosystem of actions
- Built-in security features

**Negative**:
- GitHub vendor lock-in
- Limited customization compared to Jenkins
- Potential costs at scale
- Less advanced features than enterprise solutions

**Mitigation**:
- Keep pipeline definitions portable
- Monitor usage and costs
- Use self-hosted runners for sensitive workloads
- Regular evaluation of alternatives

---

## Decision Review Process

### Regular Review Schedule

- **Quarterly Reviews**: Assess current ADRs for relevance and effectiveness
- **Annual Deep Dive**: Comprehensive review of all architectural decisions
- **Triggered Reviews**: When significant issues arise with current decisions

### Review Criteria

1. **Performance**: Is the decision meeting performance requirements?
2. **Scalability**: Does it support our growth trajectory?
3. **Maintainability**: Is it easy to maintain and extend?
4. **Cost**: Is it cost-effective at our current scale?
5. **Team Satisfaction**: Are developers productive with this choice?
6. **Ecosystem**: Is the ecosystem healthy and evolving?

### Decision Evolution

When decisions need to change:

1. **Document Context**: Why is change needed?
2. **Evaluate Alternatives**: What are the current options?
3. **Migration Plan**: How will we transition?
4. **Timeline**: What's the implementation schedule?
5. **Success Metrics**: How will we measure success?

## Conclusion

These Technology Decision Records capture the key architectural decisions that shape the TekUp platform. They provide context for current choices and guidance for future decisions. Regular review and updates ensure these decisions remain relevant and effective as the platform evolves.

The decisions reflect a balance of:
- **Performance and Scalability**: Choices that support growth
- **Developer Experience**: Tools that enhance productivity
- **Operational Simplicity**: Solutions that are maintainable
- **Cost Effectiveness**: Efficient use of resources
- **Future Flexibility**: Avoiding lock-in where possible

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: April 2025  
**Maintained By**: TekUp Architecture Team
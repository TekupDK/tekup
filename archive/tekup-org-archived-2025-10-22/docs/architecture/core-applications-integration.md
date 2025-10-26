# Core Applications Integration Architecture

This document outlines the integration architecture between the three core applications: Flow API, Flow Web, and Voice Agent, and how they work together to provide a unified TekUp experience.

## System Overview

The TekUp core applications form an integrated ecosystem where each component serves a specific purpose while maintaining seamless communication with others.

```mermaid
graph TB
    subgraph "Client Layer"
        A[Flow Web - Next.js] 
        B[Voice Agent - Next.js]
        C[Mobile Apps]
        D[External Clients]
    end
    
    subgraph "API Gateway Layer"
        E[Flow API - NestJS]
        F[WebSocket Gateway]
        G[Voice Processing]
    end
    
    subgraph "Data Layer"
        H[PostgreSQL + RLS]
        I[Redis Cache]
        J[File Storage]
    end
    
    subgraph "External Services"
        K[Gemini Live API]
        L[OpenAI API]
        M[Stripe API]
        N[ConvertKit API]
    end
    
    A --> E
    A --> F
    B --> F
    B --> G
    C --> E
    D --> E
    
    E --> H
    E --> I
    F --> I
    G --> K
    E --> L
    E --> M
    E --> N
    
    F -.->|Real-time Events| A
    F -.->|Voice Commands| B
    G -.->|Voice Responses| B
```

## Application Roles and Responsibilities

### Flow API (Backend Core)
- **Primary Role**: Central API server and data orchestrator
- **Key Responsibilities**:
  - Multi-tenant data management with RLS
  - RESTful API endpoints for all operations
  - WebSocket gateway for real-time communication
  - Voice command processing and execution
  - External service integration management
  - Authentication and authorization
  - Metrics collection and monitoring

### Flow Web (Frontend Dashboard)
- **Primary Role**: Primary web interface for business users
- **Key Responsibilities**:
  - Lead management interface
  - Real-time dashboard updates
  - Tenant switching and management
  - User authentication and session management
  - Responsive design for all devices
  - Integration with voice commands

### Voice Agent (Voice Interface)
- **Primary Role**: Natural language voice interface
- **Key Responsibilities**:
  - Voice input/output processing
  - Natural language understanding
  - Voice command execution via WebSocket
  - Multi-language support (Danish/English)
  - Tenant-aware voice operations
  - Audio quality optimization

## Integration Patterns

### 1. REST API Integration

```mermaid
sequenceDiagram
    participant FW as Flow Web
    participant FA as Flow API
    participant DB as Database
    
    FW->>FA: GET /leads?status=NEW
    FA->>DB: SELECT leads WHERE status='NEW' AND tenant_id=?
    DB-->>FA: Lead records
    FA-->>FW: JSON response with leads
    
    FW->>FA: PATCH /leads/123/status
    FA->>DB: UPDATE leads SET status=? WHERE id=? AND tenant_id=?
    DB-->>FA: Update confirmation
    FA-->>FW: Updated lead object
```

### 2. WebSocket Real-time Communication

```mermaid
sequenceDiagram
    participant FW as Flow Web
    participant VA as Voice Agent
    participant WS as WebSocket Gateway
    participant FA as Flow API
    
    FW->>WS: Connect with tenant API key
    WS-->>FW: Connection established
    
    VA->>WS: Connect with tenant API key
    WS-->>VA: Connection established
    
    VA->>WS: execute_voice_command: get_leads
    WS->>FA: Process voice command
    FA-->>WS: Command result
    WS-->>VA: voice_command_response
    
    WS-->>FW: lead_event (if leads updated)
```

### 3. Voice Command Processing Flow

```mermaid
graph TB
    subgraph "Voice Agent"
        A[Audio Input] --> B[Gemini Live API]
        B --> C[Speech-to-Text]
        C --> D[Command Extraction]
        D --> E[WebSocket Client]
    end
    
    subgraph "Flow API"
        F[WebSocket Gateway] --> G[Command Validator]
        G --> H[Business Logic]
        H --> I[Database Operations]
        I --> J[Response Generator]
    end
    
    subgraph "Flow Web"
        K[WebSocket Client] --> L[State Management]
        L --> M[UI Updates]
    end
    
    E --> F
    J --> E
    J --> K
    
    style A fill:#e1f5fe
    style F fill:#f3e5f5
    style K fill:#e8f5e8
```

## Data Flow Architecture

### Multi-tenant Data Isolation

```mermaid
graph TB
    subgraph "Application Layer"
        A[Flow Web Request]
        B[Voice Agent Command]
        C[External API Call]
    end
    
    subgraph "API Layer"
        D[API Key Middleware]
        E[Tenant Context Service]
        F[RLS Enforcement]
    end
    
    subgraph "Database Layer"
        G[PostgreSQL with RLS]
        H[Tenant-specific Data]
        I[Audit Logs]
    end
    
    A --> D
    B --> D
    C --> D
    
    D --> E
    E --> F
    F --> G
    
    G --> H
    G --> I
    
    style D fill:#ffebee
    style E fill:#fff3e0
    style F fill:#e8f5e8
```

### Event-Driven Updates

```mermaid
graph LR
    subgraph "Event Sources"
        A[Lead Created]
        B[Status Changed]
        C[Voice Command]
        D[External Webhook]
    end
    
    subgraph "Event Processing"
        E[Event Bus]
        F[Event Handlers]
        G[State Updates]
    end
    
    subgraph "Event Consumers"
        H[Flow Web UI]
        I[Voice Agent]
        J[External Systems]
        K[Analytics]
    end
    
    A --> E
    B --> E
    C --> E
    D --> E
    
    E --> F
    F --> G
    
    G --> H
    G --> I
    G --> J
    G --> K
```

## Authentication and Security

### Multi-tenant Security Model

```mermaid
graph TB
    subgraph "Client Authentication"
        A[Flow Web Session]
        B[Voice Agent Token]
        C[API Key Header]
    end
    
    subgraph "API Security Layer"
        D[API Key Validation]
        E[Tenant Resolution]
        F[Permission Check]
        G[Rate Limiting]
    end
    
    subgraph "Data Security"
        H[Row Level Security]
        I[Tenant Isolation]
        J[Audit Logging]
    end
    
    A --> D
    B --> D
    C --> D
    
    D --> E
    E --> F
    F --> G
    
    G --> H
    H --> I
    I --> J
    
    style D fill:#ffcdd2
    style H fill:#c8e6c9
```

### Security Enforcement Points

1. **API Gateway Level**
   - API key validation
   - Rate limiting per tenant
   - Request/response logging

2. **Application Level**
   - Tenant context validation
   - Permission-based access control
   - Input sanitization and validation

3. **Database Level**
   - Row Level Security (RLS) policies
   - Encrypted sensitive data
   - Audit trail for all operations

## Performance Optimization

### Caching Strategy

```mermaid
graph TB
    subgraph "Client-side Caching"
        A[React Query Cache]
        B[Browser Storage]
        C[Service Worker]
    end
    
    subgraph "Server-side Caching"
        D[Redis Cache]
        E[Application Cache]
        F[Database Query Cache]
    end
    
    subgraph "CDN Caching"
        G[Static Assets]
        H[API Responses]
        I[Media Files]
    end
    
    A --> D
    B --> D
    C --> G
    
    D --> F
    E --> F
    
    G --> H
    H --> I
```

### Load Balancing and Scaling

```mermaid
graph TB
    subgraph "Load Balancers"
        A[Application Load Balancer]
        B[WebSocket Load Balancer]
    end
    
    subgraph "Application Instances"
        C[Flow API Instance 1]
        D[Flow API Instance 2]
        E[Flow API Instance N]
    end
    
    subgraph "Shared Resources"
        F[Redis Cluster]
        G[PostgreSQL Primary]
        H[PostgreSQL Replicas]
    end
    
    A --> C
    A --> D
    A --> E
    B --> C
    B --> D
    B --> E
    
    C --> F
    D --> F
    E --> F
    
    C --> G
    D --> G
    E --> G
    
    G --> H
```

## Monitoring and Observability

### Metrics Collection

```mermaid
graph TB
    subgraph "Application Metrics"
        A[Flow API Metrics]
        B[Flow Web Metrics]
        C[Voice Agent Metrics]
    end
    
    subgraph "Infrastructure Metrics"
        D[Server Metrics]
        E[Database Metrics]
        F[Network Metrics]
    end
    
    subgraph "Business Metrics"
        G[Lead Metrics]
        H[Voice Usage]
        I[Tenant Activity]
    end
    
    subgraph "Monitoring Stack"
        J[Prometheus]
        K[Grafana]
        L[AlertManager]
    end
    
    A --> J
    B --> J
    C --> J
    D --> J
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J
    
    J --> K
    J --> L
```

### Health Check Architecture

```mermaid
graph LR
    subgraph "Health Checks"
        A[Application Health]
        B[Database Health]
        C[External Service Health]
        D[WebSocket Health]
    end
    
    subgraph "Health Aggregation"
        E[Health Check Service]
        F[Status Dashboard]
        G[Alert System]
    end
    
    A --> E
    B --> E
    C --> E
    D --> E
    
    E --> F
    E --> G
```

## Deployment Architecture

### Container Orchestration

```mermaid
graph TB
    subgraph "Container Registry"
        A[Flow API Image]
        B[Flow Web Image]
        C[Voice Agent Image]
    end
    
    subgraph "Kubernetes Cluster"
        D[Flow API Pods]
        E[Flow Web Pods]
        F[Voice Agent Pods]
        G[Redis Pods]
        H[Ingress Controller]
    end
    
    subgraph "External Services"
        I[PostgreSQL RDS]
        J[CloudFront CDN]
        K[Load Balancer]
    end
    
    A --> D
    B --> E
    C --> F
    
    H --> D
    H --> E
    H --> F
    
    D --> G
    E --> G
    F --> G
    
    D --> I
    E --> J
    F --> K
```

### Environment Configuration

```mermaid
graph TB
    subgraph "Development"
        A[Local Docker Compose]
        B[Development Database]
        C[Mock External Services]
    end
    
    subgraph "Staging"
        D[Kubernetes Staging]
        E[Staging Database]
        F[Test External Services]
    end
    
    subgraph "Production"
        G[Kubernetes Production]
        H[Production Database]
        I[Live External Services]
    end
    
    A --> D
    D --> G
    
    B --> E
    E --> H
    
    C --> F
    F --> I
```

## Integration Testing Strategy

### End-to-End Testing Flow

```mermaid
sequenceDiagram
    participant Test as Test Suite
    participant FW as Flow Web
    participant FA as Flow API
    participant VA as Voice Agent
    participant DB as Database
    
    Test->>FW: Load application
    FW->>FA: Authenticate user
    FA->>DB: Validate credentials
    DB-->>FA: User data
    FA-->>FW: Authentication token
    
    Test->>VA: Start voice recording
    VA->>FA: Execute voice command
    FA->>DB: Process command
    DB-->>FA: Command result
    FA-->>VA: Voice response
    
    Test->>FW: Verify UI updates
    FW->>FA: Fetch updated data
    FA->>DB: Query data
    DB-->>FA: Updated records
    FA-->>FW: JSON response
    
    Test->>Test: Assert all expectations
```

### Testing Scenarios

1. **Cross-Application Communication**
   - Voice command execution updates Flow Web UI
   - Flow Web actions trigger voice notifications
   - Real-time synchronization between clients

2. **Multi-tenant Isolation**
   - Tenant A cannot access Tenant B data
   - Voice commands respect tenant boundaries
   - WebSocket events are tenant-scoped

3. **Error Handling**
   - Network failures and reconnection
   - Invalid voice commands
   - Database connection issues

4. **Performance Testing**
   - Concurrent user load testing
   - WebSocket connection limits
   - Voice processing latency

## Troubleshooting Guide

### Common Integration Issues

1. **WebSocket Connection Problems**
   ```bash
   # Check WebSocket endpoint
   curl -H "Upgrade: websocket" \
        -H "Connection: Upgrade" \
        -H "x-tenant-key: demo-key" \
        http://localhost:4000/events
   ```

2. **Voice Command Failures**
   ```bash
   # Test voice endpoint directly
   curl -X POST http://localhost:4000/voice/test \
        -H "x-tenant-key: demo-key" \
        -H "Content-Type: application/json" \
        -d '{"command": "get_leads"}'
   ```

3. **Database Connection Issues**
   ```bash
   # Check database connectivity
   psql $DATABASE_URL -c "SELECT 1;"
   ```

4. **Authentication Problems**
   ```bash
   # Validate API key
   curl -H "x-tenant-key: demo-key" \
        http://localhost:4000/health
   ```

### Debug Mode Configuration

```bash
# Enable debug logging for all applications
DEBUG=tekup:*
LOG_LEVEL=debug

# Flow API debug
FLOW_API_DEBUG=true

# Flow Web debug
NEXT_PUBLIC_DEBUG=true

# Voice Agent debug
NEXT_PUBLIC_VOICE_DEBUG=true
```

## Best Practices

### 1. API Design
- Use consistent REST conventions
- Implement proper error handling
- Version APIs appropriately
- Document all endpoints

### 2. Real-time Communication
- Handle connection failures gracefully
- Implement proper reconnection logic
- Use event throttling for high-frequency updates
- Maintain connection state properly

### 3. Security
- Validate all inputs
- Implement proper authentication
- Use HTTPS/WSS in production
- Log security events

### 4. Performance
- Implement caching strategies
- Use connection pooling
- Monitor resource usage
- Optimize database queries

### 5. Monitoring
- Implement comprehensive logging
- Set up proper alerting
- Monitor business metrics
- Track user experience metrics

This architecture ensures that the three core applications work together seamlessly while maintaining security, performance, and scalability requirements.
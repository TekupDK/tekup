# 🚀 Tekup Platform Architecture Overview

**Comprehensive Visual Guide to the Complete Tekup Ecosystem**

---

## 📊 Executive Summary

The Tekup Platform is a sophisticated **monorepo-based microservices architecture** with 7+ active projects, 150,000+ lines of code, and production deployments across multiple cloud providers. This document provides a complete visual breakdown of the system architecture, technology stack, and service interconnections.

**Key Metrics:**

- **7 Active Projects** (3 production, 1 web platform, 3 services)
- **150,000+ Lines of Code** (TypeScript, JavaScript, SQL)
- **700+ Source Files** across the monorepo
- **4 Production Services** with 99.9% uptime monitoring
- **Multi-tenant Architecture** supporting multiple organizations

---

## 🏗️ 1. Monorepo Structure

```mermaid
graph TB
    A[tekup/ <br/>Monorepo Root] --> B[apps/]
    A --> C[services/]
    A --> D[packages/]
    A --> E[docs/]
    A --> F[scripts/]
    A --> G[tekup-secrets/]

    B --> H[production/]
    B --> I[web/]
    B --> J[rendetalje/]

    H --> K[tekup-billy/]
    H --> L[tekup-database/]
    H --> M[tekup-vault/]

    I --> N[tekup-cloud-dashboard/]

    J --> O[services/]
    O --> P[backend-nestjs/]
    O --> Q[frontend-nextjs/]
    O --> R[database/]
    O --> S[mobile/]
    O --> T[calendar-mcp/]
    O --> U[shared/]

    C --> V[tekup-ai/]
    C --> W[tekup-gmail-services/]

    D --> X[shared-types/]
    D --> Y[shared-ui/]
    D --> Z[ai-llm/]
    D --> AA[ai-mcp/]

    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style H fill:#e8f5e8
    style J fill:#fff3e0
    style O fill:#fce4ec
```

### **Service Status Overview**

| Service                 | Status         | Version | Deployment     | Tech Stack                      |
| ----------------------- | -------------- | ------- | -------------- | ------------------------------- |
| **tekup-billy**         | ✅ Production  | v1.4.3  | Render.com     | TypeScript, Express, Redis      |
| **tekup-vault**         | ✅ Production  | v0.1.0  | Render.com     | TypeScript, Turborepo, pgvector |
| **tekup-database**      | ✅ Production  | v1.1.0  | Supabase       | Prisma, PostgreSQL              |
| **rendetalje-backend**  | ✅ Production  | v1.2.0  | Render.com     | NestJS, PostgreSQL, Redis       |
| **rendetalje-frontend** | ✅ Production  | v1.2.0  | Vercel         | Next.js, TypeScript             |
| **rendetalje-mobile**   | ✅ Production  | v1.0.0  | Expo Cloud     | React Native, Expo, TypeScript  |
| **calendar-mcp**        | ✅ Production  | v1.0.0  | Render.com     | Node.js, TypeScript             |

---

## 🔗 2. Service Architecture & Interconnections

```mermaid
graph LR
    %% External Systems
    A[External APIs] --> B[Billy.dk API]
    A --> C[OpenAI API]
    A --> D[GitHub API]

    %% Production Services
    E[tekup-billy<br/>MCP Server] --> F[Redis Cache]
    E --> G[Supabase DB]
    E --> B

    H[tekup-vault<br/>Knowledge Base] --> I[pgvector DB]
    H --> C
    H --> D

    %% Main Platform
    J[rendetalje-backend<br/>NestJS API] --> K[PostgreSQL]
    J --> F
    J --> G

    L[rendetalje-frontend<br/>Next.js] --> J

    M[rendetalje-mobile<br/>React Native] --> J

    N[calendar-mcp<br/>MCP Server] --> K

    %% Data Flow
    G -.->|Audit Logs| E
    G -.->|User Data| J
    I -.->|Knowledge| H

    %% Monitoring
    O[Sentry<br/>Error Tracking] --> P[All Services]
    Q[UptimeRobot<br/>Health Checks] --> R[Production URLs]

    style E fill:#e8f5e8
    style H fill:#e8f5e8
    style J fill:#fff3e0
    style L fill:#fff3e0
    style M fill:#fce4ec
```

### **API Endpoints & Ports**

| Service                 | Port        | Protocol   | Purpose      | Status      |
| ----------------------- | ----------- | ---------- | ------------ | ----------- |
| **rendetalje-backend**  | 3001        | HTTP/HTTPS | Main API     | ✅ Active   |
| **rendetalje-frontend** | 3002        | HTTP       | Development  | 📝 Reserved |
| **calendar-mcp**        | 3003        | HTTP       | Calendar API | ✅ Active   |
| **PostgreSQL**          | 5432        | TCP        | Database     | ✅ Active   |
| **Redis**               | 6379        | TCP        | Cache        | ✅ Active   |
| **Expo Metro**          | 8081        | HTTP       | Mobile Dev   | ✅ Active   |
| **Expo DevTools**       | 19000-19002 | HTTP       | Mobile Tools | ✅ Active   |

---

## 🛠️ 3. Technology Stack Breakdown

### **Frontend Layer**

```mermaid
graph TD
    A[Web Frontend] --> B[Next.js 14+]
    A --> C[React 18]
    A --> D[TypeScript 5.x]
    A --> E[Tailwind CSS]

    F[Mobile Frontend] --> G[React Native 0.72]
    F --> H[Expo SDK 49]
    F --> I[expo-router]
    F --> J[React Query]

    K[Shared UI] --> L[Component Library]
    K --> M[Design System]
    K --> N[State Management<br/>Zustand]

    style A fill:#e3f2fd
    style F fill:#f3e5f5
    style K fill:#fff3e0
```

### **Backend Layer**

```mermaid
graph TD
    A[API Layer] --> B[NestJS]
    A --> C[Express.js]
    A --> D[Fastify]

    E[Database Layer] --> F[Prisma ORM]
    E --> G[PostgreSQL 15]
    E --> H[Supabase]
    E --> I[pgvector]

    J[Cache Layer] --> K[Redis 7]
    J --> L[In-Memory Cache]

    M[External APIs] --> N[Billy.dk REST API]
    M --> O[OpenAI API]
    M --> P[GitHub API]

    Q[Authentication] --> R[JWT Tokens]
    Q --> S[Supabase Auth]

    style A fill:#e8f5e8
    style E fill:#fff3e0
    style J fill:#fce4ec
    style M fill:#ffebee
```

### **Development Tools**

```mermaid
graph TD
    A[Build Tools] --> B[Turborepo]
    A --> C[Vite]
    A --> D[Webpack]

    E[Testing] --> F[Jest]
    E --> G[Playwright]
    E --> H[React Testing Library]
    E --> I[Supertest]

    J[Code Quality] --> K[ESLint]
    J --> L[Prettier]
    J --> M[TypeScript Strict]

    N[Container] --> O[Docker]
    N --> P[Docker Compose]
    N --> Q[Alpine Linux]

    style A fill:#f3e5f5
    style E fill:#e1f5fe
    style J fill:#fff3e0
    style N fill:#e8f5e8
```

---

## 🚀 4. Deployment Architecture

### **Production Deployment**

```mermaid
graph TB
    %% Development
    A[Local Development] --> B[Docker Compose]
    B --> C[PostgreSQL]
    B --> D[Redis]
    B --> E[NestJS Backend]
    B --> F[Expo Dev Server]

    %% Staging
    G[GitHub Actions] --> H[CI/CD Pipeline]
    H --> I[Automated Tests]
    I --> J[Build & Deploy]

    %% Production
    K[Render.com] --> L[tekup-billy<br/>MCP Server]
    K --> M[tekup-vault<br/>API]
    K --> N[rendetalje-backend<br/>API]

    O[Vercel] --> P[rendetalje-frontend<br/>Next.js]

    Q[Supabase] --> R[PostgreSQL + pgvector]
    Q --> S[Authentication]
    Q --> T[Real-time]

    %% Monitoring
    U[Sentry] --> V[Error Tracking]
    W[UptimeRobot] --> X[Health Monitoring]

    style A fill:#fff3e0
    style K fill:#e8f5e8
    style O fill:#e8f5e8
    style Q fill:#e1f5fe
```

### **Environment Configuration**

| Environment     | Database      | Cache      | Monitoring           | Deployment          |
| --------------- | ------------- | ---------- | -------------------- | ------------------- |
| **Development** | PostgreSQL 15 | Redis 7    | Local Logging        | Docker Compose      |
| **Testing**     | Test Database | Test Redis | Jest Coverage        | GitHub Actions      |
| **Staging**     | Supabase      | Redis      | Sentry               | Render.com          |
| **Production**  | Supabase      | Redis      | Sentry + UptimeRobot | Render.com + Vercel |

---

## 🔄 5. Data Flow Architecture

### **Primary Data Flow**

```mermaid
graph LR
    %% User Entry Points
    A[Mobile App] --> B[Backend API]
    C[Web Frontend] --> B
    D[AI Assistants] --> E[MCP Servers]

    %% API Layer
    B --> F[Authentication]
    B --> G[Business Logic]
    B --> H[Data Access]

    %% Data Storage
    H --> I[PostgreSQL<br/>Primary DB]
    H --> J[Redis<br/>Cache Layer]
    H --> K[Supabase<br/>User Data]

    %% External Services
    E --> L[Billy.dk API<br/>Accounting]
    E --> M[OpenAI API<br/>Embeddings]
    E --> N[GitHub API<br/>Code Sync]

    %% Knowledge Layer
    M --> O[pgvector<br/>Semantic Search]
    N --> O

    %% Monitoring & Logging
    B --> P[Sentry<br/>Error Tracking]
    I --> Q[Application Logs<br/>Supabase]
    P --> Q

    style A fill:#fce4ec
    style C fill:#e3f2fd
    style D fill:#f3e5f5
    style I fill:#fff3e0
    style J fill:#ffebee
    style K fill:#e1f5fe
    style O fill:#e8f5e8
```

### **Authentication Flow**

```mermaid
sequenceDiagram
    participant M as Mobile App
    participant B as Backend API
    participant S as Supabase Auth
    participant DB as Database

    M->>B: Login Request
    B->>S: Verify Credentials
    S->>DB: Check User Record
    DB-->>S: User Data
    S-->>B: JWT Token
    B-->>M: Auth Success + Token
```

### **Job Processing Flow** (Rendetalje)

```mermaid
sequenceDiagram
    participant C as Customer
    participant M as Mobile App
    participant B as Backend API
    participant DB as Database
    participant Billy as Billy.dk API

    C->>M: Create Job Request
    M->>B: Submit Job Data
    B->>DB: Store Job Record
    B->>Billy: Create Invoice
    Billy-->>B: Invoice Created
    B-->>M: Job Confirmed
    M-->>C: Confirmation
```

---

## 📊 6. Monitoring & Logging Architecture

### **Monitoring Stack**

```mermaid
graph TD
    A[Application Layer] --> B[Sentry<br/>Error Tracking]
    A --> C[UptimeRobot<br/>Health Checks]
    A --> D[Application Logs<br/>Supabase]

    E[Infrastructure] --> F[Render.com<br/>Metrics]
    E --> G[Supabase<br/>Database Logs]
    E --> H[Docker<br/>Container Logs]

    I[Performance] --> J[API Response Times]
    I --> K[Database Query Performance]
    I --> L[Cache Hit Rates]

    M[Business Metrics] --> N[Job Completion Rates]
    M --> O[Revenue Tracking]
    M --> P[User Engagement]

    B --> Q[Alert System]
    C --> Q
    D --> Q

    style A fill:#e3f2fd
    style E fill:#fff3e0
    style I fill:#e8f5e8
    style M fill:#fce4ec
    style Q fill:#ffebee
```

### **Monitoring Endpoints**

| Service                | Health Check URL                                 | Status       | Response Time |
| ---------------------- | ------------------------------------------------ | ------------ | ------------- |
| **tekup-billy**        | `https://tekup-billy.onrender.com/health`        | ✅ Up        | <200ms        |
| **tekup-vault**        | `https://tekupvault-api.onrender.com/health`     | ✅ Up        | <300ms        |
| **rendetalje-backend** | `https://renos-backend.onrender.com/health`      | ✅ Up        | <150ms        |
| **calendar-mcp**       | `https://renos-calendar-mcp.onrender.com/health` | ⏳ Preparing | -             |

---

## 📱 7. Mobile App Integration Points

### **Mobile Architecture**

```mermaid
graph TD
    A[React Native<br/>Mobile App] --> B[Expo Router<br/>Navigation]
    A --> C[React Query<br/>Data Fetching]
    A --> D[AsyncStorage<br/>Offline Data]

    E[Camera Module] --> F[Photo Capture]
    E --> G[Image Processing]
    E --> H[Offline Storage]

    I[Location Services] --> J[GPS Tracking]
    I --> K[Map Integration]
    I --> L[Route Optimization]

    M[Real-time Features] --> N[Push Notifications]
    M --> O[Live Updates]
    M --> P[Background Sync]

    Q[Backend Integration] --> R[REST API]
    Q --> S[WebSocket<br/>Real-time]
    Q --> T[File Upload]

    style A fill:#fce4ec
    style E fill:#e1f5fe
    style I fill:#f3e5f5
    style M fill:#fff3e0
    style Q fill:#e8f5e8
```

### **Mobile Development Stack**

| Component       | Technology        | Version | Purpose                 |
| --------------- | ----------------- | ------- | ----------------------- |
| **Framework**   | React Native      | 0.72.10 | Cross-platform mobile   |
| **Development** | Expo SDK          | 49.0.0  | Development tools       |
| **Navigation**  | expo-router       | 2.0.0   | File-based routing      |
| **State**       | Zustand           | 4.4.0   | Global state management |
| **Data**        | React Query       | 5.0.0   | Server state management |
| **Storage**     | AsyncStorage      | 1.18.2  | Local data persistence  |
| **Maps**        | React Native Maps | 1.7.1   | GPS and mapping         |
| **Camera**      | expo-camera       | 13.4.0  | Photo capture           |

---

## 🔐 8. Security Architecture

### **Authentication & Authorization**

```mermaid
graph TD
    A[User Request] --> B[JWT Validation]
    B --> C[Role-based Access]
    C --> D[Organization Scoping]

    E[API Keys] --> F[MCP Authentication]
    E --> G[Service-to-Service Auth]

    H[Database Security] --> I[Row Level Security]
    H --> J[Encrypted Secrets]
    H --> K[Audit Logging]

    L[Network Security] --> M[HTTPS Only]
    L --> N[CORS Policies]
    L --> O[Rate Limiting]

    style A fill:#e3f2fd
    style E fill:#fff3e0
    style H fill:#e8f5e8
    style L fill:#fce4ec
```

### **Security Measures**

| Layer              | Implementation                                | Status    |
| ------------------ | --------------------------------------------- | --------- |
| **Transport**      | HTTPS/TLS 1.3                                 | ✅ Active |
| **Authentication** | JWT + Supabase Auth                           | ✅ Active |
| **Authorization**  | Role-based (owner, admin, employee, customer) | ✅ Active |
| **Database**       | Row Level Security (RLS)                      | ✅ Active |
| **API**            | Rate limiting (100 req/15min)                 | ✅ Active |
| **Secrets**        | git-crypt encryption                          | ✅ Active |
| **Audit**          | Comprehensive logging                         | ✅ Active |

---

## 📈 9. Performance & Scalability

### **Caching Strategy**

```mermaid
graph TD
    A[Request] --> B[API Gateway]
    B --> C[Cache Check]

    C -->|Cache Hit| D[Return Cached Data]
    C -->|Cache Miss| E[Database Query]

    E --> F[Process Data]
    F --> G[Cache Result]
    G --> H[Return Fresh Data]

    I[Cache Invalidation] --> J[Update Cache]
    J --> K[Propagate Changes]

    style C fill:#e8f5e8
    style E fill:#fff3e0
    style G fill:#fce4ec
```

### **Scaling Considerations**

| Component         | Current Scale   | Max Scale          | Bottleneck           |
| ----------------- | --------------- | ------------------ | -------------------- |
| **API Layer**     | Single instance | 10+ instances      | Database connections |
| **Database**      | PostgreSQL 15   | Read replicas      | Connection pooling   |
| **Cache**         | Redis single    | Redis cluster      | Memory usage         |
| **File Storage**  | Local uploads   | CDN integration    | Storage limits       |
| **AI Processing** | OpenAI API      | Multiple providers | API rate limits      |

---

## 🔄 10. Development Workflow

### **Git Workflow**

```mermaid
graph TD
    A[Feature Branch] --> B[Development]
    B --> C[Testing]
    C --> D[Code Review]
    D --> E[Main Branch]

    F[Hotfix Branch] --> G[Emergency Fix]
    G --> E

    E --> H[CI/CD Pipeline]
    H --> I[Automated Tests]
    I --> J[Build & Deploy]

    K[Monitoring] --> L[Performance]
    K --> M[Error Tracking]
    K --> N[Uptime Checks]

    style A fill:#fff3e0
    style F fill:#ffebee
    style H fill:#e8f5e8
    style K fill:#e1f5fe
```

### **Development Tools**

| Category            | Tools                        | Purpose                 |
| ------------------- | ---------------------------- | ----------------------- |
| **Version Control** | Git, GitHub                  | Code management         |
| **CI/CD**           | GitHub Actions               | Automated deployment    |
| **Testing**         | Jest, Playwright, Supertest  | Quality assurance       |
| **Code Quality**    | ESLint, Prettier, TypeScript | Code standards          |
| **Documentation**   | Markdown, Mermaid            | Technical docs          |
| **Container**       | Docker, Docker Compose       | Development environment |

---

## 📋 11. Service Status Dashboard

### **Production Services Health**

| Service                | URL                                     | Status       | Last Check       | Response Time |
| ---------------------- | --------------------------------------- | ------------ | ---------------- | ------------- |
| **Tekup-Billy MCP**    | https://tekup-billy.onrender.com        | 🟢 Up        | 2025-10-25 10:18 | 145ms         |
| **TekupVault API**     | https://tekupvault-api.onrender.com     | 🟢 Up        | 2025-10-25 10:18 | 234ms         |
| **Rendetalje Backend** | https://renos-backend.onrender.com      | 🟢 Up        | 2025-10-25 10:18 | 123ms         |
| **Calendar MCP**       | https://renos-calendar-mcp.onrender.com | 🟡 Preparing | -                | -             |

### **Development Services Health**

| Service         | Port | Status     | Docker Container       | Health     |
| --------------- | ---- | ---------- | ---------------------- | ---------- |
| **Backend API** | 3001 | 🟢 Running | rendetalje-backend     | ✅ Healthy |
| **PostgreSQL**  | 5432 | 🟢 Running | rendetalje-postgres    | ✅ Healthy |
| **Redis**       | 6379 | 🟢 Running | rendetalje-redis       | ✅ Healthy |
| **Mobile Expo** | 8081 | 🟢 Running | rendetalje-mobile-expo | ✅ Healthy |

---

## 🎯 12. Key Integration Points

### **External API Integrations**

| Service          | Purpose                | Status    | Rate Limits   |
| ---------------- | ---------------------- | --------- | ------------- |
| **Billy.dk API** | Accounting integration | ✅ Active | 1000 req/hour |
| **OpenAI API**   | AI embeddings & search | ✅ Active | Based on tier |
| **GitHub API**   | Code synchronization   | ✅ Active | 5000 req/hour |
| **Supabase**     | Database & auth        | ✅ Active | Based on plan |

### **Internal Service Communication**

| From             | To            | Protocol   | Purpose          |
| ---------------- | ------------- | ---------- | ---------------- |
| **Mobile App**   | Backend API   | REST/HTTPS | CRUD operations  |
| **Web Frontend** | Backend API   | REST/HTTPS | User interface   |
| **MCP Servers**  | External APIs | REST/HTTPS | AI agent tools   |
| **Backend**      | Database      | PostgreSQL | Data persistence |
| **Backend**      | Redis         | TCP        | Caching layer    |

---

## 📚 13. Documentation Architecture

### **Documentation Structure**

```mermaid
graph TD
    A[Root README.md] --> B[Project Overview]
    A --> C[Quick Start]
    A --> D[Architecture]

    E[Service Docs] --> F[tekup-billy/]
    E --> G[tekup-vault/]
    E --> H[rendetalje/]
    E --> I[Production/]

    J[Technical Docs] --> K[API Reference]
    J --> L[Database Schema]
    J --> M[Deployment Guides]
    J --> N[Monitoring Setup]

    O[Development] --> P[Contributing]
    O --> Q[Testing Guide]
    O --> R[Troubleshooting]

    style A fill:#e1f5fe
    style E fill:#e8f5e8
    style J fill:#fff3e0
    style O fill:#fce4ec
```

---

## 🚀 14. Future Architecture Evolution

### **Phase 1: Current State** ✅

- Monorepo consolidation complete
- Production services deployed
- Mobile app development
- Monitoring implementation

### **Phase 2: Enhancement** 🔄

- Service mesh implementation
- Advanced caching strategies
- Real-time collaboration
- Enhanced security

### **Phase 3: Scale** 📈

- Microservices migration
- Event-driven architecture
- Advanced analytics
- Multi-region deployment

---

## 📞 15. Support & Maintenance

### **Contact Information**

- **Technical Lead**: Jonas Abde
- **Organization**: TekupDK
- **Repository**: https://github.com/TekupDK/tekup
- **Production Support**: Render.com dashboard + Sentry alerts

### **Maintenance Schedule**

- **Daily**: Health checks, log monitoring
- **Weekly**: Performance review, dependency updates
- **Monthly**: Security audits, capacity planning
- **Quarterly**: Architecture review, technology updates

---

**Document Status**: ✅ Complete and Current  
**Last Updated**: October 25, 2025  
**Next Review**: When major architectural changes occur

---

_This comprehensive architecture overview provides a complete visual guide to the Tekup platform ecosystem, from development workflow to production deployment._

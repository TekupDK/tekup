# Tekup 2.0 - API Contracts og OpenAPI Specifikationer

Dette dokument indeholder komplette API kontrakter for alle Tekup 2.0 applikationer.

Relaterede dokumenter:
- `docs/TEKUP_2_0_PRODUCT_SPEC.md`
- `docs/TEKUP_2_0_WIREFRAMES.md`

---

## 1) Unified Console API

### 1.1 Tenant Management
```yaml
# /api/v1/tenants
GET /api/v1/tenants
  - List all tenants
  - Query params: page, limit, search, status
  - Response: { tenants: [], pagination: {} }

POST /api/v1/tenants
  - Create new tenant
  - Body: { name, domain, plan, settings }
  - Response: { tenant: {}, apiKey: "" }

GET /api/v1/tenants/{tenantId}
  - Get tenant details
  - Response: { tenant: {}, users: [], settings: {} }

PUT /api/v1/tenants/{tenantId}
  - Update tenant
  - Body: { name, domain, plan, settings }
  - Response: { tenant: {} }

DELETE /api/v1/tenants/{tenantId}
  - Delete tenant (soft delete)
  - Response: { success: true }
```

### 1.2 User Management
```yaml
# /api/v1/tenants/{tenantId}/users
GET /api/v1/tenants/{tenantId}/users
  - List tenant users
  - Query params: page, limit, role, status
  - Response: { users: [], pagination: {} }

POST /api/v1/tenants/{tenantId}/users
  - Create user
  - Body: { email, name, role, permissions }
  - Response: { user: {}, password: "" }

PUT /api/v1/tenants/{tenantId}/users/{userId}
  - Update user
  - Body: { name, role, permissions, status }
  - Response: { user: {} }

DELETE /api/v1/tenants/{tenantId}/users/{userId}
  - Delete user
  - Response: { success: true }
```

### 1.3 Agent Management
```yaml
# /api/v1/tenants/{tenantId}/agents
GET /api/v1/tenants/{tenantId}/agents
  - List tenant agents
  - Query params: status, type, performance
  - Response: { agents: [], performance: {} }

POST /api/v1/tenants/{tenantId}/agents
  - Create agent
  - Body: { name, type, config, tools, policies }
  - Response: { agent: {}, deployment: {} }

PUT /api/v1/tenants/{tenantId}/agents/{agentId}
  - Update agent
  - Body: { config, tools, policies, status }
  - Response: { agent: {} }

POST /api/v1/tenants/{tenantId}/agents/{agentId}/deploy
  - Deploy agent
  - Response: { deployment: {}, status: "" }

POST /api/v1/tenants/{tenantId}/agents/{agentId}/undeploy
  - Undeploy agent
  - Response: { success: true }
```

---

## 2) Jarvis 2.0 API

### 2.1 Conversation Management
```yaml
# /api/v1/jarvis/conversations
GET /api/v1/jarvis/conversations
  - List conversations
  - Query params: status, participants, dateRange
  - Response: { conversations: [], pagination: {} }

POST /api/v1/jarvis/conversations
  - Start new conversation
  - Body: { participants: [], context: {}, goal: "" }
  - Response: { conversation: {}, sessionId: "" }

GET /api/v1/jarvis/conversations/{conversationId}
  - Get conversation details
  - Response: { conversation: {}, messages: [], participants: [] }

POST /api/v1/jarvis/conversations/{conversationId}/messages
  - Send message to conversation
  - Body: { content: "", type: "", metadata: {} }
  - Response: { message: {}, response: {} }

POST /api/v1/jarvis/conversations/{conversationId}/steer
  - Real-time steering
  - Body: { action: "", instruction: "", context: {} }
  - Response: { success: true, result: {} }
```

### 2.2 Agent Coordination
```yaml
# /api/v1/jarvis/coordination
POST /api/v1/jarvis/coordination/workflows
  - Start multi-agent workflow
  - Body: { workflowId: "", context: {}, participants: [] }
  - Response: { workflow: {}, executionId: "" }

GET /api/v1/jarvis/coordination/workflows/{executionId}
  - Get workflow status
  - Response: { status: "", progress: {}, steps: [] }

POST /api/v1/jarvis/coordination/workflows/{executionId}/steer
  - Steer workflow execution
  - Body: { action: "", instruction: "", stepId: "" }
  - Response: { success: true, result: {} }

GET /api/v1/jarvis/coordination/msg-hub
  - Get MsgHub status
  - Response: { status: "", channels: [], participants: [] }
```

### 2.3 Tools & Skills
```yaml
# /api/v1/jarvis/tools
GET /api/v1/jarvis/tools
  - List available tools
  - Query params: category, status, tenant
  - Response: { tools: [], categories: [] }

POST /api/v1/jarvis/tools
  - Register new tool
  - Body: { name: "", description: "", schema: {}, handler: "" }
  - Response: { tool: {}, registration: {} }

POST /api/v1/jarvis/tools/{toolId}/execute
  - Execute tool
  - Body: { parameters: {}, context: {} }
  - Response: { result: {}, execution: {} }

GET /api/v1/jarvis/tools/{toolId}/usage
  - Get tool usage statistics
  - Query params: dateRange, tenant
  - Response: { usage: {}, performance: {} }
```

---

## 3) Lead Platform API

### 3.1 Lead Management
```yaml
# /api/v1/leads
GET /api/v1/leads
  - List leads
  - Query params: status, source, score, dateRange, page, limit
  - Response: { leads: [], pagination: {}, analytics: {} }

POST /api/v1/leads
  - Create lead
  - Body: { name: "", email: "", company: "", source: "", data: {} }
  - Response: { lead: {}, score: 0, recommendations: [] }

GET /api/v1/leads/{leadId}
  - Get lead details
  - Response: { lead: {}, activities: [], score: 0, ai: {} }

PUT /api/v1/leads/{leadId}
  - Update lead
  - Body: { name: "", email: "", company: "", status: "", data: {} }
  - Response: { lead: {} }

POST /api/v1/leads/{leadId}/qualify
  - AI qualification
  - Body: { criteria: {}, context: {} }
  - Response: { score: 0, reasoning: "", recommendations: [] }

POST /api/v1/leads/{leadId}/convert
  - Convert lead to deal
  - Body: { dealData: {}, crmMapping: {} }
  - Response: { deal: {}, crmId: "" }
```

### 3.2 Campaign Management
```yaml
# /api/v1/campaigns
GET /api/v1/campaigns
  - List campaigns
  - Query params: status, type, dateRange
  - Response: { campaigns: [], pagination: {} }

POST /api/v1/campaigns
  - Create campaign
  - Body: { name: "", type: "", target: {}, content: {}, schedule: {} }
  - Response: { campaign: {}, execution: {} }

GET /api/v1/campaigns/{campaignId}
  - Get campaign details
  - Response: { campaign: {}, performance: {}, leads: [] }

POST /api/v1/campaigns/{campaignId}/execute
  - Execute campaign
  - Body: { schedule: "", target: {} }
  - Response: { execution: {}, status: "" }

GET /api/v1/campaigns/{campaignId}/performance
  - Get campaign performance
  - Query params: dateRange, metrics
  - Response: { performance: {}, analytics: {} }
```

---

## 4) CRM API

### 4.1 Deal Management
```yaml
# /api/v1/deals
GET /api/v1/deals
  - List deals
  - Query params: stage, owner, value, dateRange, page, limit
  - Response: { deals: [], pagination: {}, forecast: {} }

POST /api/v1/deals
  - Create deal
  - Body: { name: "", value: 0, stage: "", owner: "", contact: "", company: "" }
  - Response: { deal: {}, ai: {} }

GET /api/v1/deals/{dealId}
  - Get deal details
  - Response: { deal: {}, activities: [], ai: {}, forecast: {} }

PUT /api/v1/deals/{dealId}
  - Update deal
  - Body: { name: "", value: 0, stage: "", owner: "", data: {} }
  - Response: { deal: {} }

POST /api/v1/deals/{dealId}/advance
  - Advance deal stage
  - Body: { nextStage: "", reason: "", data: {} }
  - Response: { deal: {}, ai: {} }

POST /api/v1/deals/{dealId}/close
  - Close deal
  - Body: { outcome: "", value: 0, reason: "", data: {} }
  - Response: { deal: {}, invoice: {} }
```

### 4.2 Contact Management
```yaml
# /api/v1/contacts
GET /api/v1/contacts
  - List contacts
  - Query params: company, role, status, page, limit
  - Response: { contacts: [], pagination: {} }

POST /api/v1/contacts
  - Create contact
  - Body: { name: "", email: "", phone: "", company: "", role: "", data: {} }
  - Response: { contact: {}, ai: {} }

GET /api/v1/contacts/{contactId}
  - Get contact details
  - Response: { contact: {}, activities: [], deals: [], ai: {} }

PUT /api/v1/contacts/{contactId}
  - Update contact
  - Body: { name: "", email: "", phone: "", role: "", data: {} }
  - Response: { contact: {} }

POST /api/v1/contacts/{contactId}/enrich
  - AI enrichment
  - Body: { sources: [], fields: [] }
  - Response: { contact: {}, enrichment: {} }
```

---

## 5) Workflow Engine API

### 5.1 Flow Management
```yaml
# /api/v1/workflows
GET /api/v1/workflows
  - List workflows
  - Query params: status, category, owner, page, limit
  - Response: { workflows: [], pagination: {} }

POST /api/v1/workflows
  - Create workflow
  - Body: { name: "", description: "", definition: {}, triggers: [] }
  - Response: { workflow: {}, validation: {} }

GET /api/v1/workflows/{workflowId}
  - Get workflow details
  - Response: { workflow: {}, runs: [], performance: {} }

PUT /api/v1/workflows/{workflowId}
  - Update workflow
  - Body: { name: "", description: "", definition: {}, triggers: [] }
  - Response: { workflow: {} }

POST /api/v1/workflows/{workflowId}/deploy
  - Deploy workflow
  - Body: { environment: "", settings: {} }
  - Response: { deployment: {}, status: "" }
```

### 5.2 Flow Execution
```yaml
# /api/v1/workflows/{workflowId}/runs
GET /api/v1/workflows/{workflowId}/runs
  - List workflow runs
  - Query params: status, dateRange, page, limit
  - Response: { runs: [], pagination: {} }

POST /api/v1/workflows/{workflowId}/runs
  - Start workflow run
  - Body: { input: {}, context: {}, priority: "" }
  - Response: { run: {}, executionId: "" }

GET /api/v1/workflows/{workflowId}/runs/{runId}
  - Get run details
  - Response: { run: {}, steps: [], logs: [] }

POST /api/v1/workflows/{workflowId}/runs/{runId}/pause
  - Pause run
  - Response: { success: true }

POST /api/v1/workflows/{workflowId}/runs/{runId}/resume
  - Resume run
  - Response: { success: true }

POST /api/v1/workflows/{workflowId}/runs/{runId}/cancel
  - Cancel run
  - Response: { success: true }
```

---

## 6) Secure Platform API

### 6.1 Compliance Management
```yaml
# /api/v1/compliance
GET /api/v1/compliance/overview
  - Get compliance overview
  - Response: { status: "", risks: [], controls: [], evidence: {} }

GET /api/v1/compliance/controls
  - List compliance controls
  - Query params: category, status, priority
  - Response: { controls: [], categories: [] }

POST /api/v1/compliance/controls
  - Create control
  - Body: { name: "", description: "", category: "", requirements: [] }
  - Response: { control: {} }

GET /api/v1/compliance/controls/{controlId}
  - Get control details
  - Response: { control: {}, evidence: [], tests: [] }

POST /api/v1/compliance/controls/{controlId}/test
  - Test control
  - Body: { testType: "", parameters: {} }
  - Response: { test: {}, result: {} }
```

### 6.2 Risk Management
```yaml
# /api/v1/risks
GET /api/v1/risks
  - List risks
  - Query params: category, severity, status, page, limit
  - Response: { risks: [], pagination: {} }

POST /api/v1/risks
  - Create risk
  - Body: { name: "", description: "", category: "", severity: "", impact: "" }
  - Response: { risk: {} }

GET /api/v1/risks/{riskId}
  - Get risk details
  - Response: { risk: {}, mitigations: [], assessments: [] }

PUT /api/v1/risks/{riskId}
  - Update risk
  - Body: { name: "", description: "", severity: "", status: "" }
  - Response: { risk: {} }

POST /api/v1/risks/{riskId}/assess
  - Assess risk
  - Body: { assessment: {}, criteria: {} }
  - Response: { assessment: {}, score: 0 }
```

---

## 7) Inbox AI API

### 7.1 Document Processing
```yaml
# /api/v1/documents
GET /api/v1/documents
  - List documents
  - Query params: status, type, dateRange, page, limit
  - Response: { documents: [], pagination: {} }

POST /api/v1/documents
  - Upload document
  - Body: { file: "", metadata: {}, processing: {} }
  - Response: { document: {}, processing: {} }

GET /api/v1/documents/{documentId}
  - Get document details
  - Response: { document: {}, content: {}, analysis: {} }

POST /api/v1/documents/{documentId}/analyze
  - Analyze document
  - Body: { analysisType: "", parameters: {} }
  - Response: { analysis: {}, results: {} }

POST /api/v1/documents/{documentId}/classify
  - Classify document
  - Body: { categories: [], confidence: 0 }
  - Response: { classification: {}, confidence: 0 }
```

### 7.2 Email Processing
```yaml
# /api/v1/emails
GET /api/v1/emails
  - List emails
  - Query params: folder, status, dateRange, page, limit
  - Response: { emails: [], pagination: {} }

POST /api/v1/emails
  - Process email
  - Body: { email: "", processing: {} }
  - Response: { email: {}, analysis: {} }

GET /api/v1/emails/{emailId}
  - Get email details
  - Response: { email: {}, analysis: {}, attachments: [] }

POST /api/v1/emails/{emailId}/route
  - Route email
  - Body: { destination: "", rules: {} }
  - Response: { routing: {}, destination: {} }
```

---

## 8) Voice Agent API

### 8.1 Call Management
```yaml
# /api/v1/calls
GET /api/v1/calls
  - List calls
  - Query params: status, dateRange, duration, page, limit
  - Response: { calls: [], pagination: {} }

POST /api/v1/calls
  - Start call
  - Body: { number: "", flow: "", context: {} }
  - Response: { call: {}, sessionId: "" }

GET /api/v1/calls/{callId}
  - Get call details
  - Response: { call: {}, transcript: [], analysis: {} }

POST /api/v1/calls/{callId}/transfer
  - Transfer call
  - Body: { destination: "", reason: "" }
  - Response: { transfer: {}, status: "" }

POST /api/v1/calls/{callId}/end
  - End call
  - Body: { reason: "", summary: "" }
  - Response: { call: {}, summary: {} }
```

### 8.2 Flow Management
```yaml
# /api/v1/flows
GET /api/v1/flows
  - List call flows
  - Query params: status, category, page, limit
  - Response: { flows: [], pagination: {} }

POST /api/v1/flows
  - Create call flow
  - Body: { name: "", description: "", definition: {}, triggers: [] }
  - Response: { flow: {}, validation: {} }

GET /api/v1/flows/{flowId}
  - Get flow details
  - Response: { flow: {}, usage: {}, performance: {} }

PUT /api/v1/flows/{flowId}
  - Update flow
  - Body: { name: "", description: "", definition: {} }
  - Response: { flow: {} }
```

---

## 9) Industry Suites API

### 9.1 RendetaljeOS API
```yaml
# /api/v1/rendetalje/bookings
GET /api/v1/rendetalje/bookings
  - List bookings
  - Query params: date, status, customer, page, limit
  - Response: { bookings: [], pagination: {} }

POST /api/v1/rendetalje/bookings
  - Create booking
  - Body: { customer: "", address: "", services: [], date: "", duration: 0 }
  - Response: { booking: {}, pricing: {} }

GET /api/v1/rendetalje/bookings/{bookingId}
  - Get booking details
  - Response: { booking: {}, pricing: {}, schedule: {} }

POST /api/v1/rendetalje/bookings/{bookingId}/price
  - Calculate pricing
  - Body: { services: [], area: 0, complexity: "" }
  - Response: { pricing: {}, breakdown: {} }

POST /api/v1/rendetalje/bookings/{bookingId}/schedule
  - Schedule booking
  - Body: { date: "", time: "", cleaners: [] }
  - Response: { schedule: {}, optimization: {} }
```

### 9.2 FoodTruckOS API
```yaml
# /api/v1/foodtruck/routes
GET /api/v1/foodtruck/routes
  - List routes
  - Query params: date, status, revenue, page, limit
  - Response: { routes: [], pagination: {} }

POST /api/v1/foodtruck/routes
  - Create route
  - Body: { events: [], truck: "", date: "", optimization: {} }
  - Response: { route: {}, optimization: {} }

GET /api/v1/foodtruck/routes/{routeId}
  - Get route details
  - Response: { route: {}, events: [], optimization: {} }

POST /api/v1/foodtruck/routes/{routeId}/optimize
  - Optimize route
  - Body: { criteria: [], constraints: {} }
  - Response: { optimization: {}, savings: {} }
```

---

## 10) Mobile API

### 10.1 Task Management
```yaml
# /api/v1/mobile/tasks
GET /api/v1/mobile/tasks
  - List user tasks
  - Query params: status, date, priority, page, limit
  - Response: { tasks: [], pagination: {} }

POST /api/v1/mobile/tasks
  - Create task
  - Body: { title: "", description: "", location: "", dueDate: "" }
  - Response: { task: {} }

GET /api/v1/mobile/tasks/{taskId}
  - Get task details
  - Response: { task: {}, location: {}, attachments: [] }

POST /api/v1/mobile/tasks/{taskId}/checkin
  - Check in to task
  - Body: { location: "", timestamp: "", notes: "" }
  - Response: { checkin: {}, status: "" }

POST /api/v1/mobile/tasks/{taskId}/complete
  - Complete task
  - Body: { completion: {}, photos: [], notes: "" }
  - Response: { completion: {}, status: "" }
```

### 10.2 Offline Sync
```yaml
# /api/v1/mobile/sync
POST /api/v1/mobile/sync/upload
  - Upload offline data
  - Body: { data: [], timestamp: "", deviceId: "" }
  - Response: { sync: {}, conflicts: [] }

GET /api/v1/mobile/sync/download
  - Download sync data
  - Query params: lastSync, deviceId
  - Response: { data: [], timestamp: "" }

POST /api/v1/mobile/sync/resolve
  - Resolve sync conflicts
  - Body: { conflicts: [], resolution: {} }
  - Response: { resolution: {}, status: "" }
```

---

## 11) WebSocket Events

### 11.1 Real-time Updates
```yaml
# WebSocket Events
ws://api.tekup.dk/v1/events
  - Authentication: Bearer token
  - Events:
    - tenant.updated
    - user.created
    - agent.status.changed
    - workflow.started
    - workflow.completed
    - lead.created
    - deal.updated
    - call.started
    - call.ended
    - document.processed
    - compliance.check.completed
```

### 11.2 Agent Communication
```yaml
# Agent WebSocket
ws://api.tekup.dk/v1/agents/{agentId}/stream
  - Authentication: Agent token
  - Events:
    - message.received
    - tool.executed
    - status.changed
    - error.occurred
    - steering.instruction
```

---

## 12) Authentication & Authorization

### 12.1 Authentication
```yaml
# Authentication endpoints
POST /api/v1/auth/login
  - Login user
  - Body: { email: "", password: "" }
  - Response: { token: "", refreshToken: "", user: {} }

POST /api/v1/auth/refresh
  - Refresh token
  - Body: { refreshToken: "" }
  - Response: { token: "", refreshToken: "" }

POST /api/v1/auth/logout
  - Logout user
  - Body: { token: "" }
  - Response: { success: true }
```

### 12.2 Authorization
```yaml
# Role-based access control
GET /api/v1/auth/permissions
  - Get user permissions
  - Response: { permissions: [], roles: [] }

POST /api/v1/auth/check
  - Check permission
  - Body: { resource: "", action: "" }
  - Response: { allowed: true, reason: "" }
```

---

## 13) Error Handling

### 13.1 Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "timestamp": "2024-01-20T14:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### 13.2 HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Validation Error
- **429**: Rate Limited
- **500**: Internal Server Error

---

## 14) Rate Limiting

### 14.1 Rate Limits
```yaml
# Rate limiting per endpoint
/api/v1/leads: 1000 requests/hour
/api/v1/deals: 500 requests/hour
/api/v1/jarvis/conversations: 100 requests/hour
/api/v1/workflows: 200 requests/hour
/api/v1/mobile/tasks: 2000 requests/hour
```

### 14.2 Rate Limit Headers
```yaml
# Response headers
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642680000
```

---

## 15) API Versioning

### 15.1 Version Strategy
- **URL Versioning**: `/api/v1/`, `/api/v2/`
- **Header Versioning**: `Accept: application/vnd.tekup.v1+json`
- **Backward Compatibility**: 2 major versions supported
- **Deprecation Notice**: 6 months advance notice

### 15.2 Version Lifecycle
- **v1**: Current stable version
- **v2**: Next major version (in development)
- **v0**: Experimental/alpha version

---

Dette dokument fungerer som reference for API implementering og integration. Opdateres løbende baseret på ændringer og feedback.

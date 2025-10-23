# API Reference

Complete reference for Tekup Database client libraries.

---

## Vault Client

### `vault.findDocuments(filters?)`
Find documents with filtering.

```typescript
const docs = await vault.findDocuments({
  source: 'github',
  repository: 'TekupDK/tekup',
  limit: 50,
});
```

### `vault.createDocument(data)`
Create new document.

### `vault.upsertDocument(data)`
Create or update document (no duplicates).

### `vault.createEmbedding(documentId, embedding)`
Store 1536-dimensional vector embedding.

### `vault.semanticSearch(queryEmbedding, limit?, threshold?)`
Search by semantic similarity (cosine distance).

### `vault.getSyncStatus(source?, repository?)`
Get sync status.

### `vault.updateSyncStatus(source, repository, status, errorMessage?)`
Update sync status.

---

## Billy Client

### `billy.findOrganization(billyOrgId)`
Find organization by Billy.dk ID.

### `billy.createOrganization(data)`
Create new organization.

### `billy.getCachedInvoice(organizationId, billyId)`
Retrieve cached invoice (checks TTL).

### `billy.setCachedInvoice(organizationId, billyId, data, ttlMinutes?)`
Cache invoice with TTL (default 60 min).

### `billy.clearExpiredCache(organizationId?)`
Remove expired cache entries.

### `billy.logAudit(data)`
Log audit trail entry.

### `billy.getAuditLogs(organizationId, limit?)`
Get audit history.

### `billy.trackUsage(organizationId, toolName, success, durationMs?)`
Track API usage.

### `billy.getUsageMetrics(organizationId, startDate, endDate)`
Get usage metrics.

### `billy.checkRateLimit(organizationId, toolName, maxRequests, windowMinutes)`
Check rate limiting.

---

## RenOS Client

### Lead Management

**`renos.findLeads(filters?)`** - Search leads  
**`renos.createLead(data)`** - Create lead  
**`renos.updateLeadScore(leadId, score, priority, metadata?)`** - Update scoring  
**`renos.enrichLead(leadId, enrichmentData)`** - Enrich with data  

### Customer Management

**`renos.findCustomer(email)`** - Find customer  
**`renos.createCustomer(data)`** - Create customer  
**`renos.updateCustomerStats(customerId)`** - Update statistics  

### Booking Management

**`renos.findBookings(filters?)`** - Search bookings  
**`renos.createBooking(data)`** - Create booking  
**`renos.startTimer(bookingId)`** - Start time tracking  
**`renos.stopTimer(bookingId)`** - Stop timer, calculate efficiency  
**`renos.addBreak(bookingId, reason?)`** - Add break  
**`renos.endBreak(breakId)`** - End break  

### Email Management

**`renos.findEmailThreads(customerId?, limit?)`** - Get email threads  
**`renos.createEmailThread(data)`** - Create thread  
**`renos.addEmailMessage(data)`** - Add message to thread  
**`renos.createEmailResponse(data)`** - Generate AI response  
**`renos.approveEmailResponse(responseId, gmailThreadId?)`** - Approve response  
**`renos.sendEmailResponse(responseId, gmailMessageId)`** - Mark as sent  

### Invoice Management

**`renos.createInvoice(data)`** - Create invoice with line items  
**`renos.markInvoicePaid(invoiceId, paidAmount, paymentMethod, paymentRef?)`** - Mark as paid  

### Cleaning Plans

**`renos.findCleaningPlans(customerId?, isActive?)`** - Get cleaning plans  
**`renos.createCleaningPlan(data)`** - Create plan with tasks  

### Analytics

**`renos.trackMetric(metric, value, metadata?)`** - Track metric  
**`renos.getMetrics(metric, startDate, endDate)`** - Get metrics  

### Escalations

**`renos.createEscalation(data)`** - Create escalation  
**`renos.resolveEscalation(escalationId, resolution)`** - Resolve escalation  

---

## CRM Client

### Contact Management

**`crm.findContacts(filters?)`** - Search contacts  
**`crm.findContactByEmail(email)`** - Find by email  
**`crm.createContact(data)`** - Create contact  
**`crm.updateContact(id, data)`** - Update contact  

### Company Management

**`crm.findCompanies(filters?)`** - Search companies  
**`crm.createCompany(data)`** - Create company  

### Deal Management

**`crm.findDeals(filters?)`** - Search deals  
**`crm.createDeal(data)`** - Create deal  
**`crm.moveDealToStage(dealId, stage)`** - Move to pipeline stage  
**`crm.closeDeal(dealId, won, reason?)`** - Close deal (won/lost)  
**`crm.addProductToDeal(data)`** - Add product/service  

### Activity Tracking

**`crm.logActivity(data)`** - Log call, meeting, note  
**`crm.getActivities(filters?)`** - Get activity history  

### Email Tracking

**`crm.logEmail(data)`** - Log email sent/received  
**`crm.markEmailOpened(emailId)`** - Track email open  

### Task Management

**`crm.createTask(data)`** - Create task  
**`crm.getTasks(filters?)`** - Get tasks  
**`crm.completeTask(taskId)`** - Mark as complete  

### Analytics

**`crm.trackMetric(metric, value, metadata?)`** - Track CRM metric  
**`crm.getMetrics(metric, startDate, endDate)`** - Get metrics  
**`crm.getPipelineMetrics(owner?)`** - Get pipeline stats  

---

## Flow Client

### Workflow Management

**`flow.findWorkflows(filters?)`** - Search workflows  
**`flow.createWorkflow(data)`** - Create workflow  
**`flow.updateWorkflow(id, data)`** - Update workflow  
**`flow.activateWorkflow(id)`** - Activate workflow  
**`flow.pauseWorkflow(id)`** - Pause workflow  

### Execution Management

**`flow.executeWorkflow(workflowId, input?, triggeredBy?)`** - Execute workflow  
**`flow.getExecution(id)`** - Get execution details  
**`flow.getExecutions(filters?)`** - Search executions  
**`flow.completeExecution(id, output?, error?)`** - Complete execution  

### Step Management

**`flow.createExecutionStep(data)`** - Create step  
**`flow.completeExecutionStep(id, output?, error?)`** - Complete step  

### Logging

**`flow.log(executionId, level, message, data?, stepId?)`** - Log message  

### Scheduling

**`flow.createSchedule(data)`** - Create schedule (cron or interval)  
**`flow.getSchedules(workflowId?)`** - Get schedules  
**`flow.updateScheduleNextRun(id, nextRun)`** - Update next run  

### Webhooks

**`flow.createWebhook(data)`** - Create webhook  
**`flow.getWebhook(url)`** - Get webhook  
**`flow.logWebhookRequest(webhookId)`** - Log webhook call  

### Integrations

**`flow.createIntegration(data)`** - Create integration  
**`flow.getIntegrations(owner?, type?)`** - Get integrations  
**`flow.updateIntegrationUsage(id)`** - Track usage  

### Variables

**`flow.setVariable(key, value, workflowId?, isSecret?)`** - Set variable  
**`flow.getVariable(key, workflowId?)`** - Get variable  
**`flow.getVariables(workflowId?)`** - Get all variables  

### Analytics

**`flow.trackMetric(metric, value, workflowId?, metadata?)`** - Track metric  
**`flow.getMetrics(metric, startDate, endDate, workflowId?)`** - Get metrics  

---

## Direct Prisma Access

```typescript
import { prisma } from '@tekup/database';

// Full Prisma client access
const result = await prisma.vaultDocument.findMany();
```

See [Prisma documentation](https://www.prisma.io/docs) for complete API.

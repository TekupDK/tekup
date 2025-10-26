# API Reference

This document lists HTTP endpoints across the Tekup applications.

## flow-api
### Archiving (`/archiving`)
- GET `/archiving/config/:tenantId`
- PUT `/archiving/config/:tenantId`
- POST `/archiving/trigger`
- GET `/archiving/stats`
- GET `/archiving/health`
- DELETE `/archiving/cleanup/:tenantId`

### API Keys (`/auth/api-keys`)
- GET `/auth/api-keys`
- POST `/auth/api-keys/create`
- POST `/auth/api-keys/rotate`
- DELETE `/auth/api-keys/:id/revoke`
- GET `/auth/api-keys/:id`
- GET `/auth/api-keys/:id/rotation-status`
- POST `/auth/api-keys/create-legacy`

### Backup (`/backup`)
- POST `/backup/create`
- POST `/backup/validate`
- POST `/backup/restore`
- GET `/backup/stats`
- GET `/backup/jobs`
- GET `/backup/jobs/:id`
- GET `/backup/restore-jobs`
- GET `/backup/config`
- GET `/backup/pitr-config`
- DELETE `/backup/cleanup`
- GET `/backup/health`

### Bulk Operations (`/bulk`)
- PUT `/bulk/leads/update`
- PUT `/bulk/leads/status`
- POST `/bulk/leads/import`
- POST `/bulk/leads/validate-import`
- POST `/bulk/leads/export`
- GET `/bulk/leads/export/:format`
- GET `/bulk/operations/:operationId`
- DELETE `/bulk/operations/:operationId`
- GET `/bulk/stats`
- GET `/bulk/formats`
- GET `/bulk/templates/:type`

### Database Optimization (`/database-optimization`)
- GET `/database-optimization/recommendations`
- GET `/database-optimization/report`
- POST `/database-optimization/apply`

### Deployment (`/deployment`)
- POST `/deployment/initialize`
- POST `/deployment/migrate`
- PUT `/deployment/ready`
- POST `/deployment/rollback`
- GET `/deployment/status`
- GET `/deployment/config`
- GET `/deployment/readiness`
- GET `/deployment/health`

### Duplicate Detection (`/duplicate`)
- POST `/duplicate/check/:leadId`
- GET `/duplicate/groups`
- GET `/duplicate/groups/:groupId`
- POST `/duplicate/merge`
- POST `/duplicate/groups`
- PUT `/duplicate/groups/:groupId/resolve`
- DELETE `/duplicate/groups/:groupId`
- GET `/duplicate/config`
- PUT `/duplicate/config`
- GET `/duplicate/stats`
- POST `/duplicate/bulk-check`

### Filtering (`/filter`)
- POST `/filter/leads`
- GET `/filter/leads`
- GET `/filter/options/:field`
- GET `/filter/metadata`
- POST `/filter/custom`
- GET `/filter/date-range/:field`
- POST `/filter/aggregation`
- GET `/filter/stats`
- POST `/filter/export`
- POST `/filter/validate`

### Health (`/health`)
- GET `/health`
- GET `/health/ready`
- GET `/health/live`
- GET `/health/database`
- GET `/health/cache`
- GET `/health/external`

### Ingestion (`/ingest`)
- POST `/ingest/form`

### Lead Management (`/leads`)
- GET `/leads`
- GET `/leads/:id`
- GET `/leads/:id/events`
- POST `/leads/compliance`

### Metrics (`/metrics`)
- GET `/metrics`

### Performance (`/performance`)
- GET `/performance/metrics`
- GET `/performance/report`
- GET `/performance/slow-queries`
- GET `/performance/analyze-query`
- GET `/performance/index-recommendations`
- GET `/performance/index-sql/:table/:columns`
- GET `/performance/frequent-queries`

### Rate Limiting (`/admin/rate-limits`)
- GET `/admin/rate-limits/stats/:tenantId`
- POST `/admin/rate-limits/config`
- GET `/admin/rate-limits/status`
- DELETE `/admin/rate-limits/reset`
- GET `/admin/rate-limits/health`
- GET `/admin/rate-limits/adaptive/limits`
- GET `/admin/rate-limits/adaptive/anomalies`
- DELETE `/admin/rate-limits/adaptive/reset`

### Search (`/search`)
- POST `/search/leads`
- GET `/search/leads`
- GET `/search/autocomplete`
- POST `/search/leads/advanced`
- GET `/search/leads/date-range`
- GET `/search/suggestions/:query`
- POST `/search/index/lead/:leadId`
- POST `/search/index/bulk-update`
- GET `/search/index/stats`
- POST `/search/index/optimize`
- GET `/search/health`

### Settings (`/settings`)
- GET `/settings`

### Websocket (`/websocket`)
- GET `/websocket/stats`
- GET `/websocket/queue-stats`
- POST `/websocket/test-notification`
- POST `/websocket/bulk-notification`

### Load Balancer Health (root)
- GET `/health`
- GET `/ready`
- GET `/alive`

## secure-platform
### Health (`/health`)
- GET `/health`

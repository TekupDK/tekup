# RendetaljeOS Backend Architecture

## Overview

RendetaljeOS backend is built with **NestJS** and follows a modular, domain-driven architecture with clean separation of concerns.

## Technology Stack

- **Framework**: NestJS 10.x
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 14+ (via Supabase)
- **ORM**: Prisma 5.x
- **Authentication**: Supabase Auth + JWT
- **Caching**: Redis
- **Real-time**: Socket.IO
- **Documentation**: Swagger/OpenAPI

## Architecture Layers

```
┌─────────────────────────────────────┐
│         Controllers Layer           │  HTTP/WebSocket endpoints
├─────────────────────────────────────┤
│          Services Layer             │  Business logic
├─────────────────────────────────────┤
│       Repository/Prisma Layer       │  Data access
├─────────────────────────────────────┤
│          Database Layer             │  PostgreSQL + Redis
└─────────────────────────────────────┘
```

## Module Structure

### Core Modules

#### AuthModule
- **Purpose**: User authentication and authorization
- **Components**:
  - `AuthController` - Login, register, password reset
  - `AuthService` - Auth business logic
  - `JwtStrategy` - JWT token validation
  - `RolesGuard` - Role-based access control

#### JobsModule
- **Purpose**: Job/booking management
- **Components**:
  - `JobsController` - Job CRUD endpoints
  - `JobsService` - Job business logic
  - Job assignment management
  - Status tracking

#### CustomersModule
- **Purpose**: Customer relationship management
- **Components**:
  - `CustomersController` - Customer CRUD
  - `CustomersService` - Customer logic
  - Customer analytics
  - Communication tracking

#### TeamModule
- **Purpose**: Team member management
- **Components**:
  - `TeamController` - Team CRUD
  - `TeamService` - Team logic
  - Performance tracking
  - Schedule management

#### TimeTrackingModule
- **Purpose**: Time and attendance tracking
- **Components**:
  - `TimeTrackingController` - Time entry endpoints
  - `TimeTrackingService` - Time tracking logic
  - Time corrections
  - Overtime calculation

#### QualityModule
- **Purpose**: Quality control and assessment
- **Components**:
  - `QualityController` - Quality endpoints
  - `QualityService` - Assessment logic
  - `QualityChecklistsService` - Checklist management
  - `PhotoDocumentationService` - Photo upload/management

#### AiFridayModule
- **Purpose**: AI assistant integration
- **Components**:
  - `AiFridayController` - Chat endpoints
  - `AiFridayService` - AI integration
  - `ChatSessionsService` - Session management
  - Voice transcription

#### IntegrationsModule
- **Purpose**: External service integrations
- **Components**:
  - `TekupBillyService` - Billy.dk accounting
  - `TekupVaultService` - Knowledge base
  - `RenosCalendarService` - Calendar integration

#### RealtimeModule
- **Purpose**: Real-time features
- **Components**:
  - `RealtimeGateway` - WebSocket gateway
  - `NotificationService` - Push notifications
  - Connection management

#### GdprModule
- **Purpose**: GDPR compliance
- **Components**:
  - `GdprController` - Data rights endpoints
  - `GdprService` - Data export/deletion
  - Consent management

## Design Patterns

### Dependency Injection
All services use constructor-based dependency injection:

```typescript
@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}
}
```

### Repository Pattern
Data access abstracted through Prisma ORM:

```typescript
// Service uses Prisma for data access
async findAll(organizationId: string) {
  return this.prisma.jobs.findMany({
    where: { organization_id: organizationId }
  });
}
```

### Service Layer Pattern
Business logic separated from controllers:

```typescript
// Controller handles HTTP
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.jobsService.findAll(req.user.organizationId);
  }
}
```

### BaseService Pattern
Generic CRUD operations in base class:

```typescript
export abstract class BaseService<T> {
  async findAll(organizationId, pagination, filters);
  async findById(id, organizationId);
  async create(dto, organizationId);
  async update(id, dto, organizationId);
  async delete(id, organizationId);
}
```

### Guard Pattern
Security implemented via guards:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Post()
async create(@Body() dto, @Request() req) { }
```

### DTO Pattern
Input validation via Data Transfer Objects:

```typescript
export class CreateJobDto {
  @IsUUID()
  customer_id: string;

  @IsEnum(ServiceType)
  service_type: ServiceType;

  @IsDateString()
  scheduled_date: string;
}
```

## Authentication Flow

```
1. User → POST /auth/login → AuthController
2. AuthController → AuthService.login()
3. AuthService → Supabase Auth (verify credentials)
4. Supabase → Return user + session
5. AuthService → Generate JWT token
6. Return { user, token } → User

Subsequent requests:
1. User → Request with Bearer token → Any endpoint
2. JwtAuthGuard → Validate token
3. RolesGuard → Check user role
4. Controller → Service → Prisma → Database
5. Response → User
```

## Database Architecture

### Multi-Schema Design
PostgreSQL with multiple schemas:

- **public** - Core application data
- **vault** - Knowledge base data
- **billy** - Accounting integration
- **renos** - Calendar data
- **shared** - Shared resources

### Row Level Security (RLS)
Supabase RLS policies enforce data isolation:

```sql
-- Jobs accessible only by organization members
CREATE POLICY "org_jobs_policy" ON jobs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
```

## Configuration Management

### Environment Variables
Configuration loaded via `@nestjs/config`:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        SUPABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
  ],
})
```

### Feature Flags
Enable/disable features via environment:

```typescript
ENABLE_AI_FRIDAY=true
ENABLE_VOICE_INPUT=true
ENABLE_REAL_TIME_TRACKING=true
```

## Error Handling

### Global Exception Filter
Catch all exceptions:

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Log to Sentry
    // Format error response
    // Return standardized error
  }
}
```

### Custom Exceptions
Domain-specific exceptions:

```typescript
throw new NotFoundException('Job not found');
throw new ForbiddenException('Insufficient permissions');
throw new BadRequestException('Invalid job status');
```

## Logging & Monitoring

### Winston Logger
Structured logging:

```typescript
this.logger.log('Job created', { jobId, organizationId });
this.logger.error('Job creation failed', error);
this.logger.warn('Job approaching deadline', { jobId });
```

### Sentry Integration
Error tracking in production:

```typescript
Sentry.captureException(error, {
  tags: { module: 'jobs', organizationId },
  level: 'error',
});
```

## Performance Optimization

### Database Connection Pooling
```typescript
DATABASE_POOL_SIZE=10
```

### Redis Caching
```typescript
@Injectable()
export class CacheService {
  async get(key: string);
  async set(key: string, value: any, ttl: number);
  async delete(key: string);
}
```

### Query Optimization
- Selective field loading
- Index optimization
- Batch operations
- Pagination enforcement

## Security Features

### Authentication
- JWT tokens (24h expiry)
- Refresh token support
- Supabase Auth integration

### Authorization
- Role-based access control (RBAC)
- Organization-level data isolation
- Row Level Security (RLS)

### Data Protection
- Password hashing (bcrypt, 12 rounds)
- Encryption at rest
- HTTPS enforcement
- CORS configuration

### Rate Limiting
```typescript
@ThrottlerGuard()
// 100 requests per 1 minute
```

## Testing Strategy

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## Deployment Architecture

### Production Setup
```
┌──────────────┐
│   Render.com │  Web Service
│   (Backend)  │
└──────┬───────┘
       │
       ├─────────┐
       ▼         ▼
┌──────────┐  ┌──────────┐
│ Supabase │  │  Redis   │
│PostgreSQL│  │  Cache   │
└──────────┘  └──────────┘
```

### Environment Separation
- **Development**: Local PostgreSQL + Redis
- **Staging**: Supabase Dev instance
- **Production**: Supabase Production + Redis Cloud

## API Versioning

### Version Strategy
- URL-based versioning: `/api/v1/...`
- Future versions: `/api/v2/...`
- Backward compatibility maintained

## Documentation

### Swagger/OpenAPI
Auto-generated documentation at `/docs`:

```typescript
SwaggerModule.setup('docs', app, document, {
  swaggerOptions: {
    persistAuthorization: true,
  },
});
```

## File Structure

```
src/
├── app.module.ts           # Root module
├── main.ts                 # Application entry
├── auth/                   # Auth module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── roles.guard.ts
├── jobs/                   # Jobs module
│   ├── jobs.controller.ts
│   ├── jobs.service.ts
│   └── dto/
├── customers/              # Customers module
├── team/                   # Team module
├── time-tracking/          # Time tracking
├── quality/                # Quality control
├── ai-friday/              # AI assistant
├── integrations/           # External integrations
├── realtime/               # WebSocket/notifications
├── gdpr/                   # GDPR compliance
├── common/                 # Shared utilities
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── decorators/
└── prisma/                 # Database schema
    └── schema.prisma
```

## Best Practices

### Code Organization
- One module per domain
- Controllers handle HTTP only
- Services contain business logic
- DTOs for validation
- Interfaces for types

### Naming Conventions
- Controllers: `{Entity}Controller`
- Services: `{Entity}Service`
- DTOs: `Create{Entity}Dto`, `Update{Entity}Dto`
- Guards: `{Purpose}Guard`

### Error Handling
- Always use typed exceptions
- Log errors with context
- Return standardized error responses
- Send errors to Sentry in production

### Security
- Always validate user input
- Enforce authentication on all routes (except public)
- Check authorization before operations
- Sanitize database queries
- Use parameterized queries (Prisma handles this)

---

For detailed API documentation, see [API_REFERENCE.md](./API_REFERENCE.md).

For database schema, see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md).

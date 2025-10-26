# AI Proposal Engine - Deployment Guide

## Deployment Options

### Option 1: Tekup Integration (Recommended)

Integrate the AI Proposal Engine into the existing Tekup monorepo structure:

```
tekup-org/
├── apps/
│   ├── proposal-engine-api/     # NestJS backend
│   ├── proposal-engine-web/     # Next.js frontend
│   └── ...
├── packages/
│   ├── @tekup/proposal-engine/  # Core MCP logic
│   └── ...
```

#### Integration Steps:

1. **Create Tekup Apps**
   ```bash
   cd tekup-org/apps
   mkdir proposal-engine-api proposal-engine-web
   ```

2. **Adapt to Tekup Standards**
   - Convert MCP servers to NestJS modules
   - Use Prisma for database operations
   - Implement Glassmorphism UI design
   - Integrate with `@tekup/auth` for authentication

3. **Database Schema (Prisma)**
   ```prisma
   model SalesCall {
     id          String   @id @default(cuid())
     transcript  String
     company     String?
     industry    String?
     duration    Int?
     recordingDate DateTime?
     participants String[]
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
     
     proposals   Proposal[]
   }

   model Proposal {
     id          String   @id @default(cuid())
     title       String
     content     Json
     documentUrl String?
     confidence  Float?
     callId      String
     call        SalesCall @relation(fields: [callId], references: [id])
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
   }

   model BuyingSignal {
     id         String   @id @default(cuid())
     type       String
     text       String
     confidence Float
     timestamp  Int
     speaker    String
     context    String
     callId     String
     createdAt  DateTime @default(now())
   }
   ```

### Option 2: Standalone Deployment

Deploy as a standalone service with REST API:

#### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY dist ./dist
   EXPOSE 3000
   CMD ["node", "dist/mcp-host/index.js"]
   ```

2. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     proposal-engine:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - OPENAI_API_KEY=${OPENAI_API_KEY}
         - PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}
         - AIRTABLE_API_KEY=${AIRTABLE_API_KEY}
         - AIRTABLE_BASE_ID=${AIRTABLE_BASE_ID}
       volumes:
         - ./logs:/app/logs
   ```

#### Cloud Deployment (Vercel/Railway/Render)

1. **Build Configuration**
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/mcp-host/index.js"
     }
   }
   ```

2. **Environment Variables**
   - Set all required API keys in platform dashboard
   - Configure production logging level
   - Set up health check endpoints

### Option 3: Serverless Deployment

Deploy individual MCP servers as serverless functions:

#### Vercel Functions

```typescript
// api/generate-proposal.ts
import { NarrativeGenerationServer } from '../src/servers/narrative-generation';

export default async function handler(req, res) {
  const server = new NarrativeGenerationServer();
  const result = await server.generateNarrative(req.body);
  res.json(result);
}
```

#### AWS Lambda

```typescript
// lambda/proposal-generator.ts
import { MCPHost } from '../src/mcp-host';

export const handler = async (event, context) => {
  const host = new MCPHost();
  const result = await host.generateProposal(event.body);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
```

## Production Configuration

### Environment Variables

```env
# Production Environment
NODE_ENV=production
LOG_LEVEL=info
PORT=3000

# API Keys (use secrets manager)
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
AIRTABLE_API_KEY=key...
AIRTABLE_BASE_ID=app...

# Google APIs
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60

# Caching
CACHE_TTL_MINUTES=15
REDIS_URL=redis://...

# Monitoring
SENTRY_DSN=...
NEW_RELIC_LICENSE_KEY=...
```

### Security Considerations

1. **API Key Management**
   - Use environment variables or secrets manager
   - Rotate keys regularly
   - Monitor usage and quotas

2. **Rate Limiting**
   - Implement per-IP rate limiting
   - Set API quota limits
   - Use caching to reduce API calls

3. **Input Validation**
   - Validate all transcript inputs
   - Sanitize user-provided data
   - Implement request size limits

4. **Authentication**
   - Require API authentication
   - Use JWT tokens for session management
   - Implement role-based access control

### Monitoring and Logging

1. **Health Checks**
   ```typescript
   app.get('/health', (req, res) => {
     res.json({
       status: 'healthy',
       timestamp: new Date().toISOString(),
       version: process.env.npm_package_version
     });
   });
   ```

2. **Metrics Collection**
   - Proposal generation success rate
   - Average processing time
   - API response times
   - Error rates by component

3. **Alerting**
   - High error rates
   - API quota exhaustion
   - Service downtime
   - Performance degradation

### Performance Optimization

1. **Caching Strategy**
   - Cache research results (15 minutes)
   - Cache company intelligence (1 hour)
   - Cache industry trends (4 hours)

2. **Parallel Processing**
   - Run MCP servers concurrently
   - Parallelize research queries
   - Async document generation

3. **Resource Management**
   - Connection pooling for databases
   - Request queuing for high load
   - Graceful degradation on failures

## Tekup-Specific Integration

### Authentication Integration

```typescript
// Integrate with @tekup/auth
import { TekupAuth } from '@tekup/auth';

@Controller('proposals')
@UseGuards(TekupAuthGuard)
export class ProposalController {
  @Post('generate')
  async generateProposal(
    @Body() request: ProposalGenerationRequest,
    @User() user: TekupUser
  ) {
    // Generate proposal with user context
    return this.proposalService.generate(request, user);
  }
}
```

### UI Integration

```tsx
// Next.js component with Glassmorphism design
import { GlassCard, NeonButton } from '@tekup/ui';

export function ProposalGenerator() {
  return (
    <GlassCard className="proposal-generator">
      <h2 className="neon-text">AI Proposal Engine</h2>
      <div className="transcript-upload">
        {/* Transcript upload interface */}
      </div>
      <NeonButton onClick={generateProposal}>
        Generate Proposal
      </NeonButton>
    </GlassCard>
  );
}
```

### Database Integration

```typescript
// Use Tekup's Prisma setup
import { PrismaService } from '@tekup/shared';

@Injectable()
export class ProposalService {
  constructor(private prisma: PrismaService) {}

  async createProposal(data: CreateProposalDto) {
    return this.prisma.proposal.create({
      data: {
        ...data,
        userId: data.userId,
        organizationId: data.organizationId
      }
    });
  }
}
```

## Rollout Strategy

### Phase 1: Internal Testing
- Deploy to Tekup staging environment
- Test with sample transcripts
- Validate integration with existing systems

### Phase 2: Limited Beta
- Roll out to select Tekup clients
- Monitor performance and feedback
- Iterate on features and accuracy

### Phase 3: Full Production
- Deploy to all Tekup users
- Implement monitoring and alerting
- Scale infrastructure as needed

### Phase 4: Enhancement
- Add advanced features based on feedback
- Integrate with additional data sources
- Optimize for specific industries

## Maintenance and Updates

### Regular Tasks
- Monitor API usage and costs
- Update AI models and prompts
- Review and improve buying signal patterns
- Update industry research sources

### Scaling Considerations
- Horizontal scaling of MCP servers
- Database optimization for large datasets
- CDN for document delivery
- Load balancing for high availability

### Backup and Recovery
- Regular database backups
- Configuration backup
- Disaster recovery procedures
- Data retention policies

---

**Ready for deployment to transform Tekup's proposal generation process!**

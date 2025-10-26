# TekUp AI Service Authentication Integration

## Overview

This document explains how to integrate TekUp's AI services with the enhanced SSO authentication system that provides multi-tenant, permission-based access control with quota management.

## Quick Integration Guide

### 1. Import Required Decorators

```typescript
import { 
  ProposalPermission, 
  ContentPermission,
  SupportPermission,
  AIServicePermission,
  AIServiceCategory,
  TenantContext 
} from '@tekup/sso';
```

### 2. Protect Your AI Endpoints

```typescript
@Controller('ai/proposals')
export class ProposalController {
  
  // Read proposals (no quota check)
  @Get()
  @ProposalPermission(AIServicePermission.PROPOSAL_READ, false)
  async getProposals(@Req() request: Request) {
    const user = request.user as TenantContext;
    return this.proposalService.getProposals(user.tenantId);
  }

  // Generate proposal (with quota check)
  @Post('generate')
  @ProposalPermission(AIServicePermission.PROPOSAL_WRITE, true)
  async generateProposal(@Body() data: any, @Req() request: Request) {
    const user = request.user as TenantContext;
    return this.proposalService.generate(data, user.tenantId);
  }
}
```

### 3. Available Permission Decorators

```typescript
// Service-specific decorators
@ProposalPermission(permission, checkQuota?)
@ContentPermission(permission, checkQuota?)
@SupportPermission(permission, checkQuota?)
@CRMPermission(permission, checkQuota?)
@MarketingPermission(permission, checkQuota?)
@ProjectPermission(permission, checkQuota?)
@AnalyticsPermission(permission, checkQuota?)
@VoiceAIPermission(permission, checkQuota?)
@BIPermission(permission, checkQuota?)

// Convenience decorators
@ReadOnlyAI(service)         // Read access, no quota
@WriteAccess(service)        // Write access with quota
@AdminAccess(service)        // Admin access, no quota
@HighUsageAI(service, perm)  // High-usage with special handling
```

## Permission System

### AI Service Categories
- `PROPOSAL` - AI Proposal Engine
- `CONTENT` - Content Generation
- `SUPPORT` - Customer Support AI
- `CRM` - Enhanced CRM
- `MARKETING` - Marketing Automation
- `PROJECT` - Project Management
- `ANALYTICS` - AI Analytics
- `VOICE_AI` - Voice AI & Computer Vision
- `BUSINESS_INTELLIGENCE` - BI Platform
- `SYSTEM` - System Administration

### Permission Levels
- `READ` - View data and results
- `WRITE` - Create and modify
- `ADMIN` - Administrative access
- `PUBLISH` - Publish content (Content service)
- `ESCALATE` - Escalate tickets (Support service)
- `CAMPAIGN` - Launch campaigns (Marketing service)
- `MANAGE` - Manage projects (Project service)

### Role-Based Quotas

#### SUPER_ADMIN
- Unlimited access to all services
- All permissions enabled
- No quota restrictions

#### ADMIN  
- High quotas (1000-20000 requests/month)
- Admin access to most services
- Priority: HIGH

#### MANAGER
- Medium quotas (300-10000 requests/month)
- Read/write access to operational services
- Priority: MEDIUM

#### USER
- Basic quotas (20-2000 requests/month)
- Limited read/write access
- Priority: LOW

## Real-World Examples

### AI Proposal Engine
```typescript
@Controller('ai/proposals')
export class AIProposalController {
  
  @Get()
  @ProposalPermission(AIServicePermission.PROPOSAL_READ, false)
  async getProposals() {
    return this.proposalService.findAll();
  }

  @Post('generate')
  @ProposalPermission(AIServicePermission.PROPOSAL_WRITE, true)
  async generateProposal(@Body() data: GenerateProposalDto) {
    return this.proposalService.generateFromTranscript(data);
  }

  @Post('research')
  @HighUsageAI(AIServiceCategory.PROPOSAL, AIServicePermission.PROPOSAL_WRITE)
  async researchProspect(@Body() data: ResearchDto) {
    return this.proposalService.researchProspect(data);
  }

  @Put('settings')
  @AdminAccess(AIServiceCategory.PROPOSAL)
  async updateSettings(@Body() settings: ProposalSettingsDto) {
    return this.proposalService.updateSettings(settings);
  }
}
```

### AI Content Generator
```typescript
@Controller('ai/content')
export class AIContentController {

  @Post('generate/blog')
  @ContentPermission(AIServicePermission.CONTENT_WRITE, true)
  async generateBlog(@Body() data: BlogRequestDto) {
    return this.contentService.generateBlog(data);
  }

  @Post('generate/social')
  @ContentPermission(AIServicePermission.CONTENT_WRITE, true)
  async generateSocial(@Body() data: SocialContentDto) {
    return this.contentService.generateSocialContent(data);
  }

  @Post('publish')
  @ContentPermission(AIServicePermission.CONTENT_PUBLISH, true)
  async publishContent(@Body() data: PublishDto) {
    return this.contentService.publish(data);
  }
}
```

### AI Customer Support
```typescript
@Controller('ai/support')
export class AISupportController {

  @Post('chat')
  @SupportPermission(AIServicePermission.SUPPORT_WRITE, true)
  async handleChat(@Body() data: ChatMessageDto) {
    return this.supportService.processMessage(data);
  }

  @Post('escalate')
  @SupportPermission(AIServicePermission.SUPPORT_ESCALATE, false)
  async escalateToHuman(@Body() data: EscalationDto) {
    return this.supportService.escalateToHuman(data);
  }

  @Get('analytics')
  @AdminAccess(AIServiceCategory.SUPPORT)
  async getSupportAnalytics() {
    return this.supportService.getAnalytics();
  }
}
```

### Enhanced CRM
```typescript
@Controller('ai/crm')
export class AICRMController {

  @Post('leads/score')
  @CRMPermission(AIServicePermission.CRM_WRITE, true)
  async scoreLeads(@Body() data: LeadScoringDto) {
    return this.crmService.scoreLeads(data);
  }

  @Post('contacts/enrich')
  @CRMPermission(AIServicePermission.CRM_WRITE, true)
  async enrichContacts(@Body() contactIds: string[]) {
    return this.crmService.enrichContacts(contactIds);
  }

  @Delete('leads/:id')
  @CRMPermission(AIServicePermission.CRM_DELETE, false)
  async deleteLead(@Param('id') id: string) {
    return this.crmService.deleteLead(id);
  }
}
```

## Usage Tracking & Analytics

The system automatically tracks:
- **Request counts** per service/tenant/user
- **Token usage** and estimated costs
- **Quota utilization** rates
- **Permission denials** and patterns
- **Performance metrics**

```typescript
// Manual usage tracking (optional)
await aiAuthService.trackUsage({
  tenantId: 'tenant-123',
  userId: 'user-456',
  service: AIServiceCategory.PROPOSAL,
  action: 'generate_proposal',
  timestamp: new Date(),
  tokens: 1500,
  cost: 0.15,
  metadata: {
    proposalType: 'consulting',
    wordCount: 1200
  }
});
```

## Error Handling

```typescript
@Post('generate')
@ProposalPermission(AIServicePermission.PROPOSAL_WRITE, true)
async generateProposal(@Body() data: any) {
  try {
    return await this.proposalService.generate(data);
  } catch (error) {
    if (error instanceof ForbiddenException) {
      // Handle quota exceeded or permission denied
      throw new HttpException({
        message: 'AI service quota exceeded',
        retryAfter: '1 hour',
        quotaInfo: await this.getQuotaInfo()
      }, HttpStatus.TOO_MANY_REQUESTS);
    }
    throw error;
  }
}
```

## Module Setup

```typescript
import { Module } from '@nestjs/common';
import { TekUpSSOService, TekUpAIAuthService, AIAuthGuard } from '@tekup/sso';

@Module({
  providers: [
    TekUpSSOService,
    TekUpAIAuthService,
    AIAuthGuard,
    // Your AI service controllers
    AIProposalController,
    AIContentController,
    AISupportController,
    // ... other controllers
  ],
  exports: [
    TekUpSSOService,
    TekUpAIAuthService
  ]
})
export class AIServicesModule {}
```

## Frontend Integration

```typescript
// Frontend authentication hook
const { user, token } = useAuth();

// API calls with authentication
const generateProposal = async (data) => {
  const response = await fetch('/ai/proposals/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('AI quota exceeded');
    }
    if (response.status === 403) {
      throw new Error('Insufficient permissions');
    }
  }

  return response.json();
};
```

## Best Practices

### 1. Always Use Appropriate Permissions
```typescript
// ✅ Good: Specific permission for the action
@ProposalPermission(AIServicePermission.PROPOSAL_WRITE, true)
async generateProposal() { }

// ❌ Bad: Using admin permission for regular operations
@AdminAccess(AIServiceCategory.PROPOSAL)
async generateProposal() { }
```

### 2. Enable Quota Checks for AI Operations
```typescript
// ✅ Good: Quota check for resource-intensive operations
@ContentPermission(AIServicePermission.CONTENT_WRITE, true)
async generateContent() { }

// ✅ Good: No quota check for metadata operations
@ContentPermission(AIServicePermission.CONTENT_READ, false)
async getContentList() { }
```

### 3. Handle Errors Gracefully
```typescript
// ✅ Good: Proper error handling with user feedback
try {
  return await this.aiService.process(data);
} catch (error) {
  if (error instanceof ForbiddenException) {
    throw new HttpException({
      message: 'Service quota exceeded',
      retryAfter: 3600,
      quotaInfo: await this.getQuotaStatus()
    }, HttpStatus.TOO_MANY_REQUESTS);
  }
  throw error;
}
```

### 4. Use Tenant Context
```typescript
// ✅ Good: Always use tenant context from authenticated user
@Post('generate')
@ProposalPermission(AIServicePermission.PROPOSAL_WRITE, true)
async generateProposal(@Body() data: any, @Req() request: Request) {
  const user = request.user as TenantContext;
  return this.proposalService.generate(data, user.tenantId);
}
```

## Migration Guide

### From Basic Auth to AI Auth

1. **Replace basic guards:**
```typescript
// Before
@UseGuards(AuthGuard)

// After  
@ProposalPermission(AIServicePermission.PROPOSAL_WRITE, true)
```

2. **Add quota management:**
```typescript
// Before: No quota tracking
@Post('generate')
async generate() { }

// After: With quota tracking
@Post('generate')
@ProposalPermission(AIServicePermission.PROPOSAL_WRITE, true)
async generate() { }
```

3. **Update error handling:**
```typescript
// Before: Basic auth errors
catch (UnauthorizedException) { }

// After: AI-specific errors
catch (ForbiddenException) {
  // Handle quota/permission errors
}
```

This integration provides enterprise-grade authentication and authorization for TekUp's AI services with comprehensive quota management, usage tracking, and role-based access control.


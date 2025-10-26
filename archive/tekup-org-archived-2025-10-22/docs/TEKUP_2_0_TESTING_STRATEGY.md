# Tekup 2.0 - Testing Strategy

Dette dokument indeholder omfattende teststrategi for Tekup 2.0 implementering.

Relaterede dokumenter:
- `docs/TEKUP_2_0_PRODUCT_SPEC.md`
- `docs/TEKUP_2_0_TECHNICAL_SPECS.md`
- `docs/TEKUP_2_0_PROJECT_PLAN.md`

---

## 1) Testing Overview

### 1.1 Test Pyramid
```
                    E2E Tests (10%)
                   ┌─────────────────┐
                  │   User Journeys  │
                 │   Cross-app Flows │
                └─────────────────┘
               Integration Tests (20%)
              ┌─────────────────────────┐
             │    API Endpoints        │
            │    Database Operations   │
           │    Agent Communication   │
          └─────────────────────────┘
         Unit Tests (70%)
        ┌─────────────────────────────┐
       │    Functions & Methods      │
      │    Components & Services     │
     │    Business Logic            │
    └─────────────────────────────┘
```

### 1.2 Test Coverage Goals
- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: 80%+ API endpoint coverage
- **E2E Tests**: 100% critical user journey coverage
- **Performance Tests**: 100% SLA requirement coverage

---

## 2) Unit Testing

### 2.1 Frontend Unit Tests
```typescript
// Example: Lead List Component Test
import { render, screen, fireEvent } from '@testing-library/react';
import { LeadList } from '../LeadList';
import { mockLeads } from '../../__mocks__/leads';

describe('LeadList Component', () => {
  const mockProps = {
    leads: mockLeads,
    onLeadSelect: jest.fn(),
    onLeadUpdate: jest.fn(),
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render leads correctly', () => {
    render(<LeadList {...mockProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('should call onLeadSelect when lead is clicked', () => {
    render(<LeadList {...mockProps} />);
    
    fireEvent.click(screen.getByText('John Doe'));
    
    expect(mockProps.onLeadSelect).toHaveBeenCalledWith(mockLeads[0]);
  });

  it('should show loading state', () => {
    render(<LeadList {...mockProps} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should filter leads by status', () => {
    render(<LeadList {...mockProps} />);
    
    fireEvent.change(screen.getByTestId('status-filter'), {
      target: { value: 'qualified' }
    });
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
```

### 2.2 Backend Unit Tests
```typescript
// Example: Lead Service Test
import { Test, TestingModule } from '@nestjs/testing';
import { LeadService } from './lead.service';
import { LeadRepository } from './lead.repository';
import { AgentScopeService } from '../agent-scope/agent-scope.service';

describe('LeadService', () => {
  let service: LeadService;
  let repository: jest.Mocked<LeadRepository>;
  let agentScopeService: jest.Mocked<AgentScopeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadService,
        {
          provide: LeadRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findByTenant: jest.fn()
          }
        },
        {
          provide: AgentScopeService,
          useValue: {
            processRequest: jest.fn()
          }
        }
      ],
    }).compile();

    service = module.get<LeadService>(LeadService);
    repository = module.get(LeadRepository);
    agentScopeService = module.get(AgentScopeService);
  });

  describe('createLead', () => {
    it('should create lead and trigger AI analysis', async () => {
      const leadData = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        tenantId: 'tenant-123'
      };

      const expectedLead = {
        id: 'lead-123',
        ...leadData,
        score: 85,
        status: 'new',
        createdAt: new Date()
      };

      repository.create.mockResolvedValue(expectedLead);
      agentScopeService.processRequest.mockResolvedValue({
        success: true,
        data: { score: 85, recommendations: [] }
      });

      const result = await service.createLead(leadData);

      expect(result).toEqual(expectedLead);
      expect(repository.create).toHaveBeenCalledWith(leadData);
      expect(agentScopeService.processRequest).toHaveBeenCalledWith({
        agentType: 'lead',
        data: leadData,
        context: { tenantId: leadData.tenantId }
      });
    });

    it('should handle AI analysis failure gracefully', async () => {
      const leadData = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        tenantId: 'tenant-123'
      };

      repository.create.mockResolvedValue({ id: 'lead-123', ...leadData });
      agentScopeService.processRequest.mockRejectedValue(new Error('AI service unavailable'));

      const result = await service.createLead(leadData);

      expect(result).toEqual({ id: 'lead-123', ...leadData });
      expect(repository.create).toHaveBeenCalledWith(leadData);
    });
  });

  describe('updateLead', () => {
    it('should update lead and trigger re-analysis', async () => {
      const leadId = 'lead-123';
      const updateData = { name: 'John Updated' };
      const existingLead = { id: leadId, name: 'John Doe', score: 85 };

      repository.findById.mockResolvedValue(existingLead);
      repository.update.mockResolvedValue({ ...existingLead, ...updateData });
      agentScopeService.processRequest.mockResolvedValue({
        success: true,
        data: { score: 90, recommendations: [] }
      });

      const result = await service.updateLead(leadId, updateData);

      expect(result.name).toBe('John Updated');
      expect(agentScopeService.processRequest).toHaveBeenCalledWith({
        agentType: 'lead',
        data: { ...existingLead, ...updateData },
        context: { tenantId: existingLead.tenantId }
      });
    });
  });
});
```

### 2.3 AgentScope Unit Tests
```typescript
// Example: AgentScope Service Test
import { TekupAgentScopeService } from './agent-scope.service';
import { MsgHub } from './msg-hub';
import { Pipeline } from './pipeline';
import { ReActEngine } from './react-engine';

describe('TekupAgentScopeService', () => {
  let service: TekupAgentScopeService;
  let mockMsgHub: jest.Mocked<MsgHub>;
  let mockPipeline: jest.Mocked<Pipeline>;
  let mockReActEngine: jest.Mocked<ReActEngine>;

  beforeEach(() => {
    mockMsgHub = {
      sendMessage: jest.fn(),
      subscribe: jest.fn(),
      createChannel: jest.fn()
    } as any;

    mockPipeline = {
      execute: jest.fn(),
      addStep: jest.fn(),
      validate: jest.fn()
    } as any;

    mockReActEngine = {
      process: jest.fn(),
      reason: jest.fn(),
      act: jest.fn(),
      observe: jest.fn()
    } as any;

    service = new TekupAgentScopeService(mockMsgHub, mockPipeline, mockReActEngine);
  });

  describe('processRequest', () => {
    it('should process request through ReAct engine', async () => {
      const request = {
        agentType: 'lead',
        data: { name: 'John Doe' },
        context: { tenantId: 'tenant-123' }
      };

      const expectedResponse = {
        success: true,
        reasoning: 'Lead shows high potential',
        action: { type: 'score', value: 85 },
        observation: { result: 'success' },
        confidence: 0.9
      };

      mockReActEngine.process.mockResolvedValue(expectedResponse);

      const result = await service.processRequest(request);

      expect(result).toEqual(expectedResponse);
      expect(mockReActEngine.process).toHaveBeenCalledWith(request);
    });

    it('should coordinate with other agents when needed', async () => {
      const request = {
        agentType: 'lead',
        data: { name: 'John Doe' },
        context: { tenantId: 'tenant-123' }
      };

      const response = {
        success: true,
        requiresCoordination: true,
        coordinationTargets: ['crm', 'compliance']
      };

      mockReActEngine.process.mockResolvedValue(response);
      mockMsgHub.sendMessage.mockResolvedValue(undefined);

      await service.processRequest(request);

      expect(mockMsgHub.sendMessage).toHaveBeenCalledWith(
        'tenant-123',
        'crm',
        expect.objectContaining({
          type: 'coordination',
          source: 'lead',
          data: request.data
        })
      );
    });
  });

  describe('coordinateAgents', () => {
    it('should send messages to all coordination targets', async () => {
      const response = {
        requiresCoordination: true,
        coordinationTargets: ['crm', 'compliance'],
        data: { leadId: 'lead-123' }
      };

      await service.coordinateAgents(response, 'tenant-123');

      expect(mockMsgHub.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockMsgHub.sendMessage).toHaveBeenCalledWith(
        'tenant-123',
        'crm',
        expect.objectContaining({ data: { leadId: 'lead-123' } })
      );
      expect(mockMsgHub.sendMessage).toHaveBeenCalledWith(
        'tenant-123',
        'compliance',
        expect.objectContaining({ data: { leadId: 'lead-123' } })
      );
    });
  });
});
```

---

## 3) Integration Testing

### 3.1 API Integration Tests
```typescript
// Example: Lead API Integration Test
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { DatabaseService } from '../database/database.service';

describe('Lead API (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    
    await app.init();
    await databaseService.seedTestData();
  });

  afterAll(async () => {
    await databaseService.cleanup();
    await app.close();
  });

  describe('POST /api/v1/leads', () => {
    it('should create lead successfully', async () => {
      const leadData = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        phone: '+45 12 34 56 78',
        source: 'website'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/leads')
        .set('Authorization', 'Bearer test-token')
        .set('X-Tenant-ID', 'tenant-123')
        .send(leadData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: leadData.name,
        email: leadData.email,
        company: leadData.company,
        phone: leadData.phone,
        source: leadData.source,
        score: expect.any(Number),
        status: 'new',
        createdAt: expect.any(String)
      });
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: '', // Empty name
        email: 'invalid-email', // Invalid email
        company: 'Acme Corp'
      };

      await request(app.getHttpServer())
        .post('/api/v1/leads')
        .set('Authorization', 'Bearer test-token')
        .set('X-Tenant-ID', 'tenant-123')
        .send(invalidData)
        .expect(400);
    });

    it('should return 401 for missing authorization', async () => {
      const leadData = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp'
      };

      await request(app.getHttpServer())
        .post('/api/v1/leads')
        .send(leadData)
        .expect(401);
    });
  });

  describe('GET /api/v1/leads', () => {
    it('should return leads for tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/leads')
        .set('Authorization', 'Bearer test-token')
        .set('X-Tenant-ID', 'tenant-123')
        .expect(200);

      expect(response.body).toHaveProperty('leads');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.leads)).toBe(true);
    });

    it('should filter leads by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/leads?status=qualified')
        .set('Authorization', 'Bearer test-token')
        .set('X-Tenant-ID', 'tenant-123')
        .expect(200);

      expect(response.body.leads.every(lead => lead.status === 'qualified')).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/leads?page=1&limit=10')
        .set('Authorization', 'Bearer test-token')
        .set('X-Tenant-ID', 'tenant-123')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        pages: expect.any(Number)
      });
    });
  });

  describe('PUT /api/v1/leads/:id', () => {
    it('should update lead successfully', async () => {
      const leadId = 'lead-123';
      const updateData = {
        name: 'John Updated',
        phone: '+45 98 76 54 32'
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/leads/${leadId}`)
        .set('Authorization', 'Bearer test-token')
        .set('X-Tenant-ID', 'tenant-123')
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.phone).toBe(updateData.phone);
    });

    it('should return 404 for non-existent lead', async () => {
      const updateData = {
        name: 'John Updated'
      };

      await request(app.getHttpServer())
        .put('/api/v1/leads/non-existent')
        .set('Authorization', 'Bearer test-token')
        .set('X-Tenant-ID', 'tenant-123')
        .send(updateData)
        .expect(404);
    });
  });
});
```

### 3.2 Database Integration Tests
```typescript
// Example: Database Integration Test
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { LeadRepository } from './lead.repository';

describe('Database Integration', () => {
  let databaseService: DatabaseService;
  let leadRepository: LeadRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService, LeadRepository],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    leadRepository = module.get<LeadRepository>(LeadRepository);
    
    await databaseService.connect();
  });

  afterAll(async () => {
    await databaseService.disconnect();
  });

  beforeEach(async () => {
    await databaseService.cleanup();
  });

  describe('Lead Repository', () => {
    it('should create lead in database', async () => {
      const leadData = {
        tenantId: 'tenant-123',
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        score: 85,
        status: 'new'
      };

      const lead = await leadRepository.create(leadData);

      expect(lead.id).toBeDefined();
      expect(lead.name).toBe(leadData.name);
      expect(lead.email).toBe(leadData.email);
      expect(lead.company).toBe(leadData.company);
      expect(lead.score).toBe(leadData.score);
      expect(lead.status).toBe(leadData.status);
      expect(lead.createdAt).toBeDefined();
    });

    it('should find lead by ID', async () => {
      const leadData = {
        tenantId: 'tenant-123',
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp'
      };

      const createdLead = await leadRepository.create(leadData);
      const foundLead = await leadRepository.findById(createdLead.id);

      expect(foundLead).toEqual(createdLead);
    });

    it('should update lead in database', async () => {
      const leadData = {
        tenantId: 'tenant-123',
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp'
      };

      const createdLead = await leadRepository.create(leadData);
      const updateData = { name: 'John Updated', score: 90 };
      
      const updatedLead = await leadRepository.update(createdLead.id, updateData);

      expect(updatedLead.name).toBe(updateData.name);
      expect(updatedLead.score).toBe(updateData.score);
      expect(updatedLead.updatedAt).toBeDefined();
    });

    it('should find leads by tenant', async () => {
      const tenantId = 'tenant-123';
      const leads = [
        { tenantId, name: 'John Doe', email: 'john@example.com' },
        { tenantId, name: 'Jane Smith', email: 'jane@example.com' }
      ];

      for (const lead of leads) {
        await leadRepository.create(lead);
      }

      const foundLeads = await leadRepository.findByTenant(tenantId);

      expect(foundLeads).toHaveLength(2);
      expect(foundLeads.map(l => l.name)).toContain('John Doe');
      expect(foundLeads.map(l => l.name)).toContain('Jane Smith');
    });

    it('should handle concurrent updates', async () => {
      const leadData = {
        tenantId: 'tenant-123',
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp'
      };

      const createdLead = await leadRepository.create(leadData);

      // Simulate concurrent updates
      const update1 = leadRepository.update(createdLead.id, { name: 'John Updated 1' });
      const update2 = leadRepository.update(createdLead.id, { name: 'John Updated 2' });

      await Promise.all([update1, update2]);

      const finalLead = await leadRepository.findById(createdLead.id);
      expect(finalLead.name).toBeDefined();
    });
  });
});
```

---

## 4) End-to-End Testing

### 4.1 E2E Test Setup
```typescript
// Example: E2E Test Setup
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { DatabaseService } from '../database/database.service';
import { AgentScopeService } from '../agent-scope/agent-scope.service';

describe('Tekup 2.0 E2E Tests', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let agentScopeService: AgentScopeService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    agentScopeService = moduleFixture.get<AgentScopeService>(AgentScopeService);
    
    await app.init();
    await databaseService.seedTestData();
  });

  afterAll(async () => {
    await databaseService.cleanup();
    await app.close();
  });

  beforeEach(async () => {
    await databaseService.cleanup();
    await databaseService.seedTestData();
  });
});
```

### 4.2 Critical User Journeys
```typescript
// Example: Lead to Deal Conversion E2E Test
describe('Lead to Deal Conversion Flow', () => {
  it('should convert lead to deal successfully', async () => {
    // 1. Create lead
    const leadResponse = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        phone: '+45 12 34 56 78',
        source: 'website'
      })
      .expect(201);

    const leadId = leadResponse.body.id;

    // 2. Verify AI analysis was triggered
    expect(agentScopeService.processRequest).toHaveBeenCalledWith({
      agentType: 'lead',
      data: expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp'
      }),
      context: { tenantId: 'tenant-123' }
    });

    // 3. Update lead status to qualified
    await request(app.getHttpServer())
      .put(`/api/v1/leads/${leadId}`)
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .send({ status: 'qualified' })
      .expect(200);

    // 4. Convert lead to deal
    const dealResponse = await request(app.getHttpServer())
      .post('/api/v1/deals')
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .send({
        name: 'Acme Corp - Q1 Implementation',
        value: 50000,
        stage: 'prospecting',
        leadId: leadId
      })
      .expect(201);

    const dealId = dealResponse.body.id;

    // 5. Verify deal was created
    expect(dealResponse.body).toMatchObject({
      id: expect.any(String),
      name: 'Acme Corp - Q1 Implementation',
      value: 50000,
      stage: 'prospecting',
      leadId: leadId
    });

    // 6. Verify lead status was updated
    const updatedLead = await request(app.getHttpServer())
      .get(`/api/v1/leads/${leadId}`)
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .expect(200);

    expect(updatedLead.body.status).toBe('converted');
    expect(updatedLead.body.dealId).toBe(dealId);
  });

  it('should handle lead conversion failure gracefully', async () => {
    // 1. Create lead
    const leadResponse = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp'
      })
      .expect(201);

    const leadId = leadResponse.body.id;

    // 2. Mock deal creation failure
    jest.spyOn(agentScopeService, 'processRequest').mockRejectedValueOnce(
      new Error('CRM service unavailable')
    );

    // 3. Attempt to convert lead to deal
    await request(app.getHttpServer())
      .post('/api/v1/deals')
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .send({
        name: 'Acme Corp - Q1 Implementation',
        value: 50000,
        stage: 'prospecting',
        leadId: leadId
      })
      .expect(500);

    // 4. Verify lead status was not changed
    const lead = await request(app.getHttpServer())
      .get(`/api/v1/leads/${leadId}`)
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .expect(200);

    expect(lead.body.status).toBe('new');
    expect(lead.body.dealId).toBeUndefined();
  });
});
```

### 4.3 Cross-App Integration Tests
```typescript
// Example: Cross-App Integration Test
describe('Cross-App Integration', () => {
  it('should process document through Inbox AI and create compliance check', async () => {
    // 1. Upload document to Inbox AI
    const documentResponse = await request(app.getHttpServer())
      .post('/api/v1/documents')
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .attach('file', Buffer.from('test document content'), 'test.pdf')
      .expect(201);

    const documentId = documentResponse.body.id;

    // 2. Trigger document analysis
    const analysisResponse = await request(app.getHttpServer())
      .post(`/api/v1/documents/${documentId}/analyze`)
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .send({ analysisType: 'compliance' })
      .expect(200);

    // 3. Verify compliance check was created
    const complianceResponse = await request(app.getHttpServer())
      .get('/api/v1/compliance/checks')
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .expect(200);

    expect(complianceResponse.body.checks).toHaveLength(1);
    expect(complianceResponse.body.checks[0].documentId).toBe(documentId);
    expect(complianceResponse.body.checks[0].status).toBe('pending');

    // 4. Verify AI analysis was triggered
    expect(agentScopeService.processRequest).toHaveBeenCalledWith({
      agentType: 'compliance',
      data: expect.objectContaining({
        documentId: documentId,
        analysisType: 'compliance'
      }),
      context: { tenantId: 'tenant-123' }
    });
  });

  it('should coordinate agents across different apps', async () => {
    // 1. Create lead
    const leadResponse = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp'
      })
      .expect(201);

    const leadId = leadResponse.body.id;

    // 2. Mock agent coordination
    const mockCoordination = jest.fn();
    jest.spyOn(agentScopeService, 'coordinateAgents').mockImplementation(mockCoordination);

    // 3. Update lead to trigger coordination
    await request(app.getHttpServer())
      .put(`/api/v1/leads/${leadId}`)
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .send({ status: 'qualified' })
      .expect(200);

    // 4. Verify coordination was triggered
    expect(mockCoordination).toHaveBeenCalledWith(
      expect.objectContaining({
        requiresCoordination: true,
        coordinationTargets: expect.arrayContaining(['crm', 'compliance'])
      }),
      'tenant-123'
    );
  });
});
```

---

## 5) Performance Testing

### 5.1 Load Testing
```typescript
// Example: Load Test
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  it('should handle 1000 concurrent lead creations', async () => {
    const startTime = performance.now();
    const promises = [];

    for (let i = 0; i < 1000; i++) {
      promises.push(
        request(app.getHttpServer())
          .post('/api/v1/leads')
          .set('Authorization', 'Bearer test-token')
          .set('X-Tenant-ID', 'tenant-123')
          .send({
            name: `User ${i}`,
            email: `user${i}@example.com`,
            company: `Company ${i}`
          })
      );
    }

    const results = await Promise.all(promises);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Verify all requests succeeded
    results.forEach(result => {
      expect(result.status).toBe(201);
    });

    // Verify performance requirements
    expect(duration).toBeLessThan(30000); // 30 seconds
    expect(duration / 1000).toBeLessThan(30); // 30ms per request average
  });

  it('should handle 100 concurrent agent requests', async () => {
    const startTime = performance.now();
    const promises = [];

    for (let i = 0; i < 100; i++) {
      promises.push(
        request(app.getHttpServer())
          .post('/api/v1/jarvis/conversations')
          .set('Authorization', 'Bearer test-token')
          .set('X-Tenant-ID', 'tenant-123')
          .send({
            participants: ['lead-agent'],
            context: { leadId: `lead-${i}` },
            goal: 'Analyze lead potential'
          })
      );
    }

    const results = await Promise.all(promises);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Verify all requests succeeded
    results.forEach(result => {
      expect(result.status).toBe(201);
    });

    // Verify performance requirements
    expect(duration).toBeLessThan(10000); // 10 seconds
    expect(duration / 100).toBeLessThan(100); // 100ms per request average
  });
});
```

### 5.2 Stress Testing
```typescript
// Example: Stress Test
describe('Stress Tests', () => {
  it('should maintain performance under high load', async () => {
    const startTime = performance.now();
    const promises = [];

    // Create 5000 leads over 1 minute
    for (let i = 0; i < 5000; i++) {
      promises.push(
        request(app.getHttpServer())
          .post('/api/v1/leads')
          .set('Authorization', 'Bearer test-token')
          .set('X-Tenant-ID', 'tenant-123')
          .send({
            name: `User ${i}`,
            email: `user${i}@example.com`,
            company: `Company ${i}`
          })
      );

      // Add delay to simulate realistic load
      if (i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const results = await Promise.all(promises);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Verify success rate
    const successCount = results.filter(r => r.status === 201).length;
    const successRate = successCount / results.length;
    expect(successRate).toBeGreaterThan(0.95); // 95% success rate

    // Verify performance
    expect(duration).toBeLessThan(60000); // 1 minute
  });
});
```

---

## 6) Security Testing

### 6.1 Authentication & Authorization Tests
```typescript
// Example: Security Test
describe('Security Tests', () => {
  it('should reject requests without valid token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/leads')
      .expect(401);
  });

  it('should reject requests with invalid token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/leads')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('should enforce tenant isolation', async () => {
    // Create lead for tenant-123
    const leadResponse = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp'
      })
      .expect(201);

    const leadId = leadResponse.body.id;

    // Try to access lead from different tenant
    await request(app.getHttpServer())
      .get(`/api/v1/leads/${leadId}`)
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-456')
      .expect(404);
  });

  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE leads; --";
    
    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .send({
        name: maliciousInput,
        email: 'john@example.com',
        company: 'Acme Corp'
      })
      .expect(400);
  });

  it('should prevent XSS attacks', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const response = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', 'Bearer test-token')
      .set('X-Tenant-ID', 'tenant-123')
      .send({
        name: xssPayload,
        email: 'john@example.com',
        company: 'Acme Corp'
      })
      .expect(201);

    // Verify XSS payload was sanitized
    expect(response.body.name).not.toContain('<script>');
    expect(response.body.name).not.toContain('alert');
  });
});
```

### 6.2 Rate Limiting Tests
```typescript
// Example: Rate Limiting Test
describe('Rate Limiting Tests', () => {
  it('should enforce rate limits', async () => {
    const promises = [];

    // Send 1000 requests (exceeding rate limit)
    for (let i = 0; i < 1000; i++) {
      promises.push(
        request(app.getHttpServer())
          .get('/api/v1/leads')
          .set('Authorization', 'Bearer test-token')
          .set('X-Tenant-ID', 'tenant-123')
      );
    }

    const results = await Promise.all(promises);
    
    // Count successful requests
    const successCount = results.filter(r => r.status === 200).length;
    const rateLimitedCount = results.filter(r => r.status === 429).length;

    // Verify rate limiting is working
    expect(rateLimitedCount).toBeGreaterThan(0);
    expect(successCount).toBeLessThan(1000);
  });
});
```

---

## 7) Test Automation

### 7.1 CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: tekup_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:performance
```

### 7.2 Test Data Management
```typescript
// Example: Test Data Factory
export class TestDataFactory {
  static createLead(overrides: Partial<Lead> = {}): Lead {
    return {
      id: faker.datatype.uuid(),
      tenantId: 'tenant-123',
      name: faker.name.fullName(),
      email: faker.internet.email(),
      company: faker.company.name(),
      phone: faker.phone.number(),
      source: faker.helpers.arrayElement(['website', 'phone', 'email', 'referral']),
      score: faker.datatype.number({ min: 0, max: 100 }),
      status: faker.helpers.arrayElement(['new', 'contacted', 'qualified', 'converted']),
      data: {},
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createDeal(overrides: Partial<Deal> = {}): Deal {
    return {
      id: faker.datatype.uuid(),
      tenantId: 'tenant-123',
      name: faker.company.catchPhrase(),
      value: faker.datatype.number({ min: 1000, max: 100000 }),
      stage: faker.helpers.arrayElement(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed']),
      ownerId: faker.datatype.uuid(),
      contactId: faker.datatype.uuid(),
      companyId: faker.datatype.uuid(),
      probability: faker.datatype.number({ min: 0, max: 100 }),
      closeDate: faker.date.future(),
      data: {},
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: faker.datatype.uuid(),
      tenantId: 'tenant-123',
      email: faker.internet.email(),
      name: faker.name.fullName(),
      role: faker.helpers.arrayElement(['owner', 'admin', 'manager', 'operator', 'analyst']),
      permissions: [],
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }
}
```

---

## 8) Test Monitoring & Reporting

### 8.1 Test Metrics
```typescript
// Example: Test Metrics Collection
export class TestMetrics {
  private static metrics: Map<string, number> = new Map();

  static recordTestExecution(testName: string, duration: number, status: 'pass' | 'fail') {
    this.metrics.set(`${testName}_duration`, duration);
    this.metrics.set(`${testName}_status`, status === 'pass' ? 1 : 0);
  }

  static recordCoverage(component: string, coverage: number) {
    this.metrics.set(`${component}_coverage`, coverage);
  }

  static recordPerformance(operation: string, duration: number) {
    this.metrics.set(`${operation}_performance`, duration);
  }

  static getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }
}
```

### 8.2 Test Reporting
```typescript
// Example: Test Report Generator
export class TestReportGenerator {
  static generateReport(testResults: TestResult[]): TestReport {
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'pass').length;
    const failedTests = testResults.filter(r => r.status === 'fail').length;
    const coverage = this.calculateCoverage(testResults);

    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        coverage: coverage
      },
      details: testResults,
      recommendations: this.generateRecommendations(testResults)
    };
  }

  private static calculateCoverage(testResults: TestResult[]): number {
    const coveredLines = testResults.reduce((sum, result) => sum + result.coveredLines, 0);
    const totalLines = testResults.reduce((sum, result) => sum + result.totalLines, 0);
    return totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;
  }

  private static generateRecommendations(testResults: TestResult[]): string[] {
    const recommendations: string[] = [];
    
    const failedTests = testResults.filter(r => r.status === 'fail');
    if (failedTests.length > 0) {
      recommendations.push(`Fix ${failedTests.length} failing tests`);
    }

    const lowCoverageTests = testResults.filter(r => r.coverage < 80);
    if (lowCoverageTests.length > 0) {
      recommendations.push(`Improve coverage for ${lowCoverageTests.length} components`);
    }

    const slowTests = testResults.filter(r => r.duration > 5000);
    if (slowTests.length > 0) {
      recommendations.push(`Optimize ${slowTests.length} slow tests`);
    }

    return recommendations;
  }
}
```

---

Dette dokument fungerer som reference for testimplementering og kvalitetssikring. Opdateres løbende baseret på ændringer og feedback.

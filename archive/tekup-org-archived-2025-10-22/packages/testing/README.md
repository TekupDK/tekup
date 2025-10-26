# 🧪 Tekup-org Testing Package

Comprehensive testing infrastructure for the multi-business Tekup-org platform. This package provides testing utilities, business-specific test suites, AI agent testing, and performance testing capabilities.

## 🚀 Features

- **Multi-Tenant Testing**: Isolated test databases with tenant isolation
- **Business-Specific Test Suites**: Foodtruck Fiesta, Essenza Perfume, Rendetalje, Cross-Business
- **AI Agent Testing**: Voice agent testing with Danish language support
- **Performance Testing**: Load testing, stress testing, and metrics validation
- **Comprehensive Coverage**: Unit, integration, E2E, and performance testing

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test
```

## 🏗️ Architecture

### Core Testing Utilities
- **Test Database**: Isolated PostgreSQL containers for testing
- **Test Tenant**: Multi-tenant test data and isolation
- **Test Fixtures**: Reusable test data and configurations

### Business Test Suites
- **Foodtruck Fiesta**: Location services, mobile ordering, payment processing
- **Essenza Perfume**: Inventory management, customer recommendations
- **Rendetalje**: Project management, customer communications
- **Cross-Business**: Analytics, customer sync, financial consolidation

### AI Agent Testing
- **Voice Agent**: Danish language command recognition and response
- **Mobile Agent**: Performance on various devices and network conditions
- **MCP Server**: Server deployment, health checks, workflow execution
- **Cross-Agent Communication**: Data flow and coordination testing

### Performance Testing
- **Load Testing**: Concurrent user simulation and RPS testing
- **Stress Testing**: System limits and failure scenarios
- **Metrics Validation**: Performance metrics and SLA validation

## 🧪 Usage Examples

### Basic Testing Setup

```typescript
import { createTestDatabase, createTestTenant, TENANT_CONFIGS } from '@tekup/testing';

describe('Multi-Tenant Testing', () => {
  let testDb: TestDatabase;
  let testTenant: TestTenant;

  beforeAll(async () => {
    // Start isolated test database
    testDb = createTestDatabase();
    await testDb.start();
    
    // Create test tenant
    testTenant = createTestTenant(testDb.getPrisma(), TENANT_CONFIGS.FOODTRUCK_FIESTA);
    await testTenant.createTenant(TENANT_CONFIGS.FOODTRUCK_FIESTA);
  });

  afterAll(async () => {
    await testDb.stop();
  });

  it('should isolate tenant data', async () => {
    // Test tenant isolation
    await testTenant.setTenantContext();
    const leads = await testTenant.createTestLeads(5);
    expect(leads).toHaveLength(5);
  });
});
```

### Voice Agent Testing

```typescript
import { createVoiceAgentTester } from '@tekup/testing';

describe('Voice Agent Testing', () => {
  let voiceTester: VoiceAgentTester;

  beforeEach(() => {
    voiceTester = createVoiceAgentTester();
  });

  it('should recognize Danish commands', async () => {
    const danishCommands = voiceTester.getCommandsByBusiness('foodtruck');
    const results = await voiceTester.testDanishLanguageProcessing();
    
    expect(results.results.length).toBeGreaterThan(0);
    expect(results.results.every(r => r.processingTime < 1000)).toBe(true);
  });

  it('should extract entities correctly', async () => {
    const commands = voiceTester.getCommandsByBusiness('foodtruck');
    const entityResults = await voiceTester.testEntityExtraction(commands);
    
    expect(entityResults.accuracy).toBeGreaterThan(0.9);
  });
});
```

### Business Suite Testing

```typescript
import { createFoodtruckFiestaTester } from '@tekup/testing';

describe('Foodtruck Fiesta Testing', () => {
  let foodtruckTester: FoodtruckFiestaTester;

  beforeEach(() => {
    foodtruckTester = createFoodtruckFiestaTester(prisma);
  });

  it('should test complete workflow', async () => {
    const workflow = await foodtruckTester.testCompleteWorkflow();
    
    expect(workflow.success).toBe(true);
    expect(workflow.errors).toHaveLength(0);
    expect(workflow.performance.averageResponseTime).toBeLessThan(2000);
  });

  it('should test location services', async () => {
    const locationTest = await foodtruckTester.testLocationServices();
    
    expect(locationTest.success).toBe(true);
    expect(locationTest.tests.every(t => t.passed)).toBe(true);
  });
});
```

### Performance Testing

```typescript
import { createLoadTester } from '@tekup/testing';

describe('Performance Testing', () => {
  let loadTester: LoadTester;

  beforeEach(() => {
    loadTester = createLoadTester();
  });

  it('should handle voice agent load', async () => {
    const config = {
      concurrentUsers: 50,
      duration: 60,
      rampUpTime: 10,
      targetRPS: 100,
      businessType: 'foodtruck' as const,
      testScenario: 'voice' as const,
    };

    const result = await loadTester.testVoiceAgentLoad(config);
    
    expect(result.success).toBe(true);
    expect(result.summary.errorRate).toBeLessThan(5);
    expect(result.summary.p95ResponseTime).toBeLessThan(2000);
  });

  it('should handle mixed workload', async () => {
    const config = {
      concurrentUsers: 100,
      duration: 120,
      rampUpTime: 20,
      targetRPS: 200,
      businessType: 'cross-business' as const,
      testScenario: 'mixed' as const,
    };

    const result = await loadTester.testMixedWorkload(config);
    
    expect(result.success).toBe(true);
    expect(result.summary.requestsPerSecond).toBeGreaterThan(50);
  });
});
```

## 🔧 Configuration

### Jest Configuration

The package provides multiple Jest configurations for different testing scenarios:

```typescript
import { jestConfigs } from '@tekup/testing';

// Unit testing
export default jestConfigs.unit;

// Integration testing
export default jestConfigs.integration;

// E2E testing
export default jestConfigs.e2e;

// Voice agent testing
export default jestConfigs.voiceAgent;

// Business suite testing
export default jestConfigs.businessSuite;

// Performance testing
export default jestConfigs.performance;
```

### Test Environment Variables

```bash
# Database configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=tekup_test
TEST_DB_USER=test_user
TEST_DB_PASSWORD=test_password

# AI API keys (for mocking)
GEMINI_API_KEY=test_key
OPENAI_API_KEY=test_key

# Performance testing
TEST_CONCURRENT_USERS=100
TEST_DURATION=300
TEST_TARGET_RPS=500
```

## 📊 Test Coverage

The testing package aims for comprehensive coverage:

- **Unit Tests**: 90%+ coverage for business logic
- **Integration Tests**: 85%+ coverage for API endpoints
- **E2E Tests**: 80%+ coverage for critical workflows
- **Performance Tests**: 95%+ coverage for load scenarios

## 🚦 CI/CD Integration

### GitHub Actions

```yaml
name: Testing Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run unit tests
        run: pnpm test:unit
      
      - name: Run integration tests
        run: pnpm test:integration
      
      - name: Run E2E tests
        run: pnpm test:e2e
      
      - name: Run performance tests
        run: pnpm test:performance
      
      - name: Generate coverage report
        run: pnpm test:coverage
```

### Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --config jest.config.unit.js",
    "test:integration": "jest --config jest.config.integration.js",
    "test:e2e": "jest --config jest.config.e2e.js",
    "test:voice": "jest --config jest.config.voice-agent.js",
    "test:business": "jest --config jest.config.business-suite.js",
    "test:performance": "jest --config jest.config.performance.js",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

## 🔍 Monitoring and Reporting

### Test Results

The testing package provides comprehensive test results:

- **Performance Metrics**: Response times, throughput, error rates
- **Business Metrics**: Workflow success rates, tenant isolation
- **AI Agent Metrics**: Command recognition accuracy, entity extraction
- **Coverage Reports**: Line, branch, function, and statement coverage

### Custom Metrics

```typescript
import { MetricsService } from '@tekup/testing';

// Track custom business metrics
MetricsService.trackMetric('voice_command_accuracy', 0.95, {
  business: 'foodtruck',
  language: 'da',
});

// Track performance metrics
MetricsService.trackMetric('order_processing_time', 1500, {
  business: 'foodtruck',
  order_type: 'voice',
});
```

## 🛠️ Development

### Adding New Test Suites

1. Create business-specific test suite in `src/suites/`
2. Implement business logic testing methods
3. Add voice command testing for AI integration
4. Create performance testing scenarios
5. Update Jest configuration for new suite

### Adding New AI Agent Tests

1. Create agent test file in `src/agents/`
2. Implement agent-specific testing methods
3. Add language-specific test cases
4. Create performance testing for agent workflows
5. Update test configuration

### Contributing

1. Follow the existing code structure and patterns
2. Add comprehensive test coverage for new features
3. Update documentation and examples
4. Ensure all tests pass in CI/CD pipeline
5. Add performance testing for new workflows

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testcontainers Documentation](https://testcontainers.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Artillery Documentation](https://www.artillery.io/docs)

## 🤝 Support

For questions or issues with the testing package:

1. Check the existing test examples
2. Review the Jest configuration options
3. Check the CI/CD pipeline configuration
4. Create an issue with detailed error information
5. Contact the testing team for complex scenarios
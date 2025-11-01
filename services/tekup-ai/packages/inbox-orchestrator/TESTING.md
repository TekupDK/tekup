# 🧪 Friday AI - Testing Guide

## Overview

Friday AI uses Jest for comprehensive testing. The test suite covers utilities, formatters, monitoring, and integration scenarios.

## Quick Start

```bash
# Install dependencies (if not done)
npm install

# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

## Test Structure

```
src/
├── __tests__/
│   ├── utils/
│   │   ├── tokenCounter.test.ts          # Token estimation tests
│   │   └── intentDetector.test.ts        # Intent detection tests
│   ├── formatters/
│   │   └── responseTemplates.test.ts     # Response template tests
│   ├── monitoring/
│   │   └── metricsLogger.test.ts         # Metrics logging tests
│   └── integration/
│       └── chat.test.ts                  # Integration tests (TODO)
```

## Test Categories

### 1. Unit Tests

**Token Counter (`tokenCounter.test.ts`)**
- Token estimation accuracy
- Cost calculation
- Prompt size validation
- Danish text handling

**Intent Detector (`intentDetector.test.ts`)**
- Intent detection from user messages
- Memory selection per intent
- Keyword extraction
- Confidence scoring

**Response Templates (`responseTemplates.test.ts`)**
- Lead summary formatting
- Calendar task formatting
- Booking confirmation format
- Quote formatting
- Next steps formatting

**Metrics Logger (`metricsLogger.test.ts`)**
- Metrics storage and retrieval
- Summary calculations
- Time window filtering
- Metric limits

### 2. Integration Tests

**Chat Endpoint (`chat.test.ts`)**
- Full chat flow
- Memory enforcement
- Response generation
- Error handling

## Running Specific Tests

```bash
# Run only unit tests
npm test -- tokenCounter

# Run only formatter tests
npm test -- responseTemplates

# Run with pattern matching
npm test -- --testNamePattern="Intent Detector"
```

## Coverage

Current coverage targets:
- **Lines**: 80%+
- **Functions**: 75%+
- **Branches**: 70%+
- **Statements**: 80%+

View coverage report:
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in browser
```

## Test Best Practices

### 1. Test Organization
- Follow Arrange-Act-Assert pattern
- Use descriptive test names
- Keep tests independent
- Mock external dependencies

### 2. Mocking
- Mock Gmail API calls
- Mock Calendar API calls
- Mock Gemini AI responses
- Mock Billy API calls

### 3. Test Data
- Use realistic test data
- Test edge cases
- Test error scenarios
- Test boundary conditions

## Example Test

```typescript
describe('Token Counter', () => {
  it('should estimate tokens correctly', () => {
    const text = 'Hello, Friday AI!';
    const tokens = estimateTokens(text);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(10);
  });
});
```

## Continuous Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests
- Manual workflow triggers

## Troubleshooting

### Common Issues

**Tests timeout:**
- Increase timeout in test: `jest.setTimeout(10000)`
- Check for unclosed async operations

**Module resolution errors:**
- Ensure `jest.config.js` has correct `moduleNameMapper`
- Check `tsconfig.json` paths

**ES Module errors:**
- Ensure `jest.config.js` has `useESM: true`
- Check `package.json` has `"type": "module"`

### Debug Mode

```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Run with verbose output
npm test -- --verbose

# Run single test file
npm test -- tokenCounter.test.ts
```

## Adding New Tests

1. Create test file: `src/__tests__/category/feature.test.ts`
2. Import functions to test
3. Write test cases (Arrange-Act-Assert)
4. Run tests: `npm test`
5. Ensure coverage stays above thresholds

## Test Dependencies

- **Jest**: Test framework
- **ts-jest**: TypeScript support
- **@types/jest**: Type definitions

All dependencies are in `devDependencies`.

## Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Add performance benchmarks
- [ ] Add load testing
- [ ] Add security tests
- [ ] Add visual regression tests (if UI added)


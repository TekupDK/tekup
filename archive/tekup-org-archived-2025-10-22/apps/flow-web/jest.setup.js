import '@testing-library/jest-dom'
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-web-jest-setup-js');


// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return '/t/test-tenant/leads'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock CSS custom properties
const originalGetComputedStyle = window.getComputedStyle
window.getComputedStyle = function(element, pseudoElement) {
  const styles = originalGetComputedStyle.call(this, element, pseudoElement)
  
  // Mock CSS custom properties for tenant branding
  const mockStyles = {
    ...styles,
    getPropertyValue: (property) => {
      if (property === '--px-primary') {
        return '#2563eb' // Default brand color for tests
      }
      return styles.getPropertyValue(property)
    }
  }
  
  return mockStyles
}

// Suppress console errors in tests unless explicitly testing error scenarios
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Global test utilities
global.testUtils = {
  // Helper to create mock lead data
  createMockLead: (overrides = {}) => ({
    id: 'test-lead-1',
    tenant_id: 'test-tenant',
    source: 'form',
    status: 'new',
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    payload: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      message: 'Test message'
    },
    ...overrides
  }),
  
  // Helper to create mock events
  createMockEvent: (overrides = {}) => ({
    id: 'test-event-1',
    lead_id: 'test-lead-1',
    fromStatus: null,
    toStatus: 'new',
    createdAt: '2024-01-01T12:00:00Z',
    actor: 'system',
    ...overrides
  }),
  
  // Helper to wait for async operations
  waitForAsync: () => new Promise(resolve => setTimeout(resolve, 0))
}
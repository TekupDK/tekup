import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    DEV: false,
    PROD: true,
    MODE: 'test',
    VITE_SENTRY_DSN: '',
    VITE_APP_VERSION: '1.0.0-test'
  },
  writable: true
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    reload: vi.fn(),
  },
  writable: true
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
}
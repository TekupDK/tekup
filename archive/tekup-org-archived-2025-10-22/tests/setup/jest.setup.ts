import '@testing-library/jest-dom';
import { server } from './msw-server';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      prefetch: jest.fn(),
    };
  },
}));

// Mock TekUp SSO
jest.mock('@tekup/sso', () => ({
  useAuth: () => ({
    user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
    loading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
  TekUpSSOProvider: ({ children }: { children: React.ReactNode }) => children,
  CurrentUser: () => ({ id: 'test-user', name: 'Test User' }),
  CurrentTenant: () => ({ id: 'test-tenant', name: 'Test Tenant' }),
  TekUpAuthGuard: jest.fn(),
}));

// Mock React Query
jest.mock('react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

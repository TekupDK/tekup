/**
 * Test Utilities
 * Common mocks, factories, and helpers for testing
 */

import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@tekup/database';

/**
 * Mock Prisma Client for testing
 * Usage:
 * ```ts
 * const mockPrismaService = createMockPrismaService();
 * mockPrismaService.renosCustomer.findMany.mockResolvedValue([...]);
 * ```
 */
export type MockPrismaService = DeepMockProxy<PrismaClient>;

export function createMockPrismaService(): MockPrismaService {
  return mockDeep<PrismaClient>();
}

/**
 * Reset all mocks between tests
 */
export function resetMockPrismaService(mockPrisma: MockPrismaService): void {
  mockReset(mockPrisma);
}

/**
 * Mock user for testing authentication
 */
export const mockUser = {
  id: 'user-test-123',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+45 12345678',
  role: 'admin',
  passwordHash: '$2b$04$test.hash.for.testing.only',
  isActive: true,
  lastLoginAt: new Date('2025-10-24T00:00:00Z'),
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-10-24T00:00:00Z'),
};

/**
 * Mock JWT tokens for testing
 */
export const mockTokens = {
  accessToken: 'mock.jwt.access.token',
  refreshToken: 'mock.jwt.refresh.token',
};

/**
 * Mock customer data (matches RenosCustomer Prisma model)
 */
export const mockCustomer = {
  id: 'customer-test-123',
  name: 'Test Customer',
  email: 'customer@example.com',
  phone: '+45 87654321',
  address: 'Test Street 123, Copenhagen',
  companyName: 'Test Company A/S',
  notes: 'Test customer for unit tests',
  status: 'active',
  tags: ['vip', 'recurring'],
  totalLeads: 5,
  totalBookings: 10,
  totalRevenue: 25000,
  lastContactAt: new Date('2025-10-20T00:00:00Z'),
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-10-24T00:00:00Z'),
};

/**
 * Mock lead data
 */
export const mockLead = {
  id: 'lead-test-123',
  sessionId: 'ses-test-123',
  customerId: null,
  source: 'website',
  name: 'Test Lead',
  email: 'lead@example.com',
  phone: '+45 11223344',
  address: 'Lead Street 456, 8000 Aarhus',
  squareMeters: 85.5,
  rooms: 3,
  taskType: 'standard',
  preferredDates: ['2025-10-25', '2025-10-26'],
  status: 'new',
  emailThreadId: null,
  followUpAttempts: 0,
  lastFollowUpDate: null,
  idempotencyKey: 'idem-test-123',
  companyName: 'Test Company',
  industry: 'Technology',
  estimatedSize: '11-50 employees',
  estimatedValue: 5000,
  enrichmentData: { website: 'https://test.com' },
  lastEnriched: new Date('2025-10-20T00:00:00Z'),
  score: 75,
  priority: 'high',
  lastScored: new Date('2025-10-21T00:00:00Z'),
  scoreMetadata: { confidence: 0.85 },
  createdAt: new Date('2025-10-01T00:00:00Z'),
  updatedAt: new Date('2025-10-24T00:00:00Z'),
};

/**
 * Mock team member data
 */
export const mockTeamMember = {
  id: 'team-test-123',
  organizationId: 'org-test-123',
  userId: 'user-test-123',
  name: 'Test Team Member',
  email: 'team@example.com',
  phone: '+45 99887766',
  role: 'cleaner',
  hourlyRate: 250,
  skills: ['window-cleaning', 'deep-clean'],
  availability: ['monday', 'tuesday', 'wednesday'],
  isActive: true,
  totalHours: 160,
  completedJobs: 20,
  averageRating: 4.8,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-10-24T00:00:00Z'),
};

/**
 * Create mock request object for controllers
 */
export function createMockRequest(user = mockUser) {
  return {
    user,
    headers: {},
    query: {},
    params: {},
    body: {},
  };
}

/**
 * Create mock response object for controllers
 */
export function createMockResponse() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert that a function throws a specific error
 */
export async function expectToThrow(
  fn: () => Promise<any>,
  errorMessage?: string,
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw but it did not');
  } catch (error) {
    if (errorMessage) {
      expect(error.message).toContain(errorMessage);
    }
  }
}

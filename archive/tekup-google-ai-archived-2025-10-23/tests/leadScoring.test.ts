import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateLeadScore, LeadScore } from '../src/services/leadScoringService';
import { prisma } from '../src/services/databaseService';

// Mock the Prisma client
vi.mock('../src/services/databaseService', () => {
  return {
    prisma: {
      lead: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

// Mock the logger
vi.mock('../src/logger', () => {
  return {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('Lead Scoring Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate the lead score and update the database', async () => {
    // Mock the lead data
    const mockLead = {
      id: 'lead-1',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      email: 'test@example.com',
      status: 'contacted',
      name: 'Test Customer',
      estimatedValue: 5000,
      customer: {
        email: 'customer@example.com',
        phone: '+4512345678',
        name: 'Test Customer',
      },
    };

    // Mock the prisma findUnique response
    (prisma.lead.findUnique as any).mockResolvedValue(mockLead);

    // Call the function
    const result = await calculateLeadScore('lead-1');

    // Verify the score is calculated correctly
    expect(result.leadId).toBe('lead-1');
    expect(result.score).toBeGreaterThan(0);
    expect(['hot', 'warm', 'cold']).toContain(result.tier);

    // Check that prisma.lead.update was called with the correct parameters
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: expect.objectContaining({
        score: expect.any(Number),
        priority: expect.stringMatching(/high|medium|low/),
        lastScored: expect.any(Date),
        scoreMetadata: expect.objectContaining({
          dataAvailability: expect.any(Number),
          responseSpeed: expect.any(Number),
          contactQuality: expect.any(Number),
          serviceValue: expect.any(Number),
          engagement: expect.any(Number),
        }),
      }),
    });
  });
});
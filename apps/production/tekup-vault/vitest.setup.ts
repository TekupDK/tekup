import { vi } from 'vitest';

// Set test environment variables BEFORE any modules are imported
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.GITHUB_TOKEN = 'ghp_test_token';
process.env.GITHUB_WEBHOOK_SECRET = 'test_webhook_secret';
process.env.OPENAI_API_KEY = 'sk-test-key';
process.env.API_KEY = 'test-api-key';
process.env.PORT = '3000';
process.env.LOG_LEVEL = 'silent';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

// Mock @supabase/supabase-js module globally
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  })),
}));

// Silence console logs during tests unless LOG_LEVEL is set
if (process.env.LOG_LEVEL === 'silent') {
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

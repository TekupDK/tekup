// Setup file for Jest tests with ES modules
import 'reflect-metadata';

// Disable Redis for tests unless explicitly enabled
process.env.PX_DISABLE_REDIS = process.env.PX_DISABLE_REDIS ?? '1';

import 'reflect-metadata';

// Disable Redis for tests unless explicitly enabled
process.env.PX_DISABLE_REDIS = process.env.PX_DISABLE_REDIS ?? '1';

// Mock external packages that aren't needed for basic e2e tests
jest.mock('isomorphic-dompurify', () => ({
  sanitize: (input: string) => input, // Pass through for tests
  default: {
    sanitize: (input: string) => input
  }
}));

// Mock CacheService to avoid ioredis in test
jest.mock('../src/cache/cache.service', () => ({
  CacheService: class {
    async onModuleInit() {}
    async get() { return null; }
    async set() {}
    async del() {}
  }
}));

// Mock PrismaService minimal (no-op $on)
jest.mock('../src/prisma/prisma.service', () => {
  return {
    PrismaService: class {
      $on() {}
      // add minimal prisma API used in tests if required
    }
  };
});

// Prisma service: neutralize $on hooks that rely on Node process events in tests
jest.mock('../src/prisma/prisma.service.js', () => {
	const Actual = jest.requireActual('../src/prisma/prisma.service.js');
	return {
		...Actual,
		PrismaService: class extends Actual.PrismaService {
			$on() { /* swallow event listeners in test */ }
		}
	};
});
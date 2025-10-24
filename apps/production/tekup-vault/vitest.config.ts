import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'packages/**/__tests__/**/*.test.ts',
      'apps/**/__tests__/**/*.test.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.config.ts',
      ],
    },
    // Provide test environment variables
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_KEY: 'test-service-key',
      GITHUB_TOKEN: 'ghp_test_token',
      GITHUB_WEBHOOK_SECRET: 'test_webhook_secret',
      OPENAI_API_KEY: 'sk-test-key',
      API_KEY: 'test-api-key',
      PORT: '3000',
      LOG_LEVEL: 'silent',
      ALLOWED_ORIGINS: 'http://localhost:3000',
    },
  },
  resolve: {
    alias: {
      '@tekupvault/vault-core': path.resolve(__dirname, './packages/vault-core/src'),
      '@tekupvault/vault-search': path.resolve(__dirname, './packages/vault-search/src'),
      '@tekupvault/vault-ingest': path.resolve(__dirname, './packages/vault-ingest/src'),
    },
  },
});



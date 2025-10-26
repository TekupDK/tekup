import { loadConfig } from '../src/index';

describe('config package', () => {
  it('masks sensitive fields', () => {
    const { redacted } = loadConfig({ source: { FLOW_API_KEY: 'supersecretflow', FLOW_API_URL: 'http://x', WEBSITE_TENANT_KEY: 'tkey' }, allowProcessEnvFallback: false });
    expect(redacted.FLOW_API_KEY).toBe('***REDACTED***');
    expect(redacted.WEBSITE_TENANT_KEY).toBe('***REDACTED***');
  });

  it('throws on missing required', () => {
    expect(() => loadConfig({ required: ['FLOW_API_URL' as any], source: { }, allowProcessEnvFallback: false })).toThrow(/Missing required env/);
  });

  it('parses PX_API_PORT when provided', () => {
    const { config } = loadConfig({ source: { FLOW_API_URL: 'https://example.com', PX_API_PORT: '4100' }, allowProcessEnvFallback: false });
    expect(config.PX_API_PORT).toBe('4100');
  });
});

import { NextResponse } from 'next/server';
import { MCPServer, MCPCapabilities } from '@tekup/shared';
import { getConfig } from '@/lib/config';
import { getAllCommands } from '@tekup/shared/src/voice/commands/danish-commands';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantKey = url.searchParams.get('apiKey') || process.env.NEXT_PUBLIC_TENANT_API_KEY || '';
  const cfg = getConfig();

  // Fetch voice status from Flow API
  let voiceHealthy = false;
  try {
    const res = await fetch(`${cfg.apiUrl.replace(/\/$/, '')}/voice/gemini/status`, {
      headers: tenantKey ? { 'x-tenant-key': tenantKey } : undefined,
      cache: 'no-store'
    });
    voiceHealthy = res.ok;
  } catch {}

  const danishCommands = getAllCommands();
  const tools = danishCommands.map((cmd) => ({
    name: cmd.id,
    description: `${cmd.danishPhrase} - ${cmd.description}`,
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Free-form command text' } } },
    outputSchema: { type: 'object' }
  }));

  const capabilities: MCPCapabilities = {
    tools,
    resources: [],
    prompts: [],
    sampling: false,
    logging: ['info']
  };

  const servers: MCPServer[] = [
    {
      id: 'voice-gemini-mcp',
      name: 'Voice Gemini MCP',
      version: '0.1.0',
      description: 'Tenant-aware Danish voice commands via Flow API (Gemini Live)',
      capabilities,
      transport: { type: 'http', config: { url: `${cfg.apiUrl}/voice/gemini` } },
      status: voiceHealthy ? 'connected' : 'error',
      config: { autoStart: true },
      metadata: { tenantScoped: true }
    }
  ];
  return NextResponse.json({ servers });
}


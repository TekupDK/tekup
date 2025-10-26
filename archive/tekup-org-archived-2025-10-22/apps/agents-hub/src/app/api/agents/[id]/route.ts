import { NextResponse } from 'next/server';

const details: Record<string, any> = {
  'voice-gemini': {
    name: 'TekUp Voice Agent',
    provider: 'gemini',
    settings: { voice: 'Zephyr', language: 'da-DK', tenants: ['tekup', 'rendetalje', 'foodtruck'] }
  },
  'inbox-openai': {
    name: 'Inbox AI (OpenAI)',
    provider: 'openai',
    settings: { model: 'gpt-4-turbo', tone: 'professional' }
  },
  'inbox-anthropic': {
    name: 'Inbox AI (Anthropic)',
    provider: 'anthropic',
    settings: { model: 'claude-3-sonnet-20240229', tone: 'professional' }
  }
};

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const data = details[params.id];
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ agent: { id: params.id, ...data } });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  if (!details[params.id]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Persist would go to DB/service; we simply echo for now
  details[params.id] = {
    ...details[params.id],
    settings: { ...details[params.id].settings, ...(body?.settings || {}) }
  };
  return NextResponse.json({ ok: true, agent: { id: params.id, ...details[params.id] } });
}

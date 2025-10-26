import { NextResponse } from 'next/server';

export async function GET() {
  const agents = [
    { id: 'voice-gemini', name: 'TekUp Voice Agent', provider: 'gemini', status: 'active', tenants: ['tekup', 'rendetalje', 'foodtruck'] },
    { id: 'inbox-openai', name: 'Inbox AI (OpenAI)', provider: 'openai', status: 'active', tenants: ['tekup'] },
    { id: 'inbox-anthropic', name: 'Inbox AI (Anthropic)', provider: 'anthropic', status: 'idle', tenants: ['tekup'] }
  ];
  return NextResponse.json({ agents });
}

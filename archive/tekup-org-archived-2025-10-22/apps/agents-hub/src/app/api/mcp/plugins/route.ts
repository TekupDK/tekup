import { NextResponse } from 'next/server';
import { MCPPlugin } from '@tekup/shared';

export async function GET() {
  const plugins: MCPPlugin[] = [];
  return NextResponse.json({ plugins });
}


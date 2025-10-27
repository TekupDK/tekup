import { NextRequest } from 'next/server';
import * as jobsApi from '@/server/api/jobs';

// PUT /api/jobs/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return jobsApi.PUT(request, { params: { id } });
}

// DELETE /api/jobs/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return jobsApi.DELETE(request, { params: { id } });
}
import { NextRequest } from 'next/server';
import * as jobsApi from '../../../../server/api/jobs';

// PUT /api/jobs/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return jobsApi.PUT(request, { params });
}

// DELETE /api/jobs/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return jobsApi.DELETE(request, { params });
}
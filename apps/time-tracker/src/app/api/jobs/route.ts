import { NextRequest } from 'next/server';
import * as jobsApi from '@/server/api/jobs';

// GET /api/jobs
export async function GET(request: NextRequest) {
  return jobsApi.GET(request);
}

// POST /api/jobs
export async function POST(request: NextRequest) {
  return jobsApi.POST(request);
}
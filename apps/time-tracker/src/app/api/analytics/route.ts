import { NextRequest } from 'next/server';
import * as analyticsApi from '@/server/api/analytics';

// GET /api/analytics/monthly
export async function GET(request: NextRequest) {
  return analyticsApi.GET(request);
}

// POST /api/analytics/fb-settlement
export async function POST(request: NextRequest) {
  return analyticsApi.POST(request);
}
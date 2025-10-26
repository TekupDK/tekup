import { NextRequest, NextResponse } from 'next/server';
import { VoiceIntegrationService } from '@/services/voice-integration.service';
import { VoiceCommand, createLogger } from '@tekup/shared';
const logger = createLogger('voice-api-route');

export async function POST(request: NextRequest) {
  try {
    const { command, parameters, tenantId } = await request.json();

    // Validate required fields
    if (!command || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: command and tenantId' },
        { status: 400 }
      );
    }

    // Validate tenant ID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }

    // Create voice service with tenant validation
    const voiceService = new VoiceIntegrationService({
      flowApiUrl: process.env.FLOW_API_URL!,
      apiKey: process.env.API_KEY!,
      tenantId: tenantId,
    });

    // Execute command with tenant validation
    const result = await voiceService.executeVoiceCommand(command, parameters);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Voice command error:', error);

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied', details: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Command execution failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {

  // Health check endpoint
  return NextResponse.json({
    status: 'healthy',
    service: 'voice-agent',
    timestamp: new Date().toISOString()
  });
}

import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { metricsSnapshot } from '@tekup/observability';

@Controller('internal')
export class InternalController {
  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    const metrics = await metricsSnapshot();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  }

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
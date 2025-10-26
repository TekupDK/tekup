import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';

@Controller()
export class MetricsController {
  constructor(private metrics: MetricsService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  metricsText() { return this.metrics.renderPrometheus(); }
}

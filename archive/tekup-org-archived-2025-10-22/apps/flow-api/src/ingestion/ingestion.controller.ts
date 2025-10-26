import { Body, Controller, Post, Req, UseFilters, BadRequestException } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service.js';
import { LeadService } from '../lead/lead.service.js';
import { DomainExceptionFilter } from '../common/domain-exception.filter.js';
import { Request } from 'express';

interface FormIngestDto { source?: string; payload: any }

function validatePayload(p: any) {
  if (p == null || typeof p !== 'object') return 'payload_object_required';
  const hasEmail = typeof p.email === 'string' && p.email.includes('@');
  const hasPhone = typeof p.phone === 'string' && p.phone.length >= 6;
  if (!hasEmail && !hasPhone) return 'email_or_phone_required';
  return null;
}

@Controller('ingest')
@UseFilters(DomainExceptionFilter)
export class IngestionController {
  constructor(private leadService: LeadService, private metrics: MetricsService) {}

  @Post('form')
  async ingestForm(@Body() body: FormIngestDto, @Req() req: Request) {
  const tenantId = (req as any).tenantId as string | undefined;
  if (!tenantId) throw new BadRequestException('tenant missing');
  const validationError = validatePayload(body.payload);
  if (validationError) {
    this.metrics.increment('lead_ingest_validation_failed_total', { reason: validationError });
    throw new BadRequestException({ error: validationError });
  }
  const start = process.hrtime.bigint();
  const lead = await this.leadService.create({ tenantId, source: body.source || 'form', payload: body.payload || {} });
  const end = process.hrtime.bigint();
  const seconds = Number(end - start) / 1e9;
  this.metrics.observe('lead_ingest_duration_seconds', seconds, { tenant: tenantId, source: body.source || 'form' });
    return lead;
  }
}

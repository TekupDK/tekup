import { Injectable } from '@nestjs/common';
import { RawEmailInput, ParsedLeadPayload } from './types.js';
import { classifyEmail } from './classifier.js';
import { runParsers } from './parser.js';

// Mock services - will be properly injected later
let metricsService: any = {
  increment: (name: string, labels?: any) => {},
  histogram: (name: string, value: number, labels?: any) => {}
};

let duplicateDetectionService: any = {
  findDuplicate: async () => null
};

@Injectable()
export class IngestionService {
  // TODO: inject repository / prisma later
  async ingestEmail(input: RawEmailInput): Promise<{ accepted: boolean; payload?: ParsedLeadPayload; reason?: string; classification: string; }> {
    const startTime = Date.now();
    
    try {
      const classification = classifyEmail(input);
      
      // Track email classification
      metricsService.increment('email_source_classification_total', {
        source: classification.kind,
        confidence_level: classification.confidence.toFixed(2),
        tenant: input.mailbox.includes('foodtruck') ? 'foodtruck' : 
               input.mailbox.includes('tekup') ? 'tekup' : 'rendetalje'
      });
      
      if (classification.kind !== 'lead') {
        metricsService.histogram('ingestion_latency_seconds', (Date.now() - startTime) / 1000, {
          tenant: input.mailbox.includes('foodtruck') ? 'foodtruck' : 
                  input.mailbox.includes('tekup') ? 'tekup' : 'rendetalje',
          source: classification.kind
        });
        
        return { accepted: false, reason: 'not_lead', classification: classification.kind };
      }

      const parsed = runParsers(input);
      if (!parsed) {
        metricsService.increment('parser_failure_total', {
          parser: 'all',
          reason: 'no_match',
          tenant: input.mailbox.includes('foodtruck') ? 'foodtruck' : 
                  input.mailbox.includes('tekup') ? 'tekup' : 'rendetalje'
        });
        
        metricsService.histogram('ingestion_latency_seconds', (Date.now() - startTime) / 1000, {
          tenant: input.mailbox.includes('foodtruck') ? 'foodtruck' : 
                  input.mailbox.includes('tekup') ? 'tekup' : 'rendetalje',
          source: classification.kind
        });
        
        return { accepted: false, classification: classification.kind, reason: 'no_parser_match' };
      }
      
      // Track successful parsing
      metricsService.increment('parser_success_total', {
        parser: parsed.payload.source,
        tenant: input.mailbox.includes('foodtruck') ? 'foodtruck' : 
                input.mailbox.includes('tekup') ? 'tekup' : 'rendetalje'
      });

      // TODO: duplicate detection, DB insert, metrics increment
      metricsService.histogram('ingestion_latency_seconds', (Date.now() - startTime) / 1000, {
        tenant: input.mailbox.includes('foodtruck') ? 'foodtruck' : 
                input.mailbox.includes('tekup') ? 'tekup' : 'rendetalje',
        source: classification.kind
      });
      
      return { accepted: true, payload: parsed.payload, classification: classification.kind };
    } catch (error) {
      metricsService.histogram('ingestion_latency_seconds', (Date.now() - startTime) / 1000, {
        tenant: input.mailbox.includes('foodtruck') ? 'foodtruck' : 
                input.mailbox.includes('tekup') ? 'tekup' : 'rendetalje',
        source: 'error'
      });
      
      // Track parsing errors
      metricsService.increment('parser_failure_total', {
        parser: 'unknown',
        reason: 'exception',
        tenant: input.mailbox.includes('foodtruck') ? 'foodtruck' : 
                input.mailbox.includes('tekup') ? 'tekup' : 'rendetalje'
      });
      
      throw error;
    }
  }
}
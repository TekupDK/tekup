import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller.js';
import { LeadModule } from '../lead/lead.module.js';

@Module({
  imports: [LeadModule],
  controllers: [IngestionController]
})
export class IngestionHttpModule {}

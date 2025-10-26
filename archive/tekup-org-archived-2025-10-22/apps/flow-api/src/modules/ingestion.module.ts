import { Module } from '@nestjs/common';
import { IngestionService } from '../ingestion/ingestion.service.js';
import { ImapWorkerService } from '../ingestion/imap-worker.service.js';

@Module({
  providers: [IngestionService, ImapWorkerService],
  exports: [IngestionService, ImapWorkerService]
})
export class IngestionModule {}
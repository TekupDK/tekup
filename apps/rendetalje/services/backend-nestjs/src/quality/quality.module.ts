import { Module } from '@nestjs/common';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';
import { QualityChecklistsService } from './quality-checklists.service';
import { PhotoDocumentationService } from './photo-documentation.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [SupabaseModule, JobsModule],
  controllers: [QualityController],
  providers: [QualityService, QualityChecklistsService, PhotoDocumentationService],
  exports: [QualityService, QualityChecklistsService, PhotoDocumentationService],
})
export class QualityModule {}
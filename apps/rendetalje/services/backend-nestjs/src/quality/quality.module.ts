import { Module } from '@nestjs/common';
import { QualityController } from './quality.controller';
import { QualityService } from './quality.service';
import { QualityChecklistsService } from './quality-checklists.service';
import { PhotoDocumentationService } from './photo-documentation.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [QualityController],
  providers: [QualityService, QualityChecklistsService, PhotoDocumentationService],
  exports: [QualityService, QualityChecklistsService, PhotoDocumentationService],
})
export class QualityModule {}

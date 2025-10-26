import { Module } from '@nestjs/common';
import { LeadQualificationService } from './qualification.service';
import { LeadQualificationController } from './qualification.controller';
import { LeadScoringService } from './scoring.service';

@Module({
  providers: [
    LeadQualificationService,
    LeadScoringService,
  ],
  controllers: [LeadQualificationController],
  exports: [LeadQualificationService, LeadScoringService],
})
export class LeadQualificationModule {}

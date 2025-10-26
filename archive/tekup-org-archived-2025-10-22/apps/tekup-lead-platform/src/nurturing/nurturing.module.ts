import { Module } from '@nestjs/common';
import { LeadNurturingService } from './nurturing.service';
import { NurturingController } from './nurturing.controller';

@Module({
  providers: [LeadNurturingService],
  controllers: [NurturingController],
  exports: [LeadNurturingService],
})
export class LeadNurturingModule {}

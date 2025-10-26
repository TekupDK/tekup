import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DanishEmploymentComplianceService } from './danish-employment-compliance.service';
import { ComplianceController } from './compliance.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ComplianceController],
  providers: [DanishEmploymentComplianceService],
  exports: [DanishEmploymentComplianceService],
})
export class ComplianceModule {}

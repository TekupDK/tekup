import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SMSModule } from '../sms/sms.module.js';
import { LeadModule } from '../lead/lead.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { StructuredLoggerModule } from '../common/logging/structured-logger.module.js';
import { PhoneLeadWorkflowService } from './phone-lead-workflow.service.js';

@Module({
  imports: [
    PrismaModule,
    SMSModule,
    LeadModule,
    MetricsModule,
    StructuredLoggerModule
  ],
  providers: [PhoneLeadWorkflowService],
  exports: [PhoneLeadWorkflowService]
})
export class PhoneLeadWorkflowModule {}
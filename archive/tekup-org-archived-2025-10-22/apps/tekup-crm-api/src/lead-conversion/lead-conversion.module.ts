import { Module } from '@nestjs/common';
import { LeadConversionService } from './lead-conversion.service';
import { LeadConversionController } from './lead-conversion.controller';

@Module({
  controllers: [LeadConversionController],
  providers: [LeadConversionService],
  exports: [LeadConversionService],
})
export class LeadConversionModule {}
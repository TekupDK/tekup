import { Module } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { TimeTrackingController, TimeCorrectionsController } from './time-tracking.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [TimeTrackingController, TimeCorrectionsController],
  providers: [TimeTrackingService],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}
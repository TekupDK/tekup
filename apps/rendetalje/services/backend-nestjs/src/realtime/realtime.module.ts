import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { NotificationService } from './notification.service';
import { RealtimeController } from './realtime.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [RealtimeController],
  providers: [RealtimeGateway, NotificationService],
  exports: [RealtimeGateway, NotificationService],
})
export class RealtimeModule {}
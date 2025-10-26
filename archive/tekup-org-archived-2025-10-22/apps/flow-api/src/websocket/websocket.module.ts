import { Module } from '@nestjs/common';
import { EventsGateway } from './websocket.gateway';
import { LeadModule } from '../lead/lead.module';
import { MetricsModule } from '../metrics/metrics.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [LeadModule, MetricsModule, AuthModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class WebSocketModule {}
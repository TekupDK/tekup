import { Module, Global } from '@nestjs/common';
import { RedisClusterService } from '../cache/redis-cluster.service.js';
import { LoadBalancerHealthService } from '../health/load-balancer-health.service.js';
import { LoadBalancerHealthController } from '../health/load-balancer-health.controller.js';
import { GracefulShutdownService } from './graceful-shutdown.service.js';
import { CacheModule } from '../cache/cache.module.js';
import { SessionModule } from '../session/session.module.js';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '../metrics/metrics.module.js';

@Global()
@Module({
  imports: [CacheModule, SessionModule, ConfigModule, MetricsModule],
  providers: [
    RedisClusterService,
    LoadBalancerHealthService,
    GracefulShutdownService,
  ],
  controllers: [LoadBalancerHealthController],
  exports: [
    RedisClusterService,
    LoadBalancerHealthService,
    GracefulShutdownService,
  ],
})
export class HorizontalScalingModule {}
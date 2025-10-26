import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ObservabilityModule } from '@tekup/observability';
import { PrismaService } from './prisma/prisma.service';
import { TenantContextMiddleware } from './tenant-context.middleware';
import { InternalController } from './internal/internal.controller';

@Module({
  imports: [ObservabilityModule.forRoot({ serviceName: 'flow-api', enableTracing: true })],
  controllers: [InternalController],
  providers: [PrismaService]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}

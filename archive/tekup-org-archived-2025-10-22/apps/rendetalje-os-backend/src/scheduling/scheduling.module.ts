import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DanishRouteOptimizationService } from './danish-route-optimization.service';
import { SchedulingController } from './scheduling.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SchedulingController],
  providers: [DanishRouteOptimizationService],
  exports: [DanishRouteOptimizationService],
})
export class SchedulingModule {}

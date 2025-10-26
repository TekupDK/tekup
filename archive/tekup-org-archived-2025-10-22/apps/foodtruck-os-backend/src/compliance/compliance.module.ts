import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DanishFoodSafetyService } from './danish-food-safety.service';
import { ComplianceController } from './compliance.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ComplianceController],
  providers: [DanishFoodSafetyService],
  exports: [DanishFoodSafetyService],
})
export class ComplianceModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DanishPOSService } from './danish-pos.service';
import { POSController } from './pos.controller';

@Module({
  imports: [PrismaModule],
  controllers: [POSController],
  providers: [DanishPOSService],
  exports: [DanishPOSService],
})
export class POSModule {}

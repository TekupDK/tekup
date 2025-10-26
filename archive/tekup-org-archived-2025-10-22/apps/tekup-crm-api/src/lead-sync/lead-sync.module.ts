import { Module } from '@nestjs/common';
import { LeadSyncController } from './lead-sync.controller';
import { LeadSyncService } from './lead-sync.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LeadSyncController],
  providers: [LeadSyncService],
  exports: [LeadSyncService],
})
export class LeadSyncModule {}
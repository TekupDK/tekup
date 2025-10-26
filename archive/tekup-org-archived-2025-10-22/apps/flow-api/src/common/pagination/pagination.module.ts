import { Module, Global } from '@nestjs/common';
import { PaginationService } from './pagination.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [PaginationService],
  exports: [PaginationService],
})
export class PaginationModule {}
import { Module } from '@nestjs/common';
import { DanishBusinessService } from './danish-business.service';
import { DanishBusinessController } from './danish-business.controller';

@Module({
  providers: [DanishBusinessService],
  controllers: [DanishBusinessController],
  exports: [DanishBusinessService],
})
export class DanishBusinessModule {}

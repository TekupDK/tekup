import { Module } from '@nestjs/common';
import { ConfigInitService } from './config-init.service';

@Module({
  providers: [ConfigInitService],
  exports: [ConfigInitService],
})
export class ConfigInitModule {}


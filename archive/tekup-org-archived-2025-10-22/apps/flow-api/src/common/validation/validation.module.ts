import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InputValidationService } from './input-validation.service.js';
import { ValidationPipe } from './validation.pipe.js';
import { LoggingModule } from '../logging/logging.module.js';
import { MetricsModule } from '../../metrics/metrics.module.js';

@Global()
@Module({
  imports: [ConfigModule, LoggingModule, MetricsModule],
  providers: [InputValidationService, ValidationPipe],
  exports: [InputValidationService, ValidationPipe],
})
export class ValidationModule {}
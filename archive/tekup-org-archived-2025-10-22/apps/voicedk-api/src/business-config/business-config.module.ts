import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BusinessConfig } from './entities/business-config.entity';

// TODO: Implement BusinessConfigService and BusinessConfigController
// import { BusinessConfigService } from './business-config.service';
// import { BusinessConfigController } from './business-config.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessConfig]),
  ],
  controllers: [
    // BusinessConfigController, // TODO: Create this
  ],
  providers: [
    // BusinessConfigService, // TODO: Create this
  ],
  exports: [
    // BusinessConfigService, // TODO: Create this
  ],
})
export class BusinessConfigModule {}

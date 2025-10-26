import { Module } from '@nestjs/common';
import { CustomerLocationsService } from './customer-locations.service';
import { CustomerLocationsController } from './customer-locations.controller';

@Module({
  providers: [CustomerLocationsService],
  controllers: [CustomerLocationsController],
  exports: [CustomerLocationsService],
})
export class CustomerLocationsModule {}

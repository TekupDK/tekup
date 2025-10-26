import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { CustomerLocationsModule } from './customer-locations/customer-locations.module';

@Module({
  providers: [CustomersService],
  controllers: [CustomersController],
  imports: [CustomerLocationsModule],
  exports: [CustomersService],
})
export class CustomersModule {}

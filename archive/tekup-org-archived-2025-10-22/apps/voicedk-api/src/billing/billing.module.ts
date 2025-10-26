import { Module } from '@nestjs/common';

// TODO: Implement BillingService and BillingController
// import { BillingService } from './billing.service';
// import { BillingController } from './billing.controller';

@Module({
  imports: [
    // Add any required dependencies here
  ],
  controllers: [
    // BillingController, // TODO: Create this
  ],
  providers: [
    // BillingService, // TODO: Create this
  ],
  exports: [
    // BillingService, // TODO: Create this
  ],
})
export class BillingModule {}

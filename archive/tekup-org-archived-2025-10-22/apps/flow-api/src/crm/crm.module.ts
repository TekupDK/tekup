import { Module } from '@nestjs/common';
import { ContactsModule } from './contacts/contacts.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { DealsModule } from './deals/deals.module.js';
import { DealStagesModule } from './deal-stages/deal-stages.module.js';
import { ActivitiesModule } from './activities/activities.module.js';

@Module({
  imports: [
    ContactsModule,
    CompaniesModule,
    DealsModule,
    DealStagesModule,
    ActivitiesModule,
  ],
  exports: [
    ContactsModule,
    CompaniesModule,
    DealsModule,
    DealStagesModule,
    ActivitiesModule,
  ],
})
export class CrmModule {}

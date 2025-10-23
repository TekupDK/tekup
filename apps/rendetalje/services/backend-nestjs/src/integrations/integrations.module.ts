import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { IntegrationService } from './integration.service';
import { TekupBillyService } from './tekup-billy/tekup-billy.service';
import { TekupVaultService } from './tekup-vault/tekup-vault.service';
import { RenosCalendarService } from './renos-calendar/renos-calendar.service';
import { IntegrationsController } from './integrations.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [IntegrationsController],
  providers: [
    IntegrationService,
    TekupBillyService,
    TekupVaultService,
    RenosCalendarService,
  ],
  exports: [
    IntegrationService,
    TekupBillyService,
    TekupVaultService,
    RenosCalendarService,
  ],
})
export class IntegrationsModule {}
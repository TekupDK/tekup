import { Module } from '@nestjs/common';
import { RendetaljeHubModule } from './rendetalje/rendetalje-hub.module';
import { FoodtruckFiestaHubModule } from './foodtruck-fiesta/foodtruck-fiesta-hub.module';
import { TekupCorporateHubModule } from './tekup-corporate/tekup-corporate-hub.module';
import { IntegrationHubService } from './integration-hub.service';
import { IntegrationHubController } from './integration-hub.controller';

@Module({
  imports: [
    RendetaljeHubModule,
    FoodtruckFiestaHubModule,
    TekupCorporateHubModule,
  ],
  providers: [IntegrationHubService],
  controllers: [IntegrationHubController],
  exports: [IntegrationHubService],
})
export class IntegrationHubModule {}

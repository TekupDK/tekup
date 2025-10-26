import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IntegrationHubService } from './integration-hub.service';

@ApiTags('Integration Hub')
@Controller('integrations')
export class IntegrationHubController {
  constructor(private integrationHubService: IntegrationHubService) {}
}

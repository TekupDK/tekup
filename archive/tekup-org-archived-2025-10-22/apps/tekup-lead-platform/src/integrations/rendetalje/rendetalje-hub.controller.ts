import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RendetaljeLeadProcessor } from './lead-processor.service';

@ApiTags('Rendetalje Hub')
@Controller('integrations/rendetalje')
export class RendetaljeHubController {
  constructor(private leadProcessor: RendetaljeLeadProcessor) {}
}

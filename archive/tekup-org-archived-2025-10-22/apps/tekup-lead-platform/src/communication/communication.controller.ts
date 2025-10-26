import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommunicationService } from './communication.service';

@ApiTags('Communication')
@Controller('communication')
export class CommunicationController {
  constructor(private communicationService: CommunicationService) {}
}

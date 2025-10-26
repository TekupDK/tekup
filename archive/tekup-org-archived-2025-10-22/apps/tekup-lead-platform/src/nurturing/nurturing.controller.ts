import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeadNurturingService } from './nurturing.service';

@ApiTags('Lead Nurturing')
@Controller('nurturing')
export class NurturingController {
  constructor(private nurturingService: LeadNurturingService) {}
}

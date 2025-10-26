import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LeadConversionService } from './lead-conversion.service';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { JwtAuthGuard } from '@tekup/auth';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadConversionController {
  constructor(private readonly leadConversionService: LeadConversionService) {}

  @Post(':id/convert')
  convert(@Param('id') leadId: string, @Body() convertLeadDto: ConvertLeadDto) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.leadConversionService.convertLead(convertLeadDto, 'tenant-id');
  }

  @Get(':id/conversion')
  getConversion(@Param('id') leadId: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.leadConversionService.getConversionByLeadId(leadId, 'tenant-id');
  }
}
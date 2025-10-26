import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DealStagesService } from './deal-stages.service';
import { CreateDealStageDto } from './dto/create-deal-stage.dto';
import { UpdateDealStageDto } from './dto/update-deal-stage.dto';
import { JwtAuthGuard } from '@tekup/auth';

@Controller('deal-stages')
@UseGuards(JwtAuthGuard)
export class DealStagesController {
  constructor(private readonly dealStagesService: DealStagesService) {}

  @Post()
  create(@Body() createDealStageDto: CreateDealStageDto) {
    return this.dealStagesService.create(createDealStageDto);
  }

  @Get()
  findAll() {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.dealStagesService.findAll('tenant-id');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.dealStagesService.findOne(id, 'tenant-id');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDealStageDto: UpdateDealStageDto) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.dealStagesService.update(id, 'tenant-id', updateDealStageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.dealStagesService.remove(id, 'tenant-id');
  }
}
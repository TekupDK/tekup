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
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { JwtAuthGuard } from '@tekup/auth';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  create(@Body() createDealDto: CreateDealDto) {
    return this.dealsService.create(createDealDto);
  }

  @Get()
  findAll() {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.dealsService.findAll('tenant-id');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.dealsService.findOne(id, 'tenant-id');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDealDto: UpdateDealDto) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.dealsService.update(id, 'tenant-id', updateDealDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.dealsService.remove(id, 'tenant-id');
  }
}
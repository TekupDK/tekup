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
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { JwtAuthGuard } from '@tekup/auth';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  @Get()
  findAll() {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.activitiesService.findAll('tenant-id');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.activitiesService.findOne(id, 'tenant-id');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.activitiesService.update(id, 'tenant-id', updateActivityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.activitiesService.remove(id, 'tenant-id');
  }
}
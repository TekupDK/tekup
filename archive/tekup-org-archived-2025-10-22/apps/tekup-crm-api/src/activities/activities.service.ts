import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ValidationService } from '../validation/validation.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService,
  ) {}

  async create(createActivityDto: CreateActivityDto) {
    await this.validationService.validateActivityData(
      createActivityDto.tenantId,
      createActivityDto.activityTypeId,
      createActivityDto.scheduledAt,
    );

    return this.prisma.Activity.create({
      data: createActivityDto,
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.Activity.findMany({
      where: {
        tenantId,
      },
      include: {
        activityType: true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.Activity.findUnique({
      where: {
        id,
        tenantId,
      },
      include: {
        activityType: true,
      },
    });
  }

  async update(id: string, tenantId: string, updateActivityDto: UpdateActivityDto) {
    // If critical fields are being updated, validate them
    if (updateActivityDto.activityTypeId || updateActivityDto.scheduledAt) {
      await this.validationService.validateActivityData(
        tenantId,
        updateActivityDto.activityTypeId || (await this.prisma.Activity.findUnique({ where: { id, tenantId } })).activityTypeId,
        updateActivityDto.scheduledAt,
      );
    }

    return this.prisma.Activity.update({
      where: {
        id,
        tenantId,
      },
      data: updateActivityDto,
    });
  }

  async remove(id: string, tenantId: string) {
    return this.prisma.Activity.delete({
      where: {
        id,
        tenantId,
      },
    });
  }
}
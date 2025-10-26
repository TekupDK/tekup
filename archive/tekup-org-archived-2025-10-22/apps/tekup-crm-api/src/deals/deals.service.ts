import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { ValidationService } from '../validation/validation.service';

@Injectable()
export class DealsService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService,
  ) {}

  async create(createDealDto: CreateDealDto) {
    await this.validationService.validateDealData(
      createDealDto.tenantId,
      createDealDto.companyId,
      createDealDto.stageId,
      createDealDto.value,
    );

    return this.prisma.Deal.create({
      data: createDealDto,
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.Deal.findMany({
      where: {
        tenantId,
      },
      include: {
        company: true,
        stage: true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.Deal.findUnique({
      where: {
        id,
        tenantId,
      },
      include: {
        company: true,
        stage: true,
        activities: true,
      },
    });
  }

  async update(id: string, tenantId: string, updateDealDto: UpdateDealDto) {
    // If critical fields are being updated, validate them
    if (updateDealDto.companyId || updateDealDto.stageId || updateDealDto.value) {
      await this.validationService.validateDealData(
        tenantId,
        updateDealDto.companyId || (await this.prisma.Deal.findUnique({ where: { id, tenantId } })).companyId,
        updateDealDto.stageId || (await this.prisma.Deal.findUnique({ where: { id, tenantId } })).stageId,
        updateDealDto.value || (await this.prisma.Deal.findUnique({ where: { id, tenantId } })).value,
      );
    }

    return this.prisma.Deal.update({
      where: {
        id,
        tenantId,
      },
      data: updateDealDto,
    });
  }

  async remove(id: string, tenantId: string) {
    return this.prisma.Deal.delete({
      where: {
        id,
        tenantId,
      },
    });
  }
}
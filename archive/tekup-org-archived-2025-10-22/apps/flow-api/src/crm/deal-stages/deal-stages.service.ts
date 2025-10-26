import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealStageDto } from './dto/create-deal-stage.dto';
import { UpdateDealStageDto } from './dto/update-deal-stage.dto';

@Injectable()
export class DealStagesService {
  constructor(private prisma: PrismaService) {}

  async create(createDealStageDto: CreateDealStageDto) {
    return this.prisma.dealStage.create({
      data: createDealStageDto,
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.dealStage.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.dealStage.findUnique({
      where: {
        id,
        tenantId,
      },
    });
  }

  async update(id: string, tenantId: string, updateDealStageDto: UpdateDealStageDto) {
    return this.prisma.dealStage.update({
      where: {
        id,
        tenantId,
      },
      data: updateDealStageDto,
    });
  }

  async remove(id: string, tenantId: string) {
    return this.prisma.dealStage.delete({
      where: {
        id,
        tenantId,
      },
    });
  }
}
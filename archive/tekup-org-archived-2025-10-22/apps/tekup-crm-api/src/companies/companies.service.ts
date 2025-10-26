import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ValidationService } from '../validation/validation.service';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto) {
    await this.validationService.validateCompanyData(
      createCompanyDto.tenantId,
      createCompanyDto.name,
    );

    return this.prisma.Company.create({
      data: createCompanyDto,
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.Company.findMany({
      where: {
        tenantId,
      },
      include: {
        contacts: true,
        deals: true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.Company.findUnique({
      where: {
        id,
        tenantId,
      },
      include: {
        contacts: true,
        deals: true,
      },
    });
  }

  async update(id: string, tenantId: string, updateCompanyDto: UpdateCompanyDto) {
    // If name is being updated, validate it
    if (updateCompanyDto.name) {
      await this.validationService.validateCompanyData(
        tenantId,
        updateCompanyDto.name,
      );
    }

    return this.prisma.Company.update({
      where: {
        id,
        tenantId,
      },
      data: updateCompanyDto,
    });
  }

  async remove(id: string, tenantId: string) {
    return this.prisma.Company.delete({
      where: {
        id,
        tenantId,
      },
    });
  }
}
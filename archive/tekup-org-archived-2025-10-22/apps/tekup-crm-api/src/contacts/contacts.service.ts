import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ValidationService } from '../validation/validation.service';

@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService,
  ) {}

  async create(createContactDto: CreateContactDto) {
    await this.validationService.validateContactData(
      createContactDto.tenantId,
      createContactDto.email,
      createContactDto.companyId,
    );

    return this.prisma.Contact.create({
      data: createContactDto,
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.Contact.findMany({
      where: {
        tenantId,
      },
      include: {
        company: true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.Contact.findUnique({
      where: {
        id,
        tenantId,
      },
      include: {
        company: true,
        deals: true,
        activities: true,
      },
    });
  }

  async update(id: string, tenantId: string, updateContactDto: UpdateContactDto) {
    // If email is being updated, validate it
    if (updateContactDto.email) {
      await this.validationService.validateContactData(
        tenantId,
        updateContactDto.email,
        updateContactDto.companyId,
      );
    }

    return this.prisma.Contact.update({
      where: {
        id,
        tenantId,
      },
      data: updateContactDto,
    });
  }

  async remove(id: string, tenantId: string) {
    return this.prisma.Contact.delete({
      where: {
        id,
        tenantId,
      },
    });
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Customer } from './entities/customer.entity';
import { 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CustomerFiltersDto 
} from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: CustomerFiltersDto): Promise<PaginatedResponseDto<Customer>> {
    const { 
      status, 
      tag, 
      minLeads, 
      minBookings,
      minRevenue,
      search,
      page = 1,
      limit = 10
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (tag) where.tags = { has: tag };
    if (minLeads !== undefined) where.totalLeads = { gte: minLeads };
    if (minBookings !== undefined) where.totalBookings = { gte: minBookings };
    if (minRevenue !== undefined) where.totalRevenue = { gte: minRevenue };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.customers.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.customers.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.prisma.customers.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer with ID ${id} not found`);
    return customer;
  }

  async create(data: CreateCustomerDto): Promise<Customer> {
    return this.prisma.customers.create({
      data: { ...data, tags: data.tags || [], status: 'active' },
    });
  }

  async update(id: string, data: UpdateCustomerDto): Promise<Customer> {
    await this.findOne(id);
    return this.prisma.customers.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.customers.delete({ where: { id } });
  }
}

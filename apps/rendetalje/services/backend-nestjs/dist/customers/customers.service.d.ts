import { PrismaService } from '../database/prisma.service';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto, CustomerFiltersDto } from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class CustomersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(filters: CustomerFiltersDto): Promise<PaginatedResponseDto<Customer>>;
    findOne(id: string): Promise<Customer>;
    create(data: CreateCustomerDto): Promise<Customer>;
    update(id: string, data: UpdateCustomerDto): Promise<Customer>;
    remove(id: string): Promise<void>;
}

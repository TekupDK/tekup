import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerFiltersDto } from './dto';
import { Customer } from './entities/customer.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(createCustomerDto: CreateCustomerDto): Promise<Customer>;
    findAll(filters: CustomerFiltersDto): Promise<PaginatedResponseDto<Customer>>;
    findOne(id: string): Promise<Customer>;
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer>;
    remove(id: string): Promise<void>;
}

import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CreateMessageDto, CreateReviewDto, CustomerFiltersDto } from './dto';
import { Customer } from './entities/customer.entity';
import { CustomerMessage } from './entities/customer-message.entity';
import { CustomerReview } from './entities/customer-review.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(createCustomerDto: CreateCustomerDto, req: any): Promise<Customer>;
    findAll(filters: CustomerFiltersDto, req: any): Promise<PaginatedResponseDto<Customer>>;
    getAnalytics(timeRange: string, req: any): Promise<any>;
    getSatisfactionMetrics(req: any): Promise<any>;
    findOne(id: string, req: any): Promise<Customer>;
    getHistory(id: string, req: any): Promise<any>;
    getMessages(id: string, jobId: string, req: any): Promise<CustomerMessage[]>;
    createMessage(createMessageDto: CreateMessageDto, req: any): Promise<CustomerMessage>;
    markMessageAsRead(messageId: string, req: any): Promise<void>;
    getReviews(id: string, req: any): Promise<CustomerReview[]>;
    createReview(id: string, createReviewDto: CreateReviewDto, req: any): Promise<CustomerReview>;
    update(id: string, updateCustomerDto: UpdateCustomerDto, req: any): Promise<Customer>;
    deactivate(id: string, req: any): Promise<Customer>;
    activate(id: string, req: any): Promise<Customer>;
    remove(id: string, req: any): Promise<void>;
}

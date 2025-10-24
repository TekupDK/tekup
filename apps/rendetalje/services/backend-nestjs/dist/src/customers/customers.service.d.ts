import { BaseService } from '../common/services/base.service';
import { PrismaService } from '../database/prisma.service';
import { Customer } from './entities/customer.entity';
import { CustomerMessage } from './entities/customer-message.entity';
import { CustomerReview } from './entities/customer-review.entity';
import { CreateCustomerDto, CreateMessageDto, CreateReviewDto, CustomerFiltersDto } from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class CustomersService extends BaseService<Customer> {
    protected readonly prismaService: PrismaService;
    protected modelName: string;
    protected searchFields: string[];
    constructor(prismaService: PrismaService);
    findAllWithFilters(organizationId: string, filters: CustomerFiltersDto): Promise<PaginatedResponseDto<Customer>>;
    create(createCustomerDto: CreateCustomerDto, organizationId: string): Promise<Customer>;
    getCustomerHistory(id: string, organizationId: string): Promise<any>;
    getCustomerMessages(customerId: string, organizationId: string, jobId?: string): Promise<CustomerMessage[]>;
    createMessage(createMessageDto: CreateMessageDto, organizationId: string, senderId?: string): Promise<CustomerMessage>;
    markMessageAsRead(messageId: string, organizationId: string): Promise<void>;
    getCustomerReviews(customerId: string, organizationId: string): Promise<CustomerReview[]>;
    createReview(createReviewDto: CreateReviewDto, customerId: string, organizationId: string): Promise<CustomerReview>;
    getCustomerAnalytics(organizationId: string, timeRange?: string): Promise<any>;
    getCustomerSatisfactionMetrics(organizationId: string): Promise<any>;
    deactivateCustomer(id: string, organizationId: string): Promise<Customer>;
    activateCustomer(id: string, organizationId: string): Promise<Customer>;
    private checkDuplicateEmail;
    private validateJob;
    private validateJobBelongsToCustomer;
    private updateCustomerSatisfactionScore;
}

import { PrismaService } from '../../database/prisma.service';
import { PaginationDto, PaginatedResponseDto } from '../dto/pagination.dto';
export declare abstract class BaseService<T> {
    protected readonly prismaService: PrismaService;
    protected abstract modelName: string;
    protected abstract searchFields: string[];
    constructor(prismaService: PrismaService);
    findAll(organizationId: string, pagination: PaginationDto, filters?: Record<string, any>): Promise<PaginatedResponseDto<T>>;
    findById(id: string, organizationId: string): Promise<T>;
    create(createDto: Partial<T>, organizationId: string): Promise<T>;
    update(id: string, updateDto: Partial<T>, organizationId: string): Promise<T>;
    delete(id: string, organizationId: string): Promise<void>;
    count(organizationId: string, filters?: Record<string, any>): Promise<number>;
    protected getModel(): any;
}

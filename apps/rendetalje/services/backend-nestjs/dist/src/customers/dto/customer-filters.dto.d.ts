import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class CustomerFiltersDto extends PaginationDto {
    city?: string;
    is_active?: boolean;
    min_satisfaction?: number;
    min_jobs?: number;
    min_revenue?: number;
}

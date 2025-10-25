import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class CustomerFiltersDto extends PaginationDto {
    status?: string;
    tag?: string;
    minLeads?: number;
    minBookings?: number;
    minRevenue?: number;
}

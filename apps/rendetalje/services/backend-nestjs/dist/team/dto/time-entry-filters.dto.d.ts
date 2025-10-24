import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class TimeEntryFiltersDto extends PaginationDto {
    leadId?: string;
    bookingId?: string;
    teamMemberId?: string;
    dateFrom?: string;
    dateTo?: string;
}

import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class TimeEntryFiltersDto extends PaginationDto {
    job_id?: string;
    team_member_id?: string;
    date_from?: string;
    date_to?: string;
}

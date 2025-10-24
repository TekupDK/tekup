import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class TimeEntryFiltersDto extends PaginationDto {
    employee_id?: string;
    job_id?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
}

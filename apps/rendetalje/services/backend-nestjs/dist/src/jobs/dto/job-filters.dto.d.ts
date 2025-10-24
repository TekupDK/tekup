import { ServiceType, JobStatus } from '../entities/job.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class JobFiltersDto extends PaginationDto {
    status?: JobStatus;
    service_type?: ServiceType;
    customer_id?: string;
    team_member_id?: string;
    date_from?: string;
    date_to?: string;
    city?: string;
}

import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class TeamFiltersDto extends PaginationDto {
    is_active?: boolean;
    skills?: string[];
    hired_after?: string;
    hired_before?: string;
}

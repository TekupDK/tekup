import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class TeamFiltersDto extends PaginationDto {
    isActive?: boolean;
    skills?: string[];
    hiredAfter?: string;
    hiredBefore?: string;
}

import { TeamService } from './team.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto, CreateTimeEntryDto, UpdateTimeEntryDto, TeamFiltersDto, TimeEntryFiltersDto } from './dto';
import { TeamMember } from './entities/team-member.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class TeamController {
    private readonly teamService;
    constructor(teamService: TeamService);
    createMember(createTeamMemberDto: CreateTeamMemberDto, req: any): Promise<TeamMember>;
    findAllMembers(filters: TeamFiltersDto, req: any): Promise<PaginatedResponseDto<TeamMember>>;
    getPerformanceReport(req: any): Promise<any>;
    findOneMember(id: string, req: any): Promise<TeamMember>;
    getMemberSchedule(id: string, dateFrom: string, dateTo: string, req: any): Promise<any>;
    getMemberPerformance(id: string, req: any): Promise<any>;
    updateMember(id: string, updateTeamMemberDto: UpdateTeamMemberDto, req: any): Promise<TeamMember>;
    removeMember(id: string, req: any): Promise<void>;
    createTimeEntry(createTimeEntryDto: CreateTimeEntryDto, req: any): Promise<TimeEntry>;
    findAllTimeEntries(filters: TimeEntryFiltersDto, req: any): Promise<PaginatedResponseDto<TimeEntry>>;
    updateTimeEntry(id: string, updateTimeEntryDto: UpdateTimeEntryDto, req: any): Promise<TimeEntry>;
    removeTimeEntry(id: string, req: any): Promise<void>;
}

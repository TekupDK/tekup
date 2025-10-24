import { TeamService } from './team.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto, CreateTimeEntryDto, UpdateTimeEntryDto, TeamFiltersDto, TimeEntryFiltersDto } from './dto';
import { TeamMember } from './entities/team-member.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class TeamController {
    private readonly teamService;
    constructor(teamService: TeamService);
    createMember(createTeamMemberDto: CreateTeamMemberDto): Promise<TeamMember>;
    findAllMembers(filters: TeamFiltersDto): Promise<PaginatedResponseDto<TeamMember>>;
    findMemberById(id: string): Promise<TeamMember>;
    updateMember(id: string, updateTeamMemberDto: UpdateTeamMemberDto): Promise<TeamMember>;
    deactivateMember(id: string): Promise<TeamMember>;
    activateMember(id: string): Promise<TeamMember>;
    removeMember(id: string): Promise<void>;
    getMemberSchedule(id: string, dateFrom?: string, dateTo?: string): Promise<any[]>;
    getMemberPerformance(id: string): Promise<any>;
    createTimeEntry(createTimeEntryDto: CreateTimeEntryDto): Promise<TimeEntry>;
    findAllTimeEntries(filters: TimeEntryFiltersDto): Promise<PaginatedResponseDto<TimeEntry>>;
    findTimeEntryById(id: string): Promise<TimeEntry>;
    updateTimeEntry(id: string, updateTimeEntryDto: UpdateTimeEntryDto): Promise<TimeEntry>;
    deleteTimeEntry(id: string): Promise<void>;
}

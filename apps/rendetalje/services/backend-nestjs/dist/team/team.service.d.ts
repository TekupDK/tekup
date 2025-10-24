import { PrismaService } from '../database/prisma.service';
import { TeamMember } from './entities/team-member.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { CreateTeamMemberDto, UpdateTeamMemberDto, CreateTimeEntryDto, UpdateTimeEntryDto, TeamFiltersDto, TimeEntryFiltersDto } from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class TeamService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllWithFilters(filters: TeamFiltersDto): Promise<PaginatedResponseDto<TeamMember>>;
    findById(id: string): Promise<TeamMember>;
    create(createTeamMemberDto: CreateTeamMemberDto): Promise<TeamMember>;
    update(id: string, updateTeamMemberDto: UpdateTeamMemberDto): Promise<TeamMember>;
    deactivate(id: string): Promise<TeamMember>;
    activate(id: string): Promise<TeamMember>;
    remove(id: string): Promise<void>;
    getTeamMemberSchedule(teamMemberId: string, dateFrom?: string, dateTo?: string): Promise<any[]>;
    getTeamMemberPerformance(teamMemberId: string): Promise<any>;
    createTimeEntry(createTimeEntryDto: CreateTimeEntryDto): Promise<TimeEntry>;
    findTimeEntries(filters: TimeEntryFiltersDto): Promise<PaginatedResponseDto<TimeEntry>>;
    findTimeEntryById(id: string): Promise<TimeEntry>;
    updateTimeEntry(id: string, updateTimeEntryDto: UpdateTimeEntryDto): Promise<TimeEntry>;
    deleteTimeEntry(id: string): Promise<void>;
    private generateEmployeeId;
    private getDefaultPerformanceMetrics;
    private checkTimeEntryOverlap;
    private calculateTotalHours;
    private toTeamMemberEntity;
    private toTimeEntryEntity;
}

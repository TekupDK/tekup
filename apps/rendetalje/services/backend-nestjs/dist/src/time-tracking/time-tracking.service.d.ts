import { BaseService } from '../common/services/base.service';
import { SupabaseService } from '../supabase/supabase.service';
import { TimeEntry } from './entities/time-entry.entity';
import { TimeCorrection } from './entities/time-correction.entity';
import { CreateTimeEntryDto, UpdateTimeEntryDto, CreateTimeCorrectionDto, TimeEntryFiltersDto } from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class TimeTrackingService extends BaseService<TimeEntry> {
    protected readonly supabaseService: SupabaseService;
    protected tableName: string;
    protected searchFields: string[];
    constructor(supabaseService: SupabaseService);
    findAllWithFilters(organizationId: string, filters: TimeEntryFiltersDto): Promise<PaginatedResponseDto<TimeEntry>>;
    create(createTimeEntryDto: CreateTimeEntryDto, organizationId: string): Promise<TimeEntry>;
    update(id: string, updateTimeEntryDto: UpdateTimeEntryDto, organizationId: string): Promise<TimeEntry>;
    getDailySummary(employeeId: string, date: string, organizationId: string): Promise<any>;
    getOvertimeReport(startDate: string, endDate: string, organizationId: string): Promise<any>;
    createCorrection(createTimeCorrectionDto: CreateTimeCorrectionDto, organizationId: string, submittedBy: string): Promise<TimeCorrection>;
    getCorrections(organizationId: string, employeeId?: string, status?: string, date?: string): Promise<TimeCorrection[]>;
    approveCorrection(id: string, organizationId: string, approvedBy: string): Promise<TimeCorrection>;
    rejectCorrection(id: string, reason: string, organizationId: string, rejectedBy: string): Promise<TimeCorrection>;
    private validateTeamMember;
    private validateJob;
    private checkForActiveTimeEntry;
    private getCorrectionById;
    private getFilteredCount;
}

import { TimeTrackingService } from './time-tracking.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto, CreateTimeCorrectionDto, TimeEntryFiltersDto } from './dto';
import { TimeEntry } from './entities/time-entry.entity';
import { TimeCorrection } from './entities/time-correction.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
export declare class TimeTrackingController {
    private readonly timeTrackingService;
    constructor(timeTrackingService: TimeTrackingService);
    create(createTimeEntryDto: CreateTimeEntryDto, req: any): Promise<TimeEntry>;
    findAll(filters: TimeEntryFiltersDto, req: any): Promise<PaginatedResponseDto<TimeEntry>>;
    getDailySummary(employeeId: string, date: string, req: any): Promise<any>;
    getOvertimeReport(startDate: string, endDate: string, req: any): Promise<any>;
    findOne(id: string, req: any): Promise<TimeEntry>;
    update(id: string, updateTimeEntryDto: UpdateTimeEntryDto, req: any): Promise<TimeEntry>;
    remove(id: string, req: any): Promise<void>;
}
export declare class TimeCorrectionsController {
    private readonly timeTrackingService;
    constructor(timeTrackingService: TimeTrackingService);
    create(createTimeCorrectionDto: CreateTimeCorrectionDto, req: any): Promise<TimeCorrection>;
    findAll(employeeId?: string, status?: string, date?: string, req?: {}): Promise<TimeCorrection[]>;
    approve(id: string, req: any): Promise<TimeCorrection>;
    reject(id: string, reason: string, req: any): Promise<TimeCorrection>;
}

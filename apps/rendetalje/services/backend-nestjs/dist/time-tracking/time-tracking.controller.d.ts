import { TimeTrackingService } from './time-tracking.service';
import { CreateTimeCorrectionDto } from './dto/create-time-correction.dto';
import { TimeCorrection } from './entities/time-correction.entity';
export declare class TimeTrackingController {
    private readonly timeTrackingService;
    constructor(timeTrackingService: TimeTrackingService);
    getCorrections(employeeId?: string, status?: string, startDate?: string, endDate?: string): Promise<TimeCorrection[]>;
    getCorrectionById(id: string): Promise<TimeCorrection>;
    createCorrection(req: any, dto: CreateTimeCorrectionDto): Promise<TimeCorrection>;
    approveCorrection(req: any, id: string): Promise<TimeCorrection>;
    rejectCorrection(req: any, id: string, rejectionReason: string): Promise<TimeCorrection>;
    getOvertimeReport(startDate: string, endDate: string): Promise<any>;
}

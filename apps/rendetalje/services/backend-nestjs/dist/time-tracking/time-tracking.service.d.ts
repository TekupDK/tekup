import { PrismaService } from '../database/prisma.service';
import { CreateTimeCorrectionDto } from './dto/create-time-correction.dto';
import { TimeCorrection } from './entities/time-correction.entity';
export declare class TimeTrackingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCorrections(employeeId?: string, status?: string, startDate?: string, endDate?: string): Promise<TimeCorrection[]>;
    getCorrectionById(id: string): Promise<TimeCorrection>;
    createCorrection(dto: CreateTimeCorrectionDto, submittedByUserId: string): Promise<TimeCorrection>;
    approveCorrection(id: string, approvedByUserId: string): Promise<TimeCorrection>;
    rejectCorrection(id: string, rejectionReason: string, rejectedByUserId: string): Promise<TimeCorrection>;
    getOvertimeReport(startDate: string, endDate: string): Promise<any>;
}

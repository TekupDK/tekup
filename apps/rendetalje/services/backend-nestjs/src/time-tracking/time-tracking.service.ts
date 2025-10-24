import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTimeCorrectionDto } from './dto/create-time-correction.dto';
import { TimeCorrection } from './entities/time-correction.entity';

@Injectable()
export class TimeTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async getCorrections(
    employeeId?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<TimeCorrection[]> {
    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    if (employeeId) {
      const teamMember = await this.prisma.renosTeamMember.findUnique({
        where: { id: employeeId },
        select: { userId: true },
      });

      if (!teamMember) {
        throw new NotFoundException('Team member not found');
      }

      whereClause.submittedBy = teamMember.userId;
    }

    const corrections = await this.prisma.renosTimeCorrection.findMany({
      where: whereClause,
      include: {
        originalEntry: {
          include: {
            teamMember: {
              include: {
                user: { select: { id: true, email: true, name: true } },
              },
            },
          },
        },
        submitter: { select: { id: true, email: true, name: true } },
        approver: { select: { id: true, email: true, name: true } },
        rejecter: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return corrections;
  }

  async getCorrectionById(id: string): Promise<TimeCorrection> {
    const correction = await this.prisma.renosTimeCorrection.findUnique({
      where: { id },
      include: {
        originalEntry: {
          include: {
            teamMember: {
              include: {
                user: { select: { id: true, email: true, name: true } },
              },
            },
          },
        },
        submitter: { select: { id: true, email: true, name: true } },
      },
    });

    if (!correction) {
      throw new NotFoundException(`Time correction with ID ${id} not found`);
    }

    return correction;
  }

  async createCorrection(
    dto: CreateTimeCorrectionDto,
    submittedByUserId: string,
  ): Promise<TimeCorrection> {
    const originalEntry = await this.prisma.renosTimeEntry.findUnique({
      where: { id: dto.originalEntryId },
      include: {
        teamMember: { select: { userId: true } },
      },
    });

    if (!originalEntry) {
      throw new NotFoundException('Original time entry not found');
    }

    if (originalEntry.teamMember.userId !== submittedByUserId) {
      throw new BadRequestException('You can only correct your own time entries');
    }

    const existingPending = await this.prisma.renosTimeCorrection.findFirst({
      where: {
        originalEntryId: dto.originalEntryId,
        status: 'pending',
      },
    });

    if (existingPending) {
      throw new BadRequestException('A pending correction already exists for this time entry');
    }

    const correction = await this.prisma.renosTimeCorrection.create({
      data: {
        originalEntryId: dto.originalEntryId,
        originalStartTime: originalEntry.startTime,
        originalEndTime: originalEntry.endTime,
        originalBreakDuration: originalEntry.breakDuration,
        correctedStartTime: new Date(dto.correctedStartTime),
        correctedEndTime: dto.correctedEndTime ? new Date(dto.correctedEndTime) : null,
        correctedBreakDuration: dto.correctedBreakDuration,
        reason: dto.reason,
        status: 'pending',
        submittedBy: submittedByUserId,
      },
      include: {
        originalEntry: {
          include: {
            teamMember: {
              include: {
                user: { select: { id: true, email: true, name: true } },
              },
            },
          },
        },
        submitter: { select: { id: true, email: true, name: true } },
      },
    });

    return correction;
  }

  async approveCorrection(id: string, approvedByUserId: string): Promise<TimeCorrection> {
    const correction = await this.getCorrectionById(id);

    if (correction.status !== 'pending') {
      throw new BadRequestException('Only pending corrections can be approved');
    }

    const [updatedCorrection] = await this.prisma.$transaction([
      this.prisma.renosTimeCorrection.update({
        where: { id },
        data: {
          status: 'approved',
          approvedBy: approvedByUserId,
          approvedAt: new Date(),
        },
        include: {
          originalEntry: {
            include: {
              teamMember: {
                include: {
                  user: { select: { id: true, email: true, name: true } },
                },
              },
            },
          },
          submitter: { select: { id: true, email: true, name: true } },
          approver: { select: { id: true, email: true, name: true } },
        },
      }),
      this.prisma.renosTimeEntry.update({
        where: { id: correction.originalEntryId },
        data: {
          startTime: correction.correctedStartTime,
          endTime: correction.correctedEndTime,
          breakDuration: correction.correctedBreakDuration,
        },
      }),
    ]);

    return updatedCorrection;
  }

  async rejectCorrection(
    id: string,
    rejectionReason: string,
    rejectedByUserId: string,
  ): Promise<TimeCorrection> {
    const correction = await this.getCorrectionById(id);

    if (correction.status !== 'pending') {
      throw new BadRequestException('Only pending corrections can be rejected');
    }

    const updatedCorrection = await this.prisma.renosTimeCorrection.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedBy: rejectedByUserId,
        rejectedAt: new Date(),
        rejectionReason,
      },
      include: {
        originalEntry: {
          include: {
            teamMember: {
              include: {
                user: { select: { id: true, email: true, name: true } },
              },
            },
          },
        },
        submitter: { select: { id: true, email: true, name: true } },
        rejecter: { select: { id: true, email: true, name: true } },
      },
    });

    return updatedCorrection;
  }

  async getOvertimeReport(startDate: string, endDate: string): Promise<any> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const timeEntries = await this.prisma.renosTimeEntry.findMany({
      where: {
        startTime: { gte: start, lte: end },
        endTime: { not: null },
      },
      include: {
        teamMember: {
          include: {
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const employeeData = new Map<string, any>();

    for (const entry of timeEntries) {
      const employeeId = entry.teamMember.id;
      const date = entry.startTime.toISOString().split('T')[0];

      if (!employeeData.has(employeeId)) {
        employeeData.set(employeeId, {
          employeeId,
          employeeName: entry.teamMember.user.name,
          employeeEmail: entry.teamMember.user.email,
          totalOvertime: 0,
          overtimeDays: [],
        });
      }

      const startTime = entry.startTime.getTime();
      const endTime = entry.endTime!.getTime();
      const workedMinutes = Math.floor((endTime - startTime) / 60000) - entry.breakDuration;
      const overtime = Math.max(0, workedMinutes - 480);

      if (overtime > 0) {
        const employee = employeeData.get(employeeId)!;
        employee.totalOvertime += overtime;
        
        const existingDay = employee.overtimeDays.find((d: any) => d.date === date);
        if (existingDay) {
          existingDay.overtimeMinutes += overtime;
        } else {
          employee.overtimeDays.push({
            date,
            overtimeMinutes: overtime,
            overtimeHours: Math.floor(overtime / 60) + (overtime % 60) / 60,
          });
        }
      }
    }

    const report = Array.from(employeeData.values())
      .filter(emp => emp.totalOvertime > 0)
      .map(emp => ({
        ...emp,
        totalOvertimeHours: Math.floor(emp.totalOvertime / 60) + (emp.totalOvertime % 60) / 60,
      }));

    return report;
  }
}

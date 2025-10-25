import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TeamMember, PerformanceMetrics } from './entities/team-member.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { 
  CreateTeamMemberDto, 
  UpdateTeamMemberDto, 
  CreateTimeEntryDto, 
  UpdateTimeEntryDto,
  TeamFiltersDto,
  TimeEntryFiltersDto
} from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Team Member Management ====================

  async findAllWithFilters(
    filters: TeamFiltersDto,
  ): Promise<PaginatedResponseDto<TeamMember>> {
    const { isActive, skills, hiredAfter, hiredBefore, search, page = 1, limit = 10 } = filters;

    // Build where clause
    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (skills && skills.length > 0) {
      where.skills = {
        hasEvery: skills, // All skills must be present
      };
    }

    if (hiredAfter || hiredBefore) {
      where.hireDate = {};
      if (hiredAfter) where.hireDate.gte = new Date(hiredAfter);
      if (hiredBefore) where.hireDate.lte = new Date(hiredBefore);
    }

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await this.prisma.renosTeamMember.count({ where });

    // Get paginated data with user info
    const skip = (page - 1) * limit;
    const members = await this.prisma.renosTeamMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Transform to entity format
    const data = members.map(member => this.toTeamMemberEntity(member));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  async findById(id: string): Promise<TeamMember> {
    const member = await this.prisma.renosTeamMember.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Team member with ID ${id} not found`);
    }

    return this.toTeamMemberEntity(member);
  }

  async create(createTeamMemberDto: CreateTeamMemberDto): Promise<TeamMember> {
    // Validate user exists
    const user = await this.prisma.renosUser.findUnique({
      where: { id: createTeamMemberDto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createTeamMemberDto.userId} not found`);
    }

    // Check if team member already exists for this user
    const existingMember = await this.prisma.renosTeamMember.findUnique({
      where: { userId: createTeamMemberDto.userId },
    });

    if (existingMember) {
      throw new ConflictException('Team member already exists for this user');
    }

    // Generate employee ID if not provided
    const employeeId = createTeamMemberDto.employeeId || await this.generateEmployeeId();

    // Create team member
    const member = await this.prisma.renosTeamMember.create({
      data: {
        userId: createTeamMemberDto.userId,
        employeeId,
        skills: createTeamMemberDto.skills,
        hourlyRate: createTeamMemberDto.hourlyRate,
        availability: createTeamMemberDto.availability as any,
        performanceMetrics: this.getDefaultPerformanceMetrics() as any,
        isActive: true,
        hireDate: createTeamMemberDto.hireDate ? new Date(createTeamMemberDto.hireDate) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return this.toTeamMemberEntity(member);
  }

  async update(id: string, updateTeamMemberDto: UpdateTeamMemberDto): Promise<TeamMember> {
    // Check if team member exists
    await this.findById(id);

    // If updating userId, check it doesn't already have a team member
    if (updateTeamMemberDto.userId) {
      const existingMember = await this.prisma.renosTeamMember.findFirst({
        where: {
          userId: updateTeamMemberDto.userId,
          id: { not: id },
        },
      });

      if (existingMember) {
        throw new ConflictException('Another team member already exists for this user');
      }
    }

    const member = await this.prisma.renosTeamMember.update({
      where: { id },
      data: {
        ...(updateTeamMemberDto.userId && { userId: updateTeamMemberDto.userId }),
        ...(updateTeamMemberDto.employeeId && { employeeId: updateTeamMemberDto.employeeId }),
        ...(updateTeamMemberDto.skills && { skills: updateTeamMemberDto.skills }),
        ...(updateTeamMemberDto.hourlyRate !== undefined && { hourlyRate: updateTeamMemberDto.hourlyRate }),
        ...(updateTeamMemberDto.availability && { availability: updateTeamMemberDto.availability as any }),
        ...(updateTeamMemberDto.hireDate && { hireDate: new Date(updateTeamMemberDto.hireDate) }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return this.toTeamMemberEntity(member);
  }

  async deactivate(id: string): Promise<TeamMember> {
    // Check if team member exists
    await this.findById(id);

    const member = await this.prisma.renosTeamMember.update({
      where: { id },
      data: { isActive: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return this.toTeamMemberEntity(member);
  }

  async activate(id: string): Promise<TeamMember> {
    // Check if team member exists
    await this.findById(id);

    const member = await this.prisma.renosTeamMember.update({
      where: { id },
      data: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return this.toTeamMemberEntity(member);
  }

  async remove(id: string): Promise<void> {
    // Check if team member exists
    await this.findById(id);

    await this.prisma.renosTeamMember.delete({
      where: { id },
    });
  }

  // ==================== Schedule Management ====================

  async getTeamMemberSchedule(
    teamMemberId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any[]> {
    // Verify team member exists
    await this.findById(teamMemberId);

    // Get time entries for the date range
    const where: any = { teamMemberId };

    if (dateFrom || dateTo) {
      where.startTime = {};
      if (dateFrom) where.startTime.gte = new Date(dateFrom);
      if (dateTo) where.startTime.lte = new Date(dateTo);
    }

    const timeEntries = await this.prisma.renosTimeEntry.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    return timeEntries;
  }

  // ==================== Performance Management ====================

  async getTeamMemberPerformance(teamMemberId: string): Promise<any> {
    // Verify team member exists
    const teamMember = await this.findById(teamMemberId);

    // Get time entries
    const timeEntries = await this.prisma.renosTimeEntry.findMany({
      where: { 
        teamMemberId,
        endTime: { not: null },
      },
    });

    // Calculate performance metrics
    const totalHours = this.calculateTotalHours(timeEntries);

    return {
      currentMetrics: teamMember.performanceMetrics,
      totalHoursWorked: totalHours.regular,
      overtimeHours: totalHours.overtime,
      totalTimeEntries: timeEntries.length,
    };
  }

  // ==================== Time Entry Management ====================

  async createTimeEntry(createTimeEntryDto: CreateTimeEntryDto): Promise<TimeEntry> {
    // Validate team member exists
    const teamMember = await this.prisma.renosTeamMember.findUnique({
      where: { id: createTimeEntryDto.teamMemberId },
    });

    if (!teamMember) {
      throw new NotFoundException(`Team member with ID ${createTimeEntryDto.teamMemberId} not found`);
    }

    // Check for overlapping time entries
    await this.checkTimeEntryOverlap(createTimeEntryDto);

    const timeEntry = await this.prisma.renosTimeEntry.create({
      data: {
        teamMemberId: createTimeEntryDto.teamMemberId,
        leadId: createTimeEntryDto.leadId,
        bookingId: createTimeEntryDto.bookingId,
        startTime: new Date(createTimeEntryDto.startTime),
        endTime: createTimeEntryDto.endTime ? new Date(createTimeEntryDto.endTime) : null,
        breakDuration: createTimeEntryDto.breakDuration,
        notes: createTimeEntryDto.notes,
        location: createTimeEntryDto.location as any,
      },
    });

    return this.toTimeEntryEntity(timeEntry);
  }

  async findTimeEntries(
    filters: TimeEntryFiltersDto,
  ): Promise<PaginatedResponseDto<TimeEntry>> {
    const { teamMemberId, leadId, bookingId, dateFrom, dateTo, page = 1, limit = 10 } = filters;

    // Build where clause
    const where: any = {};
    
    if (teamMemberId) where.teamMemberId = teamMemberId;
    if (leadId) where.leadId = leadId;
    if (bookingId) where.bookingId = bookingId;

    if (dateFrom || dateTo) {
      where.startTime = {};
      if (dateFrom) where.startTime.gte = new Date(dateFrom);
      if (dateTo) where.startTime.lte = new Date(dateTo);
    }

    // Get total count
    const total = await this.prisma.renosTimeEntry.count({ where });

    // Get paginated data
    const skip = (page - 1) * limit;
    const entries = await this.prisma.renosTimeEntry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startTime: 'desc' },
    });

    const data = entries.map(entry => this.toTimeEntryEntity(entry));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  async findTimeEntryById(id: string): Promise<TimeEntry> {
    const entry = await this.prisma.renosTimeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(`Time entry with ID ${id} not found`);
    }

    return this.toTimeEntryEntity(entry);
  }

  async updateTimeEntry(id: string, updateTimeEntryDto: UpdateTimeEntryDto): Promise<TimeEntry> {
    // Check if time entry exists
    await this.findTimeEntryById(id);

    const entry = await this.prisma.renosTimeEntry.update({
      where: { id },
      data: {
        ...(updateTimeEntryDto.startTime && { startTime: new Date(updateTimeEntryDto.startTime) }),
        ...(updateTimeEntryDto.endTime && { endTime: new Date(updateTimeEntryDto.endTime) }),
        ...(updateTimeEntryDto.breakDuration !== undefined && { breakDuration: updateTimeEntryDto.breakDuration }),
        ...(updateTimeEntryDto.notes && { notes: updateTimeEntryDto.notes }),
        ...(updateTimeEntryDto.location && { location: updateTimeEntryDto.location as any }),
      },
    });

    return this.toTimeEntryEntity(entry);
  }

  async deleteTimeEntry(id: string): Promise<void> {
    // Check if time entry exists
    await this.findTimeEntryById(id);

    await this.prisma.renosTimeEntry.delete({
      where: { id },
    });
  }

  // ==================== Helper Methods ====================

  private async generateEmployeeId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.renosTeamMember.count();
    return `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      jobsCompleted: 0,
      averageJobDuration: 0,
      averageQualityScore: 0,
      customerSatisfaction: 0,
      punctualityScore: 0,
      efficiencyRating: 0,
      totalHoursWorked: 0,
      overtimeHours: 0,
    };
  }

  private async checkTimeEntryOverlap(createTimeEntryDto: CreateTimeEntryDto): Promise<void> {
    const startTime = new Date(createTimeEntryDto.startTime);
    const endTime = createTimeEntryDto.endTime ? new Date(createTimeEntryDto.endTime) : null;

    if (!endTime) return; // Can't check overlap if no end time

    const overlapping = await this.prisma.renosTimeEntry.findFirst({
      where: {
        teamMemberId: createTimeEntryDto.teamMemberId,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gte: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lte: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException('Time entry overlaps with an existing entry');
    }
  }

  private calculateTotalHours(timeEntries: any[]): { regular: number; overtime: number } {
    let totalMinutes = 0;

    timeEntries.forEach(entry => {
      if (entry.startTime && entry.endTime) {
        const start = new Date(entry.startTime);
        const end = new Date(entry.endTime);
        const minutes = (end.getTime() - start.getTime()) / 60000;
        totalMinutes += minutes - (entry.breakDuration || 0);
      }
    });

    const totalHours = totalMinutes / 60;
    const regularHours = Math.min(totalHours, 160); // 160 hours = standard month
    const overtimeHours = Math.max(0, totalHours - 160);

    return { regular: regularHours, overtime: overtimeHours };
  }

  private toTeamMemberEntity(member: any): TeamMember {
    return {
      id: member.id,
      userId: member.userId,
      employeeId: member.employeeId,
      skills: member.skills,
      hourlyRate: member.hourlyRate,
      availability: member.availability,
      performanceMetrics: member.performanceMetrics,
      isActive: member.isActive,
      hireDate: member.hireDate,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }

  private toTimeEntryEntity(entry: any): TimeEntry {
    return {
      id: entry.id,
      teamMemberId: entry.teamMemberId,
      leadId: entry.leadId,
      bookingId: entry.bookingId,
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakDuration: entry.breakDuration,
      notes: entry.notes,
      location: entry.location,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}

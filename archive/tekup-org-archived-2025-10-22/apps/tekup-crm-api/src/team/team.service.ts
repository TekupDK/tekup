import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { DanishBusinessUtils } from '../danish-business/danish-business.utils';
import { TeamRole, CleaningSkill } from '@prisma/client';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new team member
   */
  async create(tenantId: string, createTeamMemberDto: CreateTeamMemberDto) {
    const {
      name,
      role,
      phone,
      email,
      hourlyRate,
      skills,
      certifications,
      availability,
    } = createTeamMemberDto;

    // Validate Danish phone number if provided
    if (phone && !DanishBusinessUtils.isValidDanishPhone(phone)) {
      throw new BadRequestException('Invalid Danish phone number');
    }

    // Check if team member already exists in tenant
    if (email) {
      const existingMember = await this.prisma.teamMember.findFirst({
        where: { email, tenantId },
      });

      if (existingMember) {
        throw new ForbiddenException('Team member with this email already exists in tenant');
      }
    }

    // Get standard hourly rate if not provided
    const finalHourlyRate = hourlyRate || DanishBusinessUtils.getStandardHourlyRate(role);

    // Validate availability structure
    if (availability) {
      this.validateAvailabilityStructure(availability);
    }

    return this.prisma.teamMember.create({
      data: {
        tenantId,
        name,
        role: role || 'CLEANER',
        phone: phone ? DanishBusinessUtils.formatDanishPhone(phone) : phone,
        email,
        hourlyRate: finalHourlyRate,
        skills: skills || [],
        certifications: certifications || [],
        availability: availability || this.getDefaultAvailability(),
      },
    });
  }

  /**
   * Get all team members for a tenant
   */
  async findAll(tenantId: string, page = 1, limit = 10, role?: TeamRole) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (role) {
      where.role = role;
    }

    const [teamMembers, total] = await Promise.all([
      this.prisma.teamMember.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              jobAssignments: true,
              routes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teamMember.count({ where }),
    ]);

    return {
      data: teamMembers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get team member by ID
   */
  async findOne(tenantId: string, id: string) {
    const teamMember = await this.prisma.teamMember.findFirst({
      where: { id, tenantId },
      include: {
        jobAssignments: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                jobType: true,
                status: true,
                scheduledDate: true,
                costDetails: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        routes: {
          orderBy: { date: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            jobAssignments: true,
            routes: true,
          },
        },
      },
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    return teamMember;
  }

  /**
   * Update team member
   */
  async update(tenantId: string, id: string, updateTeamMemberDto: UpdateTeamMemberDto) {
    const teamMember = await this.findOne(tenantId, id);

    // Validate Danish phone number if provided
    if (updateTeamMemberDto.phone && !DanishBusinessUtils.isValidDanishPhone(updateTeamMemberDto.phone)) {
      throw new BadRequestException('Invalid Danish phone number');
    }

    // Check email uniqueness if updating
    if (updateTeamMemberDto.email && updateTeamMemberDto.email !== teamMember.email) {
      const existingMember = await this.prisma.teamMember.findFirst({
        where: { email: updateTeamMemberDto.email, tenantId },
      });

      if (existingMember) {
        throw new ForbiddenException('Team member with this email already exists in tenant');
      }
    }

    // Validate availability structure if updating
    if (updateTeamMemberDto.availability) {
      this.validateAvailabilityStructure(updateTeamMemberDto.availability);
    }

    return this.prisma.teamMember.update({
      where: { id },
      data: {
        ...updateTeamMemberDto,
        phone: updateTeamMemberDto.phone ? DanishBusinessUtils.formatDanishPhone(updateTeamMemberDto.phone) : updateTeamMemberDto.phone,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            jobAssignments: true,
            routes: true,
          },
        },
      },
    });
  }

  /**
   * Delete team member (soft delete)
   */
  async remove(tenantId: string, id: string) {
    const teamMember = await this.findOne(tenantId, id);

    return this.prisma.teamMember.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get team members by role
   */
  async findByRole(tenantId: string, role: TeamRole) {
    return this.prisma.teamMember.findMany({
      where: { tenantId, role, isActive: true },
      include: {
        _count: {
          select: {
            jobAssignments: true,
            routes: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get team members by skill
   */
  async findBySkill(tenantId: string, skill: CleaningSkill) {
    return this.prisma.teamMember.findMany({
      where: {
        tenantId,
        isActive: true,
        skills: {
          has: skill,
        },
      },
      include: {
        _count: {
          select: {
            jobAssignments: true,
            routes: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get available team members for a specific date and time
   */
  async getAvailableMembers(tenantId: string, date: string, startTime: string, endTime: string, skills?: CleaningSkill[]) {
    const targetDate = new Date(date);
    const dayOfWeek = this.getDayOfWeek(targetDate);
    
    const where: any = {
      tenantId,
      isActive: true,
    };

    if (skills && skills.length > 0) {
      where.skills = {
        hasSome: skills,
      };
    }

    const teamMembers = await this.prisma.teamMember.findMany({
      where,
      include: {
        jobAssignments: {
          include: {
            job: {
              select: {
                id: true,
                scheduledDate: true,
                estimatedDuration: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Filter by availability and existing jobs
    const availableMembers = teamMembers.filter(member => {
      // Check availability for the day
      const dayAvailability = member.availability[dayOfWeek];
      if (!dayAvailability || dayAvailability.length === 0) {
        return false;
      }

      // Check if member is available during the requested time
      const isAvailableInTimeSlot = dayAvailability.some(slot => {
        if (!slot.available) return false;
        
        const slotStart = this.timeToMinutes(slot.start);
        const slotEnd = this.timeToMinutes(slot.end);
        const requestedStart = this.timeToMinutes(startTime);
        const requestedEnd = this.timeToMinutes(endTime);

        return requestedStart >= slotStart && requestedEnd <= slotEnd;
      });

      if (!isAvailableInTimeSlot) {
        return false;
      }

      // Check for conflicting jobs
      const hasConflictingJob = member.jobAssignments.some(assignment => {
        const job = assignment.job;
        const jobDate = new Date(job.scheduledDate);
        const jobStart = this.timeToMinutes(job.scheduledDate.split('T')[1].substring(0, 5));
        const jobEnd = jobStart + job.estimatedDuration;

        // Check if it's the same date and time overlaps
        if (jobDate.toDateString() === targetDate.toDateString()) {
          const requestedStart = this.timeToMinutes(startTime);
          const requestedEnd = this.timeToMinutes(endTime);

          return !(requestedEnd <= jobStart || requestedStart >= jobEnd);
        }

        return false;
      });

      return !hasConflictingJob;
    });

    return availableMembers.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role,
      phone: member.phone,
      email: member.email,
      skills: member.skills,
      certifications: member.certifications,
      hourlyRate: member.hourlyRate,
    }));
  }

  /**
   * Get team member statistics
   */
  async getStatistics(tenantId: string, teamMemberId: string) {
    const teamMember = await this.findOne(tenantId, teamMemberId);

    const [
      totalJobs,
      completedJobs,
      totalHours,
      totalEarnings,
    ] = await Promise.all([
      this.prisma.jobTeamMember.count({
        where: { teamMemberId },
      }),
      this.prisma.jobTeamMember.count({
        where: {
          teamMemberId,
          job: {
            status: 'COMPLETED',
          },
        },
      }),
      this.prisma.cleaningJob.aggregate({
        where: {
          teamMembers: {
            some: { teamMemberId },
          },
          status: 'COMPLETED',
        },
        _sum: { actualDuration: true },
      }),
      this.prisma.cleaningJob.aggregate({
        where: {
          teamMembers: {
            some: { teamMemberId },
          },
          status: 'COMPLETED',
        },
        _sum: { costDetails: true },
      }),
    ]);

    const totalHoursWorked = totalHours._sum.actualDuration || 0;
    const totalEarningsAmount = totalEarnings._sum.costDetails || 0;

    return {
      teamMember: {
        id: teamMember.id,
        name: teamMember.name,
        role: teamMember.role,
        isActive: teamMember.isActive,
      },
      statistics: {
        jobs: {
          total: totalJobs,
          completed: completedJobs,
          completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
        },
        hours: {
          total: totalHoursWorked,
          averagePerJob: completedJobs > 0 ? totalHoursWorked / completedJobs : 0,
        },
        earnings: {
          total: totalEarningsAmount,
          averagePerJob: completedJobs > 0 ? totalEarningsAmount / completedJobs : 0,
          hourlyRate: teamMember.hourlyRate,
        },
      },
    };
  }

  /**
   * Get team statistics
   */
  async getTeamStatistics(tenantId: string) {
    const [
      totalMembers,
      activeMembers,
      membersByRole,
      totalJobs,
      totalHours,
    ] = await Promise.all([
      this.prisma.teamMember.count({ where: { tenantId } }),
      this.prisma.teamMember.count({ where: { tenantId, isActive: true } }),
      this.prisma.teamMember.groupBy({
        by: ['role'],
        where: { tenantId, isActive: true },
        _count: { role: true },
      }),
      this.prisma.jobTeamMember.count({
        where: {
          teamMember: { tenantId },
        },
      }),
      this.prisma.cleaningJob.aggregate({
        where: {
          tenantId,
          status: 'COMPLETED',
        },
        _sum: { actualDuration: true },
      }),
    ]);

    return {
      members: {
        total: totalMembers,
        active: activeMembers,
        byRole: membersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        }, {}),
      },
      jobs: {
        total: totalJobs,
      },
      hours: {
        total: totalHours._sum.actualDuration || 0,
      },
    };
  }

  /**
   * Validate availability structure
   */
  private validateAvailabilityStructure(availability: any) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      if (!availability[day] || !Array.isArray(availability[day])) {
        throw new BadRequestException(`Invalid availability structure for ${day}`);
      }

      for (const slot of availability[day]) {
        if (!slot.start || !slot.end || typeof slot.available !== 'boolean') {
          throw new BadRequestException(`Invalid time slot structure for ${day}`);
        }
      }
    }
  }

  /**
   * Get default availability (Monday-Friday 8:00-16:00)
   */
  private getDefaultAvailability() {
    return {
      monday: [{ start: '08:00', end: '16:00', available: true }],
      tuesday: [{ start: '08:00', end: '16:00', available: true }],
      wednesday: [{ start: '08:00', end: '16:00', available: true }],
      thursday: [{ start: '08:00', end: '16:00', available: true }],
      friday: [{ start: '08:00', end: '16:00', available: true }],
      saturday: [{ start: '09:00', end: '13:00', available: false }],
      sunday: [{ start: '09:00', end: '13:00', available: false }],
    };
  }

  /**
   * Get day of week as string
   */
  private getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  /**
   * Convert time string to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

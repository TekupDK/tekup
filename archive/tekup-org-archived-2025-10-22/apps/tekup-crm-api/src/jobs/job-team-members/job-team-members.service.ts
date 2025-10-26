import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignTeamMemberDto } from './dto/assign-team-member.dto';

@Injectable()
export class JobTeamMembersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Assign team member to job
   */
  async assign(tenantId: string, jobId: string, assignDto: AssignTeamMemberDto) {
    const { teamMemberId, role } = assignDto;

    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Verify team member exists and belongs to tenant
    const teamMember = await this.prisma.teamMember.findFirst({
      where: { id: teamMemberId, tenantId },
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    // Check if team member is already assigned to this job
    const existingAssignment = await this.prisma.jobTeamMember.findFirst({
      where: { jobId, teamMemberId },
    });

    if (existingAssignment) {
      throw new BadRequestException('Team member is already assigned to this job');
    }

    return this.prisma.jobTeamMember.create({
      data: {
        jobId,
        teamMemberId,
        role,
      },
      include: {
        teamMember: {
          select: {
            id: true,
            name: true,
            role: true,
            phone: true,
            email: true,
            skills: true,
            certifications: true,
          },
        },
      },
    });
  }

  /**
   * Remove team member from job
   */
  async unassign(tenantId: string, jobId: string, teamMemberId: string) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Verify assignment exists
    const assignment = await this.prisma.jobTeamMember.findFirst({
      where: { jobId, teamMemberId },
    });

    if (!assignment) {
      throw new NotFoundException('Team member assignment not found');
    }

    return this.prisma.jobTeamMember.delete({
      where: { id: assignment.id },
    });
  }

  /**
   * Get all team members assigned to job
   */
  async getJobTeamMembers(tenantId: string, jobId: string) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.jobTeamMember.findMany({
      where: { jobId },
      include: {
        teamMember: {
          select: {
            id: true,
            name: true,
            role: true,
            phone: true,
            email: true,
            skills: true,
            certifications: true,
            hourlyRate: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Update team member role in job
   */
  async updateRole(tenantId: string, jobId: string, teamMemberId: string, role: string) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Verify assignment exists
    const assignment = await this.prisma.jobTeamMember.findFirst({
      where: { jobId, teamMemberId },
    });

    if (!assignment) {
      throw new NotFoundException('Team member assignment not found');
    }

    return this.prisma.jobTeamMember.update({
      where: { id: assignment.id },
      data: { role },
      include: {
        teamMember: {
          select: {
            id: true,
            name: true,
            role: true,
            phone: true,
            email: true,
            skills: true,
            certifications: true,
          },
        },
      },
    });
  }

  /**
   * Get jobs for team member
   */
  async getTeamMemberJobs(tenantId: string, teamMemberId: string, startDate?: string, endDate?: string) {
    // Verify team member exists and belongs to tenant
    const teamMember = await this.prisma.teamMember.findFirst({
      where: { id: teamMemberId, tenantId },
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    const where: any = {
      teamMembers: {
        some: {
          teamMemberId,
        },
      },
    };

    if (startDate && endDate) {
      where.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return this.prisma.cleaningJob.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            postalCode: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
          },
        },
        teamMembers: {
          include: {
            teamMember: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }
}

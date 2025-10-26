import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('teams-service');

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTeam(data: CreateTeamDto): Promise<any> {
    try {
      const team = await this.prisma.cleaningTeam.create({
        data: {
          name: data.name,
          description: data.description,
          baseLocation: data.baseLocation,
          operatingHours: data.operatingHours,
          vehicleInfo: data.vehicleInfo,
          status: 'ACTIVE'
        }
      });

      logger.info(`Cleaning team created: ${team.id} - ${team.name}`);
      return team;
    } catch (error) {
      logger.error('Team creation failed:', error);
      throw error;
    }
  }

  async getTeams(): Promise<any[]> {
    return this.prisma.cleaningTeam.findMany({
      where: { status: 'ACTIVE' },
      include: {
        members: true,
        equipment: true
      }
    });
  }

  async getTeamById(id: string): Promise<any> {
    return this.prisma.cleaningTeam.findUnique({
      where: { id },
      include: {
        members: true,
        equipment: true,
        schedules: true
      }
    });
  }

  async addTeamMember(teamId: string, memberData: CreateEmployeeDto): Promise<any> {
    return this.prisma.cleaningEmployee.create({
      data: {
        teamId,
        name: memberData.name,
        cprNumber: memberData.cprNumber,
        position: memberData.position,
        startDate: memberData.startDate,
        specializations: memberData.specializations || [],
        weeklySchedule: memberData.weeklySchedule
      }
    });
  }

  async updateTeam(id: string, data: UpdateTeamDto): Promise<any> {
    return this.prisma.cleaningTeam.update({
      where: { id },
      data
    });
  }

  async deleteTeam(id: string): Promise<void> {
    await this.prisma.cleaningTeam.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });
  }
}

export interface CreateTeamDto {
  name: string;
  description?: string;
  baseLocation: string;
  operatingHours: any;
  vehicleInfo: any;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
  baseLocation?: string;
  operatingHours?: any;
  vehicleInfo?: any;
  status?: string;
}

export interface CreateEmployeeDto {
  name: string;
  cprNumber: string;
  position: string;
  startDate: Date;
  specializations?: string[];
  weeklySchedule: any;
}

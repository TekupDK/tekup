import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user
   */
  async create(tenantId: string, createUserDto: CreateUserDto) {
    const { email, name, role, phone } = createUserDto;

    // Check if user already exists in tenant
    const existingUser = await this.prisma.user.findFirst({
      where: { email, tenantId },
    });

    if (existingUser) {
      throw new ForbiddenException('User already exists in this tenant');
    }

    return this.prisma.user.create({
      data: {
        email,
        name,
        role: role || UserRole.CLEANER,
        phone,
        tenantId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });
  }

  /**
   * Get all users for a tenant
   */
  async findAll(tenantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: { tenantId },
      }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
            subscriptionTier: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user
   */
  async update(tenantId: string, id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(tenantId, id);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        updatedAt: new Date(),
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });
  }

  /**
   * Delete user (soft delete)
   */
  async remove(tenantId: string, id: string) {
    const user = await this.findOne(tenantId, id);

    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get users by role
   */
  async findByRole(tenantId: string, role: UserRole) {
    return this.prisma.user.findMany({
      where: { tenantId, role, isActive: true },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get active users count
   */
  async getActiveUsersCount(tenantId: string) {
    return this.prisma.user.count({
      where: { tenantId, isActive: true },
    });
  }
}

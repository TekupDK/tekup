import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@tekup/shared';
import { createLogger } from '@tekup/shared';
import { UserRole, TenantContext, AuthResult, CreateUserDto, LoginDto } from './types/auth.types.js';

const logger = createLogger('tekup-sso-service');

@Injectable()
export class TekUpSSOService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Authenticate user with email/password and return JWT token
   */
  async login(loginDto: LoginDto): Promise<AuthResult> {
    const { email, password, tenantId } = loginDto;

    // Find user with tenant context
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenantUsers: tenantId ? {
          some: { tenantId }
        } : undefined
      },
      include: {
        tenantUsers: {
          include: {
            tenant: true
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT with tenant context
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenantId || user.tenantUsers[0]?.tenantId,
      tenants: user.tenantUsers.map(tu => ({
        id: tu.tenant.id,
        name: tu.tenant.name,
        role: tu.role
      }))
    };

    const accessToken = this.jwtService.sign(payload);

    logger.info(`User ${email} authenticated successfully for tenant ${tenantId || 'default'}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenants: payload.tenants
      },
      accessToken,
      expiresIn: '24h'
    };
  }

  /**
   * Create new user with multi-tenant support
   */
  async createUser(createUserDto: CreateUserDto): Promise<AuthResult> {
    const { email, password, name, role = UserRole.USER, tenantId } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with tenant association
    const user = await this.prisma.user.create({
      data: {
        email,
        hashedPassword,
        name,
        role,
        tenantUsers: tenantId ? {
          create: {
            tenantId,
            role
          }
        } : undefined
      },
      include: {
        tenantUsers: {
          include: {
            tenant: true
          }
        }
      }
    });

    // Generate initial JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenantId || null,
      tenants: user.tenantUsers.map(tu => ({
        id: tu.tenant.id,
        name: tu.tenant.name,
        role: tu.role
      }))
    };

    const accessToken = this.jwtService.sign(payload);

    logger.info(`User ${email} created successfully with role ${role}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenants: payload.tenants
      },
      accessToken,
      expiresIn: '24h'
    };
  }

  /**
   * Verify JWT token and extract user/tenant context
   */
  async verifyToken(token: string): Promise<TenantContext> {
    try {
      const payload = this.jwtService.verify(token);
      
      // Validate user still exists and has access to tenant
      const user = await this.prisma.user.findFirst({
        where: {
          id: payload.sub,
          tenantUsers: payload.tenantId ? {
            some: { tenantId: payload.tenantId }
          } : undefined
        },
        include: {
          tenantUsers: {
            include: {
              tenant: true
            }
          }
        }
      });

      if (!user) {
        throw new UnauthorizedException('Invalid token - user not found or no tenant access');
      }

      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: payload.tenantId,
        tenants: user.tenantUsers.map(tu => ({
          id: tu.tenant.id,
          name: tu.tenant.name,
          role: tu.role
        }))
      };
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Switch user context to different tenant
   */
  async switchTenant(userId: string, tenantId: string): Promise<string> {
    // Verify user has access to requested tenant
    const tenantUser = await this.prisma.tenantUser.findFirst({
      where: {
        userId,
        tenantId
      },
      include: {
        user: true,
        tenant: true
      }
    });

    if (!tenantUser) {
      throw new UnauthorizedException('No access to requested tenant');
    }

    // Generate new JWT with updated tenant context
    const payload = {
      sub: userId,
      email: tenantUser.user.email,
      role: tenantUser.role,
      tenantId,
      tenants: [{ // Note: This is simplified - full implementation would load all tenants
        id: tenantUser.tenant.id,
        name: tenantUser.tenant.name,
        role: tenantUser.role
      }]
    };

    const accessToken = this.jwtService.sign(payload);

    logger.info(`User ${tenantUser.user.email} switched to tenant ${tenantUser.tenant.name}`);

    return accessToken;
  }

  /**
   * Validate user has required role for operation
   */
  validateRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.SUPER_ADMIN]: 4,
      [UserRole.ADMIN]: 3,
      [UserRole.MANAGER]: 2,
      [UserRole.USER]: 1,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Create tenant for multi-tenant isolation
   */
  async createTenant(name: string, ownerId: string): Promise<any> {
    const tenant = await this.prisma.tenant.create({
      data: {
        name,
        tenantUsers: {
          create: {
            userId: ownerId,
            role: UserRole.ADMIN
          }
        }
      }
    });

    logger.info(`Tenant ${name} created by user ${ownerId}`);
    return tenant;
  }
}

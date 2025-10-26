/**
 * Authentication Service for RestaurantIQ
 * Handles user authentication, registration, and password management
 */

import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { loggers } from '../config/logger';
import { jwtService } from './jwtService';
import { cache } from '../config/redis';

interface LoginCredentials {
  email: string;
  password: string;
  tenantSubdomain?: string;
}

interface RegisterData {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  department?: string;
  position?: string;
  employeeNumber?: string;
}

interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  locationAccess: string[];
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
}

interface LoginResult {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export class AuthService {
  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const { email, password, tenantSubdomain } = credentials;

      // Find user by email and optionally tenant
      let query = db('users')
        .select(
          'users.*',
          'tenants.subdomain',
          'tenants.name as tenant_name',
          'tenants.status as tenant_status'
        )
        .join('tenants', 'users.tenant_id', 'tenants.id')
        .where('users.email', email.toLowerCase())
        .where('users.is_active', true);

      // If tenant subdomain is provided, filter by it
      if (tenantSubdomain) {
        query = query.where('tenants.subdomain', tenantSubdomain);
      }

      const users = await query.limit(2); // Get max 2 to detect duplicates

      if (users.length === 0) {
        loggers.warn('Login attempt with invalid email', { email });
        throw new Error('Invalid credentials');
      }

      if (users.length > 1 && !tenantSubdomain) {
        loggers.warn('Multiple users found without tenant specification', { email });
        throw new Error('Please specify tenant subdomain');
      }

      const user = users[0];

      // Check tenant status
      if (user.tenant_status !== 'active') {
        loggers.warn('Login attempt for inactive tenant', {
          email,
          tenantId: user.tenant_id,
          tenantStatus: user.tenant_status,
        });
        throw new Error('Account suspended');
      }

      // Check if user is locked due to failed attempts
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        loggers.warn('Login attempt for locked user', {
          userId: user.id,
          email,
          lockedUntil: user.locked_until,
        });
        throw new Error('Account temporarily locked');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        await this.handleFailedLogin(user.id);
        loggers.warn('Login attempt with invalid password', {
          userId: user.id,
          email,
        });
        throw new Error('Invalid credentials');
      }

      // Reset failed login attempts and update last login
      await this.handleSuccessfulLogin(user.id);

      // Parse JSON fields
      const permissions = this.parseJsonField(user.permissions, []);
      const locationAccess = this.parseJsonField(user.location_access, []);

      // Create auth user object
      const authUser: AuthUser = {
        id: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        permissions,
        locationAccess,
        isActive: user.is_active,
        isVerified: user.is_verified,
        lastLoginAt: user.last_login_at,
      };

      // Generate JWT tokens
      const tokens = await jwtService.generateTokenPair({
        userId: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        role: user.role,
        permissions,
        locationAccess,
      });

      loggers.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        tenantId: user.tenant_id,
        role: user.role,
      });

      return {
        user: authUser,
        tokens,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      loggers.error('Login error', {
        email: credentials.email,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthUser> {
    try {
      const {
        tenantId,
        email,
        password,
        firstName,
        lastName,
        phone,
        role = 'employee',
        department,
        position,
        employeeNumber,
      } = data;

      // Check if user already exists
      const existingUser = await db('users')
        .where('email', email.toLowerCase())
        .where('tenant_id', tenantId)
        .first();

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Validate tenant exists and is active
      const tenant = await db('tenants')
        .where('id', tenantId)
        .where('status', 'active')
        .first();

      if (!tenant) {
        throw new Error('Invalid tenant');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const [user] = await db('users')
        .insert({
          tenant_id: tenantId,
          email: email.toLowerCase(),
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone,
          role,
          department,
          position,
          employee_number: employeeNumber,
          is_active: true,
          is_verified: false, // Will need email verification
          permissions: JSON.stringify(this.getDefaultPermissions(role)),
          location_access: JSON.stringify([]),
        })
        .returning('*');

      loggers.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        tenantId,
        role,
      });

      return {
        id: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        permissions: this.getDefaultPermissions(role),
        locationAccess: [],
        isActive: user.is_active,
        isVerified: user.is_verified,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      loggers.error('Registration error', {
        email: data.email,
        tenantId: data.tenantId,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      // Verify refresh token
      const tokenData = await jwtService.verifyRefreshToken(refreshToken);

      // Get current user data
      const user = await db('users')
        .select('*')
        .where('id', tokenData.userId)
        .where('is_active', true)
        .first();

      if (!user) {
        throw new Error('User not found or inactive');
      }

      const permissions = this.parseJsonField(user.permissions, []);
      const locationAccess = this.parseJsonField(user.location_access, []);

      // Generate new access token
      const accessToken = await jwtService.refreshAccessToken(refreshToken, {
        userId: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        role: user.role,
        permissions,
        locationAccess,
      });

      const expiresIn = jwtService['getExpiryInSeconds'](process.env.JWT_EXPIRATION || '15m');

      loggers.debug('Access token refreshed', {
        userId: user.id,
        tenantId: user.tenant_id,
      });

      return { accessToken, expiresIn };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      loggers.warn('Token refresh error', { error: errorMessage });
      throw new Error(errorMessage);
    }
  }

  /**
   * Logout user and revoke tokens
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await jwtService.revokeRefreshToken(refreshToken);
      loggers.debug('User logged out successfully');
    } catch (error) {
      loggers.warn('Logout error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - logout should always succeed from user perspective
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get user with current password hash
      const user = await db('users')
        .select('password_hash')
        .where('id', userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await db('users')
        .where('id', userId)
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date(),
        });

      // Revoke all existing tokens for security
      await jwtService.revokeAllUserTokens(userId);

      loggers.info('Password changed successfully', { userId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      loggers.error('Password change error', { userId, error: errorMessage });
      throw new Error(errorMessage);
    }
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(userId: string): Promise<void> {
    try {
      const user = await db('users')
        .select('failed_login_attempts')
        .where('id', userId)
        .first();

      const failedAttempts = (user?.failed_login_attempts || 0) + 1;
      const maxAttempts = 5;
      const lockDuration = 30 * 60 * 1000; // 30 minutes

      const updateData: any = {
        failed_login_attempts: failedAttempts,
        updated_at: new Date(),
      };

      // Lock account after max attempts
      if (failedAttempts >= maxAttempts) {
        updateData.locked_until = new Date(Date.now() + lockDuration);
        loggers.warn('User account locked due to failed attempts', {
          userId,
          failedAttempts,
        });
      }

      await db('users').where('id', userId).update(updateData);
    } catch (error) {
      loggers.error('Failed to handle failed login', { userId, error });
    }
  }

  /**
   * Handle successful login
   */
  private async handleSuccessfulLogin(userId: string): Promise<void> {
    try {
      await db('users')
        .where('id', userId)
        .update({
          failed_login_attempts: 0,
          locked_until: null,
          last_login_at: new Date(),
          last_login_ip: null, // Would be set by middleware
          updated_at: new Date(),
        });
    } catch (error) {
      loggers.error('Failed to handle successful login', { userId, error });
    }
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      employee: ['inventory:read', 'menu:read'],
      shift_manager: [
        'inventory:read',
        'menu:read',
        'staff:read',
        'staff:schedule',
        'sales:read',
      ],
      location_manager: [
        'inventory:read',
        'inventory:write',
        'menu:read',
        'menu:write',
        'staff:read',
        'staff:write',
        'staff:schedule',
        'sales:read',
        'reports:read',
        'settings:read',
      ],
      tenant_admin: [
        'inventory:read',
        'inventory:write',
        'inventory:delete',
        'menu:read',
        'menu:write',
        'menu:delete',
        'staff:read',
        'staff:write',
        'staff:delete',
        'staff:schedule',
        'staff:payroll',
        'sales:read',
        'sales:analytics',
        'reports:read',
        'reports:create',
        'reports:export',
        'settings:read',
        'settings:write',
        'settings:integrations',
      ],
    };

    return permissions[role] || permissions.employee;
  }

  /**
   * Parse JSON field with fallback
   */
  private parseJsonField<T>(field: any, fallback: T): T {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return fallback;
      }
    }
    return field || fallback;
  }
}

// Export singleton instance
export const authService = new AuthService();

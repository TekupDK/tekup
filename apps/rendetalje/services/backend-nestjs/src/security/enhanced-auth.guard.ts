import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuditLoggerService, AuditAction } from './audit-logger.service';
import { SecurityConfigService } from './security-config.service';
import { SupabaseService } from '../supabase/supabase.service';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  sessionId?: string;
  lastActivity?: Date;
}

@Injectable()
export class EnhancedAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private auditLogger: AuditLoggerService,
    private securityConfig: SecurityConfigService,
    private supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    // Skip authentication for public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    try {
      // Extract token from request
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException('No authentication token provided');
      }

      // Verify and decode token
      const payload = await this.verifyToken(token);
      
      // Load user details and validate session
      const user = await this.validateUser(payload);
      
      // Check for account lockout
      await this.checkAccountLockout(user.id);
      
      // Validate session
      await this.validateSession(user, request);
      
      // Check rate limiting
      await this.checkRateLimit(request, user);
      
      // Update last activity
      await this.updateLastActivity(user.id);
      
      // Attach user to request
      request['user'] = user;
      
      // Log successful authentication
      await this.auditLogger.logAuthentication(
        user.id,
        user.organizationId,
        AuditAction.LOGIN,
        this.getClientIp(request),
        request.headers['user-agent'],
        user.sessionId,
      );

      return true;

    } catch (error) {
      // Log failed authentication attempt
      await this.auditLogger.logAuthenticationFailure(
        request.body?.email || 'unknown',
        error.message,
        this.getClientIp(request),
        request.headers['user-agent'],
      );

      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async verifyToken(token: string): Promise<any> {
    try {
      const jwtConfig = this.securityConfig.getJwtConfig();
      return await this.jwtService.verifyAsync(token, {
        secret: jwtConfig.secret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async validateUser(payload: any): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Load user from database
    const { data: user, error } = await this.supabaseService.client
      .from('users')
      .select(`
        id,
        email,
        role,
        organization_id,
        is_active,
        last_login,
        failed_login_attempts,
        locked_until
      `)
      .eq('id', payload.sub)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.is_active) {
      throw new ForbiddenException('Account is deactivated');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      sessionId: payload.sessionId,
      lastActivity: user.last_login ? new Date(user.last_login) : undefined,
    };
  }

  private async checkAccountLockout(userId: string): Promise<void> {
    const { data: user } = await this.supabaseService.client
      .from('users')
      .select('locked_until, failed_login_attempts')
      .eq('id', userId)
      .single();

    if (user?.locked_until) {
      const lockoutEnd = new Date(user.locked_until);
      if (lockoutEnd > new Date()) {
        const remainingTime = Math.ceil((lockoutEnd.getTime() - Date.now()) / 1000 / 60);
        throw new ForbiddenException(
          `Account is locked. Try again in ${remainingTime} minutes.`
        );
      } else {
        // Lockout period has expired, clear it
        await this.supabaseService.client
          .from('users')
          .update({
            locked_until: null,
            failed_login_attempts: 0,
          })
          .eq('id', userId);
      }
    }
  }

  private async validateSession(user: AuthenticatedUser, request: Request): Promise<void> {
    if (!user.sessionId) {
      return; // No session validation required
    }

    // Check if session exists and is valid
    const { data: session } = await this.supabaseService.client
      .from('user_sessions')
      .select('id, expires_at, ip_address')
      .eq('id', user.sessionId)
      .eq('user_id', user.id)
      .single();

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    if (new Date(session.expires_at) < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    // Optional: Validate IP address consistency
    const currentIp = this.getClientIp(request);
    if (session.ip_address && session.ip_address !== currentIp) {
      await this.auditLogger.logSecurityEvent(
        AuditAction.SUSPICIOUS_ACTIVITY,
        {
          reason: 'IP address mismatch',
          sessionIp: session.ip_address,
          currentIp,
        },
        user.id,
        user.organizationId,
        currentIp,
      );
      
      // Don't throw error, just log for now
      // In high-security environments, you might want to invalidate the session
    }
  }

  private async checkRateLimit(request: Request, user: AuthenticatedUser): Promise<void> {
    const clientIp = this.getClientIp(request);
    const rateLimitConfig = this.securityConfig.getRateLimitConfig();
    
    // Check rate limit per user
    const userKey = `rate_limit:user:${user.id}`;
    const ipKey = `rate_limit:ip:${clientIp}`;
    
    // This is a simplified rate limiting check
    // In production, you'd use Redis or similar for distributed rate limiting
    
    // For now, we'll just log excessive requests
    const now = new Date();
    const windowStart = new Date(now.getTime() - rateLimitConfig.window);
    
    const { count: userRequests } = await this.supabaseService.client
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('timestamp', windowStart.toISOString());

    if (userRequests && userRequests > rateLimitConfig.max) {
      await this.auditLogger.logSecurityEvent(
        AuditAction.SUSPICIOUS_ACTIVITY,
        {
          reason: 'Rate limit exceeded',
          requestCount: userRequests,
          windowMinutes: rateLimitConfig.window / 60000,
        },
        user.id,
        user.organizationId,
        clientIp,
      );
      
      throw new ForbiddenException('Rate limit exceeded');
    }
  }

  private async updateLastActivity(userId: string): Promise<void> {
    await this.supabaseService.client
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
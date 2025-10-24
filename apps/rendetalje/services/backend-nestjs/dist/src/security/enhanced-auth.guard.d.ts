import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuditLoggerService } from './audit-logger.service';
import { SecurityConfigService } from './security-config.service';
import { SupabaseService } from '../supabase/supabase.service';
export declare class EnhancedAuthGuard implements CanActivate {
    private jwtService;
    private reflector;
    private auditLogger;
    private securityConfig;
    private supabaseService;
    constructor(jwtService: JwtService, reflector: Reflector, auditLogger: AuditLoggerService, securityConfig: SecurityConfigService, supabaseService: SupabaseService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
    private verifyToken;
    private validateUser;
    private checkAccountLockout;
    private validateSession;
    private checkRateLimit;
    private updateLastActivity;
    private getClientIp;
}

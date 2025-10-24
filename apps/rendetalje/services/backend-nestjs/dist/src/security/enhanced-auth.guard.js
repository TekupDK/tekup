"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const audit_logger_service_1 = require("./audit-logger.service");
const security_config_service_1 = require("./security-config.service");
const supabase_service_1 = require("../supabase/supabase.service");
let EnhancedAuthGuard = class EnhancedAuthGuard {
    constructor(jwtService, reflector, auditLogger, securityConfig, supabaseService) {
        this.jwtService = jwtService;
        this.reflector = reflector;
        this.auditLogger = auditLogger;
        this.securityConfig = securityConfig;
        this.supabaseService = supabaseService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const isPublic = this.reflector.getAllAndOverride('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        try {
            const token = this.extractTokenFromHeader(request);
            if (!token) {
                throw new common_1.UnauthorizedException('No authentication token provided');
            }
            const payload = await this.verifyToken(token);
            const user = await this.validateUser(payload);
            await this.checkAccountLockout(user.id);
            await this.validateSession(user, request);
            await this.checkRateLimit(request, user);
            await this.updateLastActivity(user.id);
            request['user'] = user;
            await this.auditLogger.logAuthentication(user.id, user.organizationId, audit_logger_service_1.AuditAction.LOGIN, this.getClientIp(request), request.headers['user-agent'], user.sessionId);
            return true;
        }
        catch (error) {
            await this.auditLogger.logAuthenticationFailure(request.body?.email || 'unknown', error.message, this.getClientIp(request), request.headers['user-agent']);
            if (error instanceof common_1.UnauthorizedException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Authentication failed');
        }
    }
    extractTokenFromHeader(request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
    async verifyToken(token) {
        try {
            const jwtConfig = this.securityConfig.getJwtConfig();
            return await this.jwtService.verifyAsync(token, {
                secret: jwtConfig.secret,
            });
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    async validateUser(payload) {
        if (!payload.sub || !payload.email) {
            throw new common_1.UnauthorizedException('Invalid token payload');
        }
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
            throw new common_1.UnauthorizedException('User not found');
        }
        if (!user.is_active) {
            throw new common_1.ForbiddenException('Account is deactivated');
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
    async checkAccountLockout(userId) {
        const { data: user } = await this.supabaseService.client
            .from('users')
            .select('locked_until, failed_login_attempts')
            .eq('id', userId)
            .single();
        if (user?.locked_until) {
            const lockoutEnd = new Date(user.locked_until);
            if (lockoutEnd > new Date()) {
                const remainingTime = Math.ceil((lockoutEnd.getTime() - Date.now()) / 1000 / 60);
                throw new common_1.ForbiddenException(`Account is locked. Try again in ${remainingTime} minutes.`);
            }
            else {
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
    async validateSession(user, request) {
        if (!user.sessionId) {
            return;
        }
        const { data: session } = await this.supabaseService.client
            .from('user_sessions')
            .select('id, expires_at, ip_address')
            .eq('id', user.sessionId)
            .eq('user_id', user.id)
            .single();
        if (!session) {
            throw new common_1.UnauthorizedException('Invalid session');
        }
        if (new Date(session.expires_at) < new Date()) {
            throw new common_1.UnauthorizedException('Session expired');
        }
        const currentIp = this.getClientIp(request);
        if (session.ip_address && session.ip_address !== currentIp) {
            await this.auditLogger.logSecurityEvent(audit_logger_service_1.AuditAction.SUSPICIOUS_ACTIVITY, {
                reason: 'IP address mismatch',
                sessionIp: session.ip_address,
                currentIp,
            }, user.id, user.organizationId, currentIp);
        }
    }
    async checkRateLimit(request, user) {
        const clientIp = this.getClientIp(request);
        const rateLimitConfig = this.securityConfig.getRateLimitConfig();
        const userKey = `rate_limit:user:${user.id}`;
        const ipKey = `rate_limit:ip:${clientIp}`;
        const now = new Date();
        const windowStart = new Date(now.getTime() - rateLimitConfig.window);
        const { count: userRequests } = await this.supabaseService.client
            .from('audit_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('timestamp', windowStart.toISOString());
        if (userRequests && userRequests > rateLimitConfig.max) {
            await this.auditLogger.logSecurityEvent(audit_logger_service_1.AuditAction.SUSPICIOUS_ACTIVITY, {
                reason: 'Rate limit exceeded',
                requestCount: userRequests,
                windowMinutes: rateLimitConfig.window / 60000,
            }, user.id, user.organizationId, clientIp);
            throw new common_1.ForbiddenException('Rate limit exceeded');
        }
    }
    async updateLastActivity(userId) {
        await this.supabaseService.client
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', userId);
    }
    getClientIp(request) {
        return (request.headers['x-forwarded-for'] ||
            request.headers['x-real-ip'] ||
            request.connection.remoteAddress ||
            request.socket.remoteAddress ||
            'unknown');
    }
};
exports.EnhancedAuthGuard = EnhancedAuthGuard;
exports.EnhancedAuthGuard = EnhancedAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        core_1.Reflector,
        audit_logger_service_1.AuditLoggerService,
        security_config_service_1.SecurityConfigService,
        supabase_service_1.SupabaseService])
], EnhancedAuthGuard);
//# sourceMappingURL=enhanced-auth.guard.js.map
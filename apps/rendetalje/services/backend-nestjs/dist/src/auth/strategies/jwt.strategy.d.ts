import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    organizationId: string;
    iat?: number;
    exp?: number;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("../../common/enums/user-role.enum").UserRole;
        organizationId: string;
        phone: string;
        avatarUrl: string;
        settings: Record<string, any>;
        isActive: boolean;
        lastLoginAt: string;
    }>;
}
export {};

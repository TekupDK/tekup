import { UserRole } from './user.types';
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    organizationId: string;
    phone?: string;
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        organizationId: string;
    };
    accessToken: string;
}
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    organizationId: string;
    iat?: number;
    exp?: number;
}

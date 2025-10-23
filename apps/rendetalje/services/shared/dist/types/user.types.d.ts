import { z } from 'zod';
export declare enum UserRole {
    OWNER = "owner",
    ADMIN = "admin",
    EMPLOYEE = "employee",
    CUSTOMER = "customer"
}
export declare const UserSchema: any;
export type User = z.infer<typeof UserSchema>;
export declare const LoginSchema: any;
export declare const RegisterSchema: any;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export declare const UpdateUserProfileSchema: any;
export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>;
export interface UserPermissions {
    canViewDashboard: boolean;
    canManageCustomers: boolean;
    canManageTeam: boolean;
    canManageJobs: boolean;
    canViewReports: boolean;
    canManageBilling: boolean;
    canAccessMobile: boolean;
}
export interface UserSession {
    user: User;
    permissions: UserPermissions;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
}

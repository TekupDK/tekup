import { z } from 'zod';
export declare enum UserRole {
    OWNER = "owner",
    ADMIN = "admin",
    EMPLOYEE = "employee",
    CUSTOMER = "customer"
}
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    phone: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    settings: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    organizationId: string;
    email: string;
    name: string;
    role: UserRole;
    settings: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    phone?: string | undefined;
    avatarUrl?: string | undefined;
}, {
    id: string;
    organizationId: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    phone?: string | undefined;
    avatarUrl?: string | undefined;
    settings?: Record<string, any> | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
    phone?: string | undefined;
}, {
    email: string;
    name: string;
    password: string;
    phone?: string | undefined;
}>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export declare const UpdateUserProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
    avatarUrl?: string | undefined;
    settings?: Record<string, any> | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    avatarUrl?: string | undefined;
    settings?: Record<string, any> | undefined;
}>;
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

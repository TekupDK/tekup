import { z } from 'zod';

// User Roles
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin', 
  EMPLOYEE = 'employee',
  CUSTOMER = 'customer'
}

// User Schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  settings: z.record(z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type User = z.infer<typeof UserSchema>;

// Authentication
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional()
});

export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;

// User Profile Update
export const UpdateUserProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  settings: z.record(z.any()).optional()
});

export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>;

// User Permissions
export interface UserPermissions {
  canViewDashboard: boolean;
  canManageCustomers: boolean;
  canManageTeam: boolean;
  canManageJobs: boolean;
  canViewReports: boolean;
  canManageBilling: boolean;
  canAccessMobile: boolean;
}

// User Session
export interface UserSession {
  user: User;
  permissions: UserPermissions;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
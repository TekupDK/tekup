import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../types/auth.types.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Individual role decorators for convenience
export const RequireAdmin = () => Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN);
export const RequireManager = () => Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN);
export const RequireSuperAdmin = () => Roles(UserRole.SUPER_ADMIN);

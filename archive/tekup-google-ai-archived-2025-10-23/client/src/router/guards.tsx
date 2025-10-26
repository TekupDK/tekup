import { RouteGuard } from './types';

// Authentication guard
export const authGuard: RouteGuard = {
  canActivate: () => {
    // Check if user is authenticated
    // This would typically check a token or user state
    return true; // For now, always allow access
  },
  redirectTo: '/login'
};

// Role-based guard
export const createRoleGuard = (_allowedRoles: string[]): RouteGuard => ({
  canActivate: () => {
    // Check if user has required role
    // This would typically check user roles from state
    return true; // For now, always allow access
  },
  redirectTo: '/unauthorized'
});

// Admin guard
export const adminGuard: RouteGuard = {
  canActivate: () => {
    // Check if user is admin
    return true; // For now, always allow access
  },
  redirectTo: '/unauthorized'
};

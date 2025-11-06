/**
 * Role-Based Access Control (RBAC)
 * Defines roles and their permissions for action execution
 */

export type UserRole = "owner" | "admin" | "user" | "guest";

export type ActionPermission =
  | "create_lead"
  | "create_task"
  | "book_meeting"
  | "create_invoice"
  | "search_gmail"
  | "request_flytter_photos"
  | "job_completion"
  | "send_email"
  | "delete_email"
  | "archive_email"
  | "snooze_email"
  | "mark_email_done";

/**
 * Role hierarchy (higher roles inherit permissions from lower roles)
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  user: 1,
  admin: 2,
  owner: 3,
};

/**
 * Define which roles can execute which actions
 * Lower-risk actions are available to all users
 * Higher-risk actions require elevated permissions
 */
const ACTION_PERMISSIONS: Record<ActionPermission, UserRole> = {
  // Low-risk actions - all users
  create_task: "user",
  snooze_email: "user",
  mark_email_done: "user",
  archive_email: "user",
  search_gmail: "user",

  // Medium-risk actions - regular users
  create_lead: "user",
  send_email: "user",
  request_flytter_photos: "user",
  job_completion: "user",

  // Higher-risk actions - admin only
  book_meeting: "admin",
  delete_email: "admin",

  // Critical actions - owner only
  create_invoice: "owner",
};

/**
 * Determine user role based on user ID and OWNER_OPEN_ID
 */
export function getUserRole(userId: number, ownerOpenId?: string): UserRole {
  // For now, we'll use a simple check
  // In production, this should query the database for user roles

  // If user ID matches owner (typically user 1 or based on OWNER_OPEN_ID), they're owner
  if (userId === 1) {
    return "owner";
  }

  // Default to user role
  // TODO: Query database for actual role assignment
  return "user";
}

/**
 * Check if a user has permission to execute an action
 */
export function hasPermission(userRole: UserRole, actionType: string): boolean {
  const requiredRole = ACTION_PERMISSIONS[actionType as ActionPermission];

  // If action not in permission list, deny by default
  if (!requiredRole) {
    console.warn(`[RBAC] Unknown action type: ${actionType}`);
    return false;
  }

  // Check if user's role is high enough
  const userLevel = ROLE_HIERARCHY[userRole];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  return userLevel >= requiredLevel;
}

/**
 * Get list of actions a user can perform
 */
export function getAllowedActions(userRole: UserRole): ActionPermission[] {
  const userLevel = ROLE_HIERARCHY[userRole];

  return Object.entries(ACTION_PERMISSIONS)
    .filter(([_, requiredRole]) => {
      const requiredLevel = ROLE_HIERARCHY[requiredRole];
      return userLevel >= requiredLevel;
    })
    .map(([action]) => action as ActionPermission);
}

/**
 * Get human-readable role name
 */
export function getRoleName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    owner: "Owner",
    admin: "Administrator",
    user: "User",
    guest: "Guest",
  };
  return names[role];
}

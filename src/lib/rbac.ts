
import { UserProfile } from './types';

export const ROLE_LEVEL = {
  free: 0,
  pro1: 1,
  pro2: 2,
  pro3: 3,
  vip: 4,
  admin: 99,
} as const;

/**
 * Checks if a user's role meets a minimum required role level.
 * @param userRole The role of the current user.
 * @param minRole The minimum role required for access.
 * @returns True if the user has access, false otherwise.
 */
export function hasAccess(userRole: UserProfile['role'], minRole: keyof typeof ROLE_LEVEL): boolean {
  const userLevel = ROLE_LEVEL[userRole] ?? ROLE_LEVEL['free'];
  return userLevel >= ROLE_LEVEL[minRole];
}

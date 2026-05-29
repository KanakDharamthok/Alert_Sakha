import type { UserRole } from '@/store/authStore';

/** Roles that can take responder/administrative actions on incidents. */
export const STAFF_ROLES: UserRole[] = ['staff', 'security', 'manager', 'admin'];

export function isStaffRole(role: UserRole | undefined | null): boolean {
  return !!role && STAFF_ROLES.includes(role);
}
// Centralized role & permission checks (replace hardcoded username checks with this)
// Safe by default: unknown roles/users => no permissions granted.

import { z } from 'zod';

export const RoleSchema = z.enum(['buyer', 'seller', 'admin']);
export type Role = z.infer<typeof RoleSchema>;

// Add or refine permissions here. Keep names descriptive and atomic.
export type PermissionAction =
  | 'viewAdminWallet'
  | 'viewReports'
  | 'resolveReport'
  | 'deleteReport'
  | 'customBan'
  | 'removeListings';

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<PermissionAction>> = {
  buyer: new Set<PermissionAction>([]),
  seller: new Set<PermissionAction>([]),
  admin: new Set<PermissionAction>([
    'viewAdminWallet',
    'viewReports',
    'resolveReport',
    'deleteReport',
    'customBan',
    'removeListings',
  ]),
};

type MaybeUser = { role?: unknown } | null | undefined;

export function getSafeRole(user: MaybeUser): Role | null {
  const parsed = RoleSchema.safeParse(user?.role);
  return parsed.success ? parsed.data : null;
}

export function isAdmin(user: MaybeUser): boolean {
  return getSafeRole(user) === 'admin';
}

export function can(user: MaybeUser, action: PermissionAction): boolean {
  const role = getSafeRole(user);
  if (!role) return false;
  return ROLE_PERMISSIONS[role].has(action);
}

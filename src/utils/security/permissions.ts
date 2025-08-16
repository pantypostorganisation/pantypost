// Centralized role/permission helpers for the frontend

export type Role = 'buyer' | 'seller' | 'admin';

export interface MinimalUser {
  username?: string | null;
  role?: Role | null;
}

export function isAdmin(user: MinimalUser | null | undefined): boolean {
  return (user?.role ?? null) === 'admin';
}

/**
 * True if the user's exact role matches.
 */
export function hasRole(user: MinimalUser | null | undefined, role: Role): boolean {
  return (user?.role ?? null) === role;
}

/**
 * True if the user can access a page requiring `requiredRole`.
 * Admins can access anything.
 */
export function canAccessRole(user: MinimalUser | null | undefined, requiredRole: Role): boolean {
  const r = user?.role ?? null;
  return r === requiredRole || r === 'admin';
}

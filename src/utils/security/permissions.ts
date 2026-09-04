// src/utils/security/permissions.ts

// Centralized role/permission helpers for the frontend

export type Role = 'buyer' | 'seller' | 'admin' | 'moderator';

export interface MinimalUser {
  username?: string | null;
  role?: Role | null;
}

export function isAdmin(user: MinimalUser | null | undefined): boolean {
  return (user?.role ?? null) === 'admin';
}

/**
 * True for anyone who may work the content approval queue.
 *
 * Deliberately separate from isAdmin: a moderator reviews listings and
 * nothing else, so this must never be used to gate wallets, bans,
 * withdrawals or analytics. Those stay on isAdmin, and the server
 * enforces the same split independently.
 */
export function canModerateContent(user: MinimalUser | null | undefined): boolean {
  const role = user?.role ?? null;
  return role === 'admin' || role === 'moderator';
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


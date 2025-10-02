// src/utils/authErrors.ts

export const AUTH_ERROR_FALLBACK = 'Invalid username or password. Please try again.';

export const normalizeAuthError = (message?: string | null): string | null => {
  if (!message) {
    return null;
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return null;
  }

  const lower = trimmed.toLowerCase();

  if (lower.includes('password') && (lower.includes("doesn't match") || lower.includes('incorrect'))) {
    return 'Incorrect password. Please try again.';
  }

  if (
    lower.includes("couldn't find") ||
    lower.includes('could not find') ||
    lower.includes('no account') ||
    lower.includes('account with the username')
  ) {
    return "We couldn't find an account with that username.";
  }

  return trimmed;
};

// src/types/api.ts

/**
 * API Response Types
 * Consistent structure for all API responses
 */

import { ValueOf } from './type-utils';

// Generic API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

// API Error structure
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  traceId?: string;
}

// API Metadata
export interface ApiMeta {
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// API Request options
export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache';
}

// File upload types
export interface FileUploadResponse {
  url: string;
  publicId: string;
  size: number;
  format: string;
  width?: number;
  height?: number;
}

// Batch operation result
export interface ApiBatchOperationResult<T = unknown> {
  succeeded: T[];
  failed: Array<{
    item: T;
    error: ApiError;
  }>;
  total: number;
  successCount: number;
  failureCount: number;
}

// WebSocket message types
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  id: string;
}

// API Status codes as const
export const API_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type ApiStatusCode = ValueOf<typeof API_STATUS>;

// Error codes enum
export enum ApiErrorCode {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  
  // Business logic errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  LISTING_LIMIT_EXCEEDED = 'LISTING_LIMIT_EXCEEDED',
  ACTION_NOT_ALLOWED = 'ACTION_NOT_ALLOWED',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

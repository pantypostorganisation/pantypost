// src/services/mock/mock-api.ts

import { ApiResponse } from '@/types/api';
import { 
  getMockConfig, 
  simulateNetworkDelay, 
  shouldFail, 
  generateMockError,
  requestTracker,
  logMockRequest,
} from './mock.config';
import { mockAuthHandlers } from './handlers/auth.mock';
import { mockUserHandlers } from './handlers/users.mock';
import { mockListingHandlers } from './handlers/listings.mock';
import { mockOrderHandlers } from './handlers/orders.mock';
import { mockMessageHandlers } from './handlers/messages.mock';
import { mockWalletHandlers } from './handlers/wallet.mock';
import { mockCloudinaryHandlers } from './handlers/cloudinary.mock';
import { seedMockData } from './mock-data-seeder';

// Mock handler type
export type MockHandler = (
  method: string,
  endpoint: string,
  data?: any,
  params?: Record<string, string>
) => Promise<ApiResponse<any>>;

// Route matcher type
interface RouteMatcher {
  pattern: RegExp;
  handler: MockHandler;
  paramNames?: string[];
}

// Compile all mock handlers
const mockHandlers: RouteMatcher[] = [
  // Auth routes
  { pattern: /^\/auth\/login$/, handler: mockAuthHandlers.login },
  { pattern: /^\/auth\/signup$/, handler: mockAuthHandlers.signup },
  { pattern: /^\/auth\/logout$/, handler: mockAuthHandlers.logout },
  { pattern: /^\/auth\/refresh$/, handler: mockAuthHandlers.refresh },
  { pattern: /^\/auth\/me$/, handler: mockAuthHandlers.me },
  { pattern: /^\/auth\/verify-username$/, handler: mockAuthHandlers.verifyUsername },
  
  // User routes
  { pattern: /^\/users$/, handler: mockUserHandlers.list },
  { 
    pattern: /^\/users\/([^\/]+)\/profile$/,
    handler: mockUserHandlers.getProfile,
    paramNames: ['username'],
  },
  {
    pattern: /^\/users\/([^\/]+)\/profile\/full$/,
    handler: mockUserHandlers.getFullProfile,
    paramNames: ['username'],
  },
  {
    pattern: /^\/users\/([^\/]+)\/verification$/,
    handler: mockUserHandlers.verification,
    paramNames: ['username'],
  },
  {
    pattern: /^\/users\/([^\/]+)\/ban$/,
    handler: mockUserHandlers.ban,
    paramNames: ['username'],
  },
  {
    pattern: /^\/users\/([^\/]+)\/unban$/,
    handler: mockUserHandlers.unban,
    paramNames: ['username'],
  },
  
  // Listing routes
  { pattern: /^\/listings$/, handler: mockListingHandlers.list },
  {
    pattern: /^\/listings\/([^\/]+)$/,
    handler: mockListingHandlers.get,
    paramNames: ['id'],
  },
  {
    pattern: /^\/listings\/seller\/([^\/]+)$/,
    handler: mockListingHandlers.getBySeller,
    paramNames: ['seller'],
  },
  {
    pattern: /^\/listings\/([^\/]+)\/bid$/,
    handler: mockListingHandlers.placeBid,
    paramNames: ['id'],
  },
  { pattern: /^\/listings\/popular-tags$/, handler: mockListingHandlers.popularTags },
  
  // Order routes
  { pattern: /^\/orders$/, handler: mockOrderHandlers.list },
  {
    pattern: /^\/orders\/([^\/]+)$/,
    handler: mockOrderHandlers.get,
    paramNames: ['id'],
  },
  {
    pattern: /^\/orders\/([^\/]+)\/status$/,
    handler: mockOrderHandlers.updateStatus,
    paramNames: ['id'],
  },
  
  // Message routes
  { pattern: /^\/messages\/threads$/, handler: mockMessageHandlers.threads },
  {
    pattern: /^\/messages\/threads\/([^\/]+)$/,
    handler: mockMessageHandlers.thread,
    paramNames: ['threadId'],
  },
  { pattern: /^\/messages\/send$/, handler: mockMessageHandlers.send },
  { pattern: /^\/messages\/mark-read$/, handler: mockMessageHandlers.markRead },
  { pattern: /^\/messages\/block$/, handler: mockMessageHandlers.block },
  { pattern: /^\/messages\/unblock$/, handler: mockMessageHandlers.unblock },
  { pattern: /^\/messages\/report$/, handler: mockMessageHandlers.report },
  
  // Wallet routes
  {
    pattern: /^\/wallet\/balance\/([^\/]+)$/,
    handler: mockWalletHandlers.balance,
    paramNames: ['username'],
  },
  { pattern: /^\/wallet\/deposit$/, handler: mockWalletHandlers.deposit },
  { pattern: /^\/wallet\/withdraw$/, handler: mockWalletHandlers.withdraw },
  {
    pattern: /^\/wallet\/transactions\/([^\/]+)$/,
    handler: mockWalletHandlers.transactions,
    paramNames: ['username'],
  },
  { pattern: /^\/wallet\/admin-actions$/, handler: mockWalletHandlers.adminActions },
  
  // Subscription routes
  {
    pattern: /^\/subscriptions\/([^\/]+)$/,
    handler: mockUserHandlers.subscriptions,
    paramNames: ['username'],
  },
  { pattern: /^\/subscriptions\/subscribe$/, handler: mockUserHandlers.subscribe },
  { pattern: /^\/subscriptions\/unsubscribe$/, handler: mockUserHandlers.unsubscribe },
  { pattern: /^\/subscriptions\/check$/, handler: mockUserHandlers.checkSubscription },
  
  // Cloudinary routes
  { pattern: /^\/api\/cloudinary\/delete$/, handler: mockCloudinaryHandlers.deleteImage },
  { pattern: /^\/api\/cloudinary\/batch-delete$/, handler: mockCloudinaryHandlers.batchDelete },
  {
    pattern: /^\/api\/cloudinary\/check-deleted\/([^\/]+)$/,
    handler: mockCloudinaryHandlers.checkDeleted,
    paramNames: ['publicId'],
  },
  { pattern: /^\/api\/cloudinary\/clear-history$/, handler: mockCloudinaryHandlers.clearHistory },
];

// Extract route parameters
function extractParams(
  pattern: RegExp,
  pathname: string,
  paramNames?: string[]
): Record<string, string> {
  if (!paramNames) return {};
  
  const match = pathname.match(pattern);
  if (!match) return {};
  
  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });
  
  return params;
}

// Find matching handler
function findHandler(method: string, pathname: string): {
  handler: MockHandler;
  params: Record<string, string>;
} | null {
  for (const route of mockHandlers) {
    if (route.pattern.test(pathname)) {
      const params = extractParams(route.pattern, pathname, route.paramNames);
      return { handler: route.handler, params };
    }
  }
  
  return null;
}

// Main mock API handler
export async function mockApiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const config = getMockConfig();
  
  // Track request
  requestTracker.track(endpoint);
  
  // Parse URL
  const url = new URL(endpoint, window.location.origin);
  const pathname = url.pathname;
  const method = options.method || 'GET';
  const data = options.body ? JSON.parse(options.body as string) : undefined;
  
  // Parse query parameters
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });
  
  try {
    // Simulate network delay
    await simulateNetworkDelay(config.scenario);
    
    // Check if request should fail
    const requestType = pathname.includes('payment') || pathname.includes('deposit') || pathname.includes('withdraw')
      ? 'payment'
      : undefined;
      
    if (shouldFail(config.scenario, requestType)) {
      const mockError = generateMockError(config.scenario, requestType);
      
      const errorResponse = {
        success: false,
        error: mockError.error,
      };
      
      logMockRequest(method, pathname, data, errorResponse);
      
      // Simulate HTTP error
      throw {
        response: {
          status: mockError.status,
          data: errorResponse,
        },
      };
    }
    
    // Find handler
    const match = findHandler(method, pathname);
    if (!match) {
      const notFoundResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Mock handler not found for ${method} ${pathname}`,
        },
      };
      
      logMockRequest(method, pathname, data, notFoundResponse);
      return notFoundResponse as ApiResponse<T>;
    }
    
    // Execute handler
    const response = await match.handler(method, pathname, data, { ...queryParams, ...match.params });
    
    logMockRequest(method, pathname, data, response);
    
    return response as ApiResponse<T>;
  } catch (error) {
    // Re-throw HTTP errors
    if (error && typeof error === 'object' && 'response' in error) {
      throw error;
    }
    
    // Handle other errors
    const errorResponse = {
      success: false,
      error: {
        code: 'MOCK_ERROR',
        message: error instanceof Error ? error.message : 'Mock API error',
      },
    };
    
    logMockRequest(method, pathname, data, errorResponse);
    return errorResponse as ApiResponse<T>;
  }
}

// Initialize mock API
let initialized = false;

export async function initializeMockApi(): Promise<void> {
  if (initialized) return;
  
  const config = getMockConfig();
  if (!config.enabled) return;
  
  console.log(`🎭 Mock API initialized with scenario: ${config.scenario.name}`);
  
  // Seed initial data if configured
  if (config.seedData) {
    await seedMockData();
  }
  
  initialized = true;
}

// Reset mock API state
export async function resetMockApi(): Promise<void> {
  const { mockDataStore } = await import('./mock.config');
  await mockDataStore.clear();
  initialized = false;
  await initializeMockApi();
}

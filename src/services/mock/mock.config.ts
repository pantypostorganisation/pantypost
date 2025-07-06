// src/services/mock/mock.config.ts

/**
 * Mock API Configuration
 * Central configuration for all mock API responses
 */

export interface MockScenario {
  name: string;
  description: string;
  errorRate: number; // 0-1 probability of errors
  networkDelay: {
    min: number; // milliseconds
    max: number;
  };
  conditions?: Record<string, any>;
}

export interface MockConfig {
  enabled: boolean;
  scenario: MockScenario;
  logRequests: boolean;
  persistState: boolean;
  seedData: boolean;
}

// Available scenarios for testing
export const MOCK_SCENARIOS: Record<string, MockScenario> = {
  // Happy path - everything works perfectly
  HAPPY_PATH: {
    name: 'Happy Path',
    description: 'All requests succeed with minimal delay',
    errorRate: 0,
    networkDelay: { min: 100, max: 300 },
  },
  
  // Realistic scenario - occasional errors and variable delays
  REALISTIC: {
    name: 'Realistic',
    description: 'Simulates real-world conditions',
    errorRate: 0.05, // 5% error rate
    networkDelay: { min: 200, max: 1000 },
  },
  
  // Slow network
  SLOW_NETWORK: {
    name: 'Slow Network',
    description: 'Simulates slow 3G connection',
    errorRate: 0.1,
    networkDelay: { min: 2000, max: 5000 },
  },
  
  // High error rate
  ERROR_PRONE: {
    name: 'Error Prone',
    description: 'High error rate for testing error handling',
    errorRate: 0.3,
    networkDelay: { min: 100, max: 500 },
  },
  
  // Offline mode
  OFFLINE: {
    name: 'Offline',
    description: 'All network requests fail',
    errorRate: 1,
    networkDelay: { min: 0, max: 0 },
  },
  
  // Payment failures
  PAYMENT_FAILURES: {
    name: 'Payment Failures',
    description: 'Payment operations fail frequently',
    errorRate: 0,
    networkDelay: { min: 500, max: 1500 },
    conditions: {
      paymentErrorRate: 0.5,
    },
  },
  
  // Rate limiting
  RATE_LIMITED: {
    name: 'Rate Limited',
    description: 'Simulates API rate limiting',
    errorRate: 0,
    networkDelay: { min: 100, max: 300 },
    conditions: {
      requestsPerMinute: 10,
      rateLimitErrorAfter: 10,
    },
  },
};

// Get current mock configuration
export function getMockConfig(): MockConfig {
  // Check localStorage first (for dynamic changes)
  const localEnabled = typeof window !== 'undefined' ? localStorage.getItem('MOCK_API_ENABLED') : null;
  const localScenario = typeof window !== 'undefined' ? localStorage.getItem('MOCK_API_SCENARIO') : null;
  
  // Use localStorage values if available, otherwise fall back to env vars
  const enabled = localEnabled ? localEnabled === 'true' : process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
  const scenarioName = localScenario || process.env.NEXT_PUBLIC_MOCK_SCENARIO || 'REALISTIC';
  const logRequests = process.env.NEXT_PUBLIC_MOCK_LOG_REQUESTS === 'true';
  const persistState = process.env.NEXT_PUBLIC_MOCK_PERSIST_STATE !== 'false'; // Default true
  const seedData = process.env.NEXT_PUBLIC_MOCK_SEED_DATA !== 'false'; // Default true
  
  const scenario = MOCK_SCENARIOS[scenarioName] || MOCK_SCENARIOS.REALISTIC;
  
  return {
    enabled,
    scenario,
    logRequests,
    persistState,
    seedData,
  };
}

// Mock request tracking for rate limiting
class MockRequestTracker {
  private requests: { timestamp: number; endpoint: string }[] = [];
  
  track(endpoint: string): void {
    const now = Date.now();
    this.requests.push({ timestamp: now, endpoint });
    
    // Clean up old requests (older than 1 minute)
    this.requests = this.requests.filter(r => now - r.timestamp < 60000);
  }
  
  getRequestCount(withinMs: number = 60000): number {
    const now = Date.now();
    return this.requests.filter(r => now - r.timestamp < withinMs).length;
  }
  
  shouldRateLimit(scenario: MockScenario): boolean {
    if (!scenario.conditions?.rateLimitErrorAfter) return false;
    
    const requestCount = this.getRequestCount();
    return requestCount >= scenario.conditions.rateLimitErrorAfter;
  }
}

export const requestTracker = new MockRequestTracker();

// Utility to simulate network delay
export async function simulateNetworkDelay(scenario: MockScenario): Promise<void> {
  const { min, max } = scenario.networkDelay;
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Utility to determine if request should fail
export function shouldFail(scenario: MockScenario, requestType?: string): boolean {
  // Check specific conditions
  if (requestType === 'payment' && scenario.conditions?.paymentErrorRate) {
    return Math.random() < scenario.conditions.paymentErrorRate;
  }
  
  // Check rate limiting
  if (requestTracker.shouldRateLimit(scenario)) {
    return true;
  }
  
  // General error rate
  return Math.random() < scenario.errorRate;
}

// Generate mock error based on scenario
export function generateMockError(scenario: MockScenario, requestType?: string): {
  status: number;
  error: {
    code: string;
    message: string;
    details?: any;
  };
} {
  // Rate limit error
  if (requestTracker.shouldRateLimit(scenario)) {
    return {
      status: 429,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        details: {
          retryAfter: 60,
          limit: scenario.conditions?.rateLimitErrorAfter,
        },
      },
    };
  }
  
  // Payment specific errors
  if (requestType === 'payment') {
    const paymentErrors = [
      {
        status: 402,
        error: {
          code: 'PAYMENT_DECLINED',
          message: 'Payment method declined',
          details: { reason: 'insufficient_funds' },
        },
      },
      {
        status: 400,
        error: {
          code: 'INVALID_PAYMENT_METHOD',
          message: 'Invalid payment method',
        },
      },
    ];
    
    return paymentErrors[Math.floor(Math.random() * paymentErrors.length)];
  }
  
  // General errors
  const errors = [
    {
      status: 500,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    },
    {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
      },
    },
    {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
      },
    },
    {
      status: 401,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
      },
    },
  ];
  
  // Offline scenario
  if (scenario.name === 'Offline') {
    return {
      status: 0,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
      },
    };
  }
  
  return errors[Math.floor(Math.random() * errors.length)];
}

// Mock data persistence
export class MockDataStore {
  private prefix = 'mock_api_';
  
  async get<T>(key: string, defaultValue: T): Promise<T> {
    const config = getMockConfig();
    if (!config.persistState) return defaultValue;
    
    try {
      const stored = localStorage.getItem(this.prefix + key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    const config = getMockConfig();
    if (!config.persistState) return;
    
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to persist mock data:', error);
    }
  }
  
  async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const mockDataStore = new MockDataStore();

// Mock request logger
export function logMockRequest(method: string, endpoint: string, data?: any, response?: any): void {
  const config = getMockConfig();
  if (!config.logRequests) return;
  
  console.group(`🔧 Mock API: ${method} ${endpoint}`);
  console.log('Request:', data);
  console.log('Response:', response);
  console.log('Scenario:', config.scenario.name);
  console.groupEnd();
}

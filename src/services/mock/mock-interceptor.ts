// src/services/mock/mock-interceptor.ts

import { getMockConfig } from './mock.config';
import { mockApiCall, initializeMockApi } from './mock-api';
import { ApiResponse } from '@/types/api';

/**
 * Mock API Interceptor
 * Intercepts API calls and routes them to mock handlers when enabled
 */
export class MockApiInterceptor {
  private static instance: MockApiInterceptor;
  private initialized = false;
  private originalFetch?: typeof window.fetch;

  static getInstance(): MockApiInterceptor {
    if (!MockApiInterceptor.instance) {
      MockApiInterceptor.instance = new MockApiInterceptor();
    }
    return MockApiInterceptor.instance;
  }

  /**
   * Initialize the mock interceptor
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const config = getMockConfig();
    if (!config.enabled) {
      console.log('📡 Mock API disabled, using real API');
      return;
    }

    console.log(`🎭 Mock API enabled with scenario: ${config.scenario.name}`);
    
    // Initialize mock data
    await initializeMockApi();
    
    // Store original fetch
    this.originalFetch = window.fetch;
    
    // Override fetch
    window.fetch = this.interceptedFetch.bind(this);
    
    this.initialized = true;
  }

  /**
   * Restore original fetch
   */
  restore(): void {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.initialized = false;
    }
  }

  /**
   * Intercepted fetch function
   */
  private async interceptedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const config = getMockConfig();
    
    // If mock is disabled, use original fetch
    if (!config.enabled || !this.originalFetch) {
      return this.originalFetch!(input, init);
    }
    
    // Parse URL
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // Check if this is an API call we should mock
    if (!this.shouldMockRequest(url)) {
      return this.originalFetch!(input, init);
    }
    
    try {
      // Extract endpoint path
      const endpoint = this.extractEndpoint(url);
      
      // Call mock API
      const response = await mockApiCall<any>(endpoint, init);
      
      // Convert to Response object
      return this.createMockResponse(response);
    } catch (error) {
      // If mock fails, optionally fall back to real API
      console.error('Mock API error:', error);
      
      // Re-throw to simulate network error
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = (error as any).response;
        return this.createMockResponse(errorResponse.data, errorResponse.status);
      }
      
      throw error;
    }
  }

  /**
   * Check if request should be mocked
   */
  private shouldMockRequest(url: string): boolean {
    // Check if URL is an API endpoint
    const apiPatterns = [
      /\/api\//,
      /\/auth\//,
      /\/users\//,
      /\/listings\//,
      /\/orders\//,
      /\/messages\//,
      /\/wallet\//,
      /\/subscriptions\//,
    ];
    
    return apiPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Extract endpoint from URL
   */
  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      // If not a full URL, assume it's already a path
      return url;
    }
  }

  /**
   * Create mock Response object
   */
  private createMockResponse(data: any, status: number = 200): Response {
    const responseBody = JSON.stringify(data);
    
    return new Response(responseBody, {
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Response': 'true',
      },
    });
  }
}

/**
 * Initialize mock interceptor on module load if enabled
 */
if (typeof window !== 'undefined') {
  const config = getMockConfig();
  if (config.enabled) {
    MockApiInterceptor.getInstance().initialize();
  }
}

// Export convenience functions
export const mockInterceptor = MockApiInterceptor.getInstance();

export async function enableMockApi(): Promise<void> {
  await mockInterceptor.initialize();
}

export function disableMockApi(): void {
  mockInterceptor.restore();
}

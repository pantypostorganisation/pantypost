// src/services/mock/index.ts

// Main exports for Mock API system
export * from './mock.config';
export * from './mock-api';
export * from './mock-interceptor';
export * from './mock-data-seeder';

// Re-export key functions for convenience
export { 
  getMockConfig,
  MOCK_SCENARIOS,
  mockDataStore 
} from './mock.config';

export { 
  mockApiCall,
  initializeMockApi,
  resetMockApi 
} from './mock-api';

export { 
  enableMockApi,
  disableMockApi,
  mockInterceptor 
} from './mock-interceptor';

export { 
  seedMockData,
  clearMockData 
} from './mock-data-seeder';
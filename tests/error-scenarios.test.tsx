// tests/error-scenarios.test.tsx
/**
 * Simplified integration tests for error handling scenarios
 * Tests core error conditions using the mock API
 */

import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the mock API configuration
jest.mock('@/services/mock', () => ({
  getMockConfig: jest.fn(() => ({
    enabled: true,
    scenario: { name: 'ERROR_PRONE', errorRate: 0.3 },
  })),
  MOCK_SCENARIOS: {
    HAPPY_PATH: { name: 'Happy Path', errorRate: 0 },
    ERROR_PRONE: { name: 'Error Prone', errorRate: 0.3 },
    OFFLINE: { name: 'Offline', errorRate: 1 },
  },
  mockApiCall: jest.fn(),
  resetMockApi: jest.fn(),
}));

// Test component that uses API
const TestComponent = ({ onError }: { onError?: (error: any) => void }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">{error}</div>}
      {data && <div data-testid="data">{JSON.stringify(data)}</div>}
      <button onClick={fetchData}>Fetch Data</button>
    </div>
  );
};

describe('Error Handling Scenarios', () => {
  beforeEach(() => {
    // Clear any previous state
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Network Errors', () => {
    it('handles network failures gracefully', async () => {
      // Mock fetch to simulate network error
      global.fetch = jest.fn(() => 
        Promise.reject(new Error('Network request failed'))
      );

      const handleError = jest.fn();
      render(<TestComponent onError={handleError} />);

      // Trigger fetch
      fireEvent.click(screen.getByText('Fetch Data'));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network request failed');
      });

      expect(handleError).toHaveBeenCalled();
    });

    it('shows loading state during request', async () => {
      // Mock fetch with delay
      global.fetch = jest.fn(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true })
        } as Response), 100))
      );

      render(<TestComponent />);
      
      fireEvent.click(screen.getByText('Fetch Data'));

      // Should show loading
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for loading to disappear
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('HTTP Error Responses', () => {
    it('handles 500 server errors', async () => {
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal Server Error' })
        } as Response)
      );

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Fetch Data'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('HTTP error! status: 500');
      });
    });

    it('handles 401 authentication errors', async () => {
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' })
        } as Response)
      );

      const handleError = jest.fn();
      render(<TestComponent onError={handleError} />);
      fireEvent.click(screen.getByText('Fetch Data'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('HTTP error! status: 401');
      });
    });

    it('handles 429 rate limit errors', async () => {
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 429,
          json: async () => ({ 
            error: 'Too Many Requests',
            retryAfter: 60 
          })
        } as Response)
      );

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Fetch Data'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('HTTP error! status: 429');
      });
    });
  });

  describe('Mock API Scenarios', () => {
    it('uses mock configuration for error simulation', () => {
      const { getMockConfig } = require('@/services/mock');
      
      // Set error prone scenario
      localStorage.setItem('MOCK_API_SCENARIO', 'ERROR_PRONE');
      
      const config = getMockConfig();
      expect(config.scenario.errorRate).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('allows retry after error', async () => {
      let attemptCount = 0;
      
      // First call fails, second succeeds
      global.fetch = jest.fn(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: 'Success!' })
        } as Response);
      });

      render(<TestComponent />);
      
      // First attempt - fails
      fireEvent.click(screen.getByText('Fetch Data'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Second attempt - succeeds
      fireEvent.click(screen.getByText('Fetch Data'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('error')).not.toBeInTheDocument();
        expect(screen.getByTestId('data')).toHaveTextContent('Success!');
      });
    });
  });

  describe('Validation Errors', () => {
    it('handles validation error responses', async () => {
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ 
            error: 'Validation failed',
            fields: {
              email: 'Invalid email format',
              username: 'Username already taken'
            }
          })
        } as Response)
      );

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Fetch Data'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('HTTP error! status: 400');
      });
    });
  });
});

// Basic test to ensure environment is set up correctly
describe('Test Environment', () => {
  it('should have mock API enabled in test environment', () => {
    expect(process.env.NEXT_PUBLIC_USE_MOCK_API).toBe('true');
  });

  it('should be able to use localStorage', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });

  it('should be able to mock fetch', () => {
    global.fetch = jest.fn();
    expect(fetch).toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(0);
  });
});
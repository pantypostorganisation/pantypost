// src/components/MockApiProvider.tsx

'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { getMockConfig, MOCK_SCENARIOS } from '@/services/mock/mock.config';
import { initializeMockApi, resetMockApi } from '@/services/mock/mock-api';
import { enableMockApi, disableMockApi } from '@/services/mock/mock-interceptor';
import { clearMockData } from '@/services/mock/mock-data-seeder';

interface MockApiContextValue {
  enabled: boolean;
  scenario: string;
  isInitialized: boolean;
  toggleMockApi: () => void;
  changeScenario: (scenarioName: string) => void;
  resetData: () => Promise<void>;
  clearData: () => Promise<void>;
}

const MockApiContext = createContext<MockApiContextValue | null>(null);

export function useMockApi() {
  const context = useContext(MockApiContext);
  if (!context) {
    throw new Error('useMockApi must be used within MockApiProvider');
  }
  return context;
}

interface MockApiProviderProps {
  children: React.ReactNode;
}

export function MockApiProvider({ children }: MockApiProviderProps) {
  const [enabled, setEnabled] = useState(false);
  const [scenario, setScenario] = useState('REALISTIC');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const config = getMockConfig();
    setEnabled(config.enabled);
    setScenario(config.scenario.name);
    
    if (config.enabled) {
      initializeMockApi().then(() => {
        setIsInitialized(true);
      });
    }
  }, []);

  const toggleMockApi = async () => {
    const newEnabled = !enabled;
    
    if (newEnabled) {
      await enableMockApi();
      await initializeMockApi();
      setIsInitialized(true);
    } else {
      disableMockApi();
      setIsInitialized(false);
    }
    
    setEnabled(newEnabled);
    
    // Save preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('MOCK_API_ENABLED', newEnabled.toString());
    }
  };

  const changeScenario = (scenarioName: string) => {
    if (MOCK_SCENARIOS[scenarioName]) {
      setScenario(scenarioName);
      
      // Save preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('MOCK_API_SCENARIO', scenarioName);
      }
      
      // Reload to apply new scenario
      window.location.reload();
    }
  };

  const resetData = async () => {
    await resetMockApi();
    window.location.reload();
  };

  const clearData = async () => {
    await clearMockData();
    window.location.reload();
  };

  const value: MockApiContextValue = {
    enabled,
    scenario,
    isInitialized,
    toggleMockApi,
    changeScenario,
    resetData,
    clearData,
  };

  return (
    <MockApiContext.Provider value={value}>
      {children}
      {process.env.NODE_ENV === 'development' && <MockApiDevTools />}
    </MockApiContext.Provider>
  );
}

// Development tools UI
function MockApiDevTools() {
  const { enabled, scenario, toggleMockApi, changeScenario, resetData, clearData } = useMockApi();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Mock API Dev Tools"
      >
        🎭
      </button>

      {/* Dev tools panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 bg-white dark:bg-gray-800 shadow-2xl rounded-lg p-6 w-80 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <span className="mr-2">🎭</span>
            Mock API Dev Tools
          </h3>

          {/* Status */}
          <div className="mb-4">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Mock API</span>
              <button
                onClick={toggleMockApi}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enabled ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              {enabled ? 'Using mock data' : 'Using real API'}
            </p>
          </div>

          {/* Scenario selector */}
          {enabled && (
            <>
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Scenario</label>
                <select
                  value={scenario}
                  onChange={(e) => changeScenario(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                >
                  {Object.entries(MOCK_SCENARIOS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {MOCK_SCENARIOS[scenario]?.description}
                </p>
              </div>

              {/* Scenario details */}
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <p className="mb-1">
                  <strong>Error Rate:</strong> {(MOCK_SCENARIOS[scenario]?.errorRate * 100).toFixed(0)}%
                </p>
                <p>
                  <strong>Network Delay:</strong> {MOCK_SCENARIOS[scenario]?.networkDelay.min}-
                  {MOCK_SCENARIOS[scenario]?.networkDelay.max}ms
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={resetData}
                  className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                >
                  Reset Mock Data
                </button>
                <button
                  onClick={clearData}
                  className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                >
                  Clear All Data
                </button>
              </div>

              {/* Info */}
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                <p className="text-yellow-800 dark:text-yellow-200">
                  💡 Mock data persists in localStorage. Use "Clear All Data" to start fresh.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

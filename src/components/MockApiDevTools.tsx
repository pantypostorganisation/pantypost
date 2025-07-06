// src/components/MockApiDevTools.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { getMockConfig, MOCK_SCENARIOS } from '@/services/mock/mock.config';
import { enableMockApi, disableMockApi } from '@/services/mock/mock-interceptor';
import { resetMockApi } from '@/services/mock/mock-api';
import { clearMockData } from '@/services/mock/mock-data-seeder';

export function MockApiDevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [scenario, setScenario] = useState('REALISTIC');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const config = getMockConfig();
    setEnabled(config.enabled);
    setScenario(config.scenario.name);
    
    // Update localStorage to match
    if (config.enabled) {
      localStorage.setItem('MOCK_API_ENABLED', 'true');
      localStorage.setItem('MOCK_API_SCENARIO', Object.keys(MOCK_SCENARIOS).find(
        key => MOCK_SCENARIOS[key].name === config.scenario.name
      ) || 'REALISTIC');
    }
  }, []);

  const toggleMockApi = async () => {
    setIsLoading(true);
    try {
      if (!enabled) {
        await enableMockApi();
        localStorage.setItem('MOCK_API_ENABLED', 'true');
        setEnabled(true);
      } else {
        disableMockApi();
        localStorage.setItem('MOCK_API_ENABLED', 'false');
        setEnabled(false);
      }
    } catch (error) {
      console.error('Failed to toggle mock API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeScenario = (newScenario: string) => {
    if (MOCK_SCENARIOS[newScenario]) {
      localStorage.setItem('MOCK_API_SCENARIO', newScenario);
      setScenario(newScenario);
      // Reload to apply new scenario
      window.location.reload();
    }
  };

  const handleResetData = async () => {
    if (confirm('This will reset all mock data to initial state. Continue?')) {
      setIsLoading(true);
      try {
        await resetMockApi();
        window.location.reload();
      } catch (error) {
        console.error('Failed to reset data:', error);
        setIsLoading(false);
      }
    }
  };

  const handleClearData = async () => {
    if (confirm('This will clear ALL mock data. You will need to log in again. Continue?')) {
      setIsLoading(true);
      try {
        await clearMockData();
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
        setIsLoading(false);
      }
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all duration-200 transform hover:scale-110"
        title="Mock API Dev Tools"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Dev tools panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 bg-white dark:bg-gray-800 shadow-2xl rounded-lg p-6 w-96 max-h-[600px] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center">
              <span className="mr-2">🎭</span>
              Mock API Dev Tools
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Mock API</span>
              <button
                onClick={toggleMockApi}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enabled ? 'bg-purple-600' : 'bg-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              {enabled ? '✅ Using mock data' : '🌐 Using real API'}
            </p>
          </div>

          {/* Scenario selector */}
          {enabled && (
            <>
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Test Scenario</label>
                <select
                  value={scenario}
                  onChange={(e) => changeScenario(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Object.entries(MOCK_SCENARIOS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {MOCK_SCENARIOS[scenario]?.description || 'No description'}
                </p>
              </div>

              {/* Scenario details */}
              <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <p className="mb-1">
                  <strong>Error Rate:</strong> {((MOCK_SCENARIOS[scenario]?.errorRate || 0) * 100).toFixed(0)}%
                </p>
                <p>
                  <strong>Network Delay:</strong> {MOCK_SCENARIOS[scenario]?.networkDelay?.min || 0}-
                  {MOCK_SCENARIOS[scenario]?.networkDelay?.max || 0}ms
                </p>
              </div>

              {/* Test users */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">Test Users</h4>
                <div className="space-y-1 text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <strong className="text-purple-600">Admins:</strong>
                      <p>oakley, gerome</p>
                    </div>
                    <div>
                      <strong className="text-pink-600">Sellers:</strong>
                      <p>alice, betty, carol, diana</p>
                    </div>
                    <div className="col-span-2">
                      <strong className="text-blue-600">Buyers:</strong>
                      <p>buyer1, buyer2, buyer3, john, mike</p>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Login with any username - no password required in mock mode
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleResetData}
                  disabled={isLoading}
                  className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔄 Reset Mock Data
                </button>
                <button
                  onClick={handleClearData}
                  disabled={isLoading}
                  className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🗑️ Clear All Data
                </button>
              </div>

              {/* Info */}
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                <p className="text-yellow-800 dark:text-yellow-200 mb-1">
                  💡 <strong>Tips:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                  <li>Mock data persists in localStorage</li>
                  <li>Use "Reset" to restore initial test data</li>
                  <li>Use "Clear" to start completely fresh</li>
                  <li>Change scenarios to test error handling</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

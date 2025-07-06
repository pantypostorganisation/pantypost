// src/components/MockApiDevTools.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Settings, X, RefreshCw, Trash2, ChevronRight } from 'lucide-react';
import { getMockConfig, MOCK_SCENARIOS } from '@/services/mock/mock.config';
import { resetMockApi, clearMockData } from '@/services/mock';

export function MockApiDevTools() {
  // Check if mock API is enabled via environment variable
  const isMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
  
  // Don't render anything if mocks are disabled
  if (!isMockEnabled) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState(getMockConfig());
  const [localEnabled, setLocalEnabled] = useState(config.enabled);
  const [scenario, setScenario] = useState(config.scenario.name);

  useEffect(() => {
    const currentConfig = getMockConfig();
    setConfig(currentConfig);
    setLocalEnabled(currentConfig.enabled);
    setScenario(currentConfig.scenario.name);
  }, []);

  const handleToggleMock = () => {
    const newEnabled = !localEnabled;
    setLocalEnabled(newEnabled);
    localStorage.setItem('MOCK_API_ENABLED', newEnabled.toString());
    window.location.reload();
  };

  const handleScenarioChange = (newScenario: string) => {
    setScenario(newScenario);
    localStorage.setItem('MOCK_API_SCENARIO', newScenario);
    window.location.reload();
  };

  const handleResetData = async () => {
    if (confirm('This will reset all mock data to initial state. Continue?')) {
      await resetMockApi();
      window.location.reload();
    }
  };

  const handleClearData = async () => {
    if (confirm('This will clear ALL mock data. Continue?')) {
      await clearMockData();
      window.location.reload();
    }
  };

  const testUsers = {
    admins: ['oakley', 'gerome'],
    sellers: ['alice', 'betty', 'carol', 'diana'],
    buyers: ['buyer1', 'buyer2', 'buyer3', 'john', 'mike'],
  };

  return (
    <>
      {/* Settings button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        aria-label="Mock API Dev Tools"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Dev Tools Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-gray-900 text-white shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold flex items-center gap-2">
              🛠️ Mock API Dev Tools
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Mock API Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Mock API</label>
                <button
                  onClick={handleToggleMock}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localEnabled ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-400">
                {localEnabled ? '✅ Using mock data' : '🌐 Using real API'}
              </p>
            </div>

            {/* Scenario Selection */}
            {localEnabled && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Scenario</label>
                  <select
                    value={scenario}
                    onChange={(e) => handleScenarioChange(e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    {Object.entries(MOCK_SCENARIOS).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400">
                    {MOCK_SCENARIOS[scenario]?.description || 'No description'}
                  </p>
                </div>

                {/* Current Scenario Info */}
                <div className="bg-gray-800 p-3 rounded-lg space-y-1">
                  <p className="text-xs">
                    <span className="text-gray-400">Error Rate:</span>{' '}
                    {(config.scenario.errorRate * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs">
                    <span className="text-gray-400">Network Delay:</span>{' '}
                    {config.scenario.networkDelay.min}-{config.scenario.networkDelay.max}ms
                  </p>
                </div>

                {/* Test Users */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Test Users</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-purple-400 font-medium mb-1">Admins</p>
                      <div className="flex flex-wrap gap-2">
                        {testUsers.admins.map((user) => (
                          <span
                            key={user}
                            className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded"
                          >
                            {user}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-pink-400 font-medium mb-1">Sellers</p>
                      <div className="flex flex-wrap gap-2">
                        {testUsers.sellers.map((user) => (
                          <span
                            key={user}
                            className="text-xs bg-pink-600/20 text-pink-300 px-2 py-1 rounded"
                          >
                            {user}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-blue-400 font-medium mb-1">Buyers</p>
                      <div className="flex flex-wrap gap-2">
                        {testUsers.buyers.map((user) => (
                          <span
                            key={user}
                            className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded"
                          >
                            {user}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Login with any username - no password required in mock mode
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {localEnabled && (
            <div className="p-4 border-t border-gray-800 space-y-2">
              <button
                onClick={handleResetData}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Mock Data
              </button>
              <button
                onClick={handleClearData}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

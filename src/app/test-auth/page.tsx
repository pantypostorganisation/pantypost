// src/app/test-auth/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AuthTestPage() {
  const { user, login, logout, isLoggedIn, error: authError, isAuthReady } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [testUsername, setTestUsername] = useState('buyer1');
  const [testPassword, setTestPassword] = useState('buyer1');
  const [testRole, setTestRole] = useState<'buyer' | 'seller'>('buyer');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://52.62.54.24:5000/api';

  // Log auth state changes
  useEffect(() => {
    console.log('=== AUTH STATE CHANGED ===');
    console.log('Is Logged In:', isLoggedIn);
    console.log('Current User:', user);
    console.log('Auth Ready:', isAuthReady);
  }, [user, isLoggedIn, isAuthReady]);

  useEffect(() => {
    // Initial state check
    addResult('=== Initial State ===');
    addResult(`API Base URL: ${API_BASE_URL}`);
    addResult(`Is Logged In: ${isLoggedIn}`);
    addResult(`Current User: ${user ? JSON.stringify(user, null, 2) : 'None'}`);
    checkStorageTokens();
  }, []);

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkStorageTokens = () => {
    addResult('=== Checking Storage ===');
    const authToken = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const sessionAuthToken = sessionStorage.getItem('authToken');
    const sessionRefreshToken = sessionStorage.getItem('refreshToken');
    
    addResult(`localStorage auth_token: ${authToken ? authToken.substring(0, 30) + '...' : 'Not found'}`);
    addResult(`localStorage refresh_token: ${refreshToken ? refreshToken.substring(0, 30) + '...' : 'Not found'}`);
    addResult(`sessionStorage authToken: ${sessionAuthToken ? sessionAuthToken.substring(0, 30) + '...' : 'Not found'}`);
    addResult(`sessionStorage refreshToken: ${sessionRefreshToken ? sessionRefreshToken.substring(0, 30) + '...' : 'Not found'}`);
  };

  const testDirectAPILogin = async () => {
    setLoading(true);
    addResult('=== Testing Direct API Login ===');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: testUsername,
          password: testPassword
        })
      });
      
      const data = await response.json();
      addResult(`API Response: ${JSON.stringify(data, null, 2)}`);
      
      if (data.success && data.data) {
        addResult('✅ Direct API login successful!');
        addResult(`Token: ${data.data.token?.substring(0, 30)}...`);
        
        // Store tokens as the app expects
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('refresh_token', data.data.refreshToken);
        sessionStorage.setItem('authToken', data.data.token);
        sessionStorage.setItem('refreshToken', data.data.refreshToken);
        
        addResult('Tokens stored in both localStorage and sessionStorage');
      } else {
        addResult(`❌ API login failed: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      addResult(`❌ Network error: ${error}`);
    }
    
    setLoading(false);
  };

  const testContextLogin = async () => {
    setLoading(true);
    addResult('=== Testing Context Login ===');
    addResult(`Attempting login with: ${testUsername} / ${testPassword} / ${testRole}`);
    
    try {
      const success = await login(testUsername, testPassword, testRole);
      
      if (success) {
        addResult('✅ Context login returned success!');
        // Note: User state will update asynchronously, check the Current State box above
        addResult('Check the "Current State" box above to see if user is now logged in');
      } else {
        addResult(`❌ Context login failed. Auth error: ${authError}`);
      }
      
      checkStorageTokens();
    } catch (error) {
      addResult(`❌ Login error: ${error}`);
    }
    
    setLoading(false);
  };

  const testGetMe = async () => {
    setLoading(true);
    addResult('=== Testing /auth/me ===');
    
    // Try multiple token sources
    const token = localStorage.getItem('auth_token') || 
                  sessionStorage.getItem('authToken') || 
                  sessionStorage.getItem('auth_token');
    
    if (!token) {
      addResult('❌ No token found in any storage');
      setLoading(false);
      return;
    }
    
    addResult(`Using token: ${token.substring(0, 30)}...`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      addResult(`Response status: ${response.status}`);
      addResult(`Response data: ${JSON.stringify(data, null, 2)}`);
      
      if (data.success) {
        addResult('✅ Get user successful!');
      } else {
        addResult(`❌ Get user failed: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      addResult(`❌ Network error: ${error}`);
    }
    
    setLoading(false);
  };

  const testContextLogout = async () => {
    setLoading(true);
    addResult('=== Testing Context Logout ===');
    
    try {
      await logout();
      addResult('✅ Logout called successfully');
      addResult('Check the "Current State" box above to see if user is now logged out');
      
      // Check storage after a short delay to ensure cleanup is complete
      setTimeout(() => {
        checkStorageTokens();
      }, 100);
    } catch (error) {
      addResult(`❌ Logout error: ${error}`);
    }
    
    setLoading(false);
  };

  const clearAllStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    addResult('🗑️ All storage cleared');
    checkStorageTokens();
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      backgroundColor: '#ffffff',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🔧 Frontend Auth Integration Test</h1>
      
      <div style={{ 
        background: isLoggedIn ? '#e8f5e9' : '#ffebee', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: `1px solid ${isLoggedIn ? '#4caf50' : '#f44336'}`
      }}>
        <h3 style={{ color: '#333', marginTop: 0 }}>Current State (Live):</h3>
        <p style={{ color: '#333' }}><strong>Auth Ready:</strong> {isAuthReady ? '✅ Yes' : '⏳ Loading...'}</p>
        <p style={{ color: '#333' }}><strong>Logged In:</strong> {isLoggedIn ? '✅ Yes' : '❌ No'}</p>
        <p style={{ color: '#333' }}><strong>User:</strong> {user ? (
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {JSON.stringify(user, null, 2)}
          </span>
        ) : 'None'}</p>
        <p style={{ color: '#333' }}><strong>Auth Error:</strong> <span style={{ color: '#d32f2f' }}>{authError || 'None'}</span></p>
      </div>

      <div style={{ 
        marginBottom: '20px',
        background: '#f5f5f5',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ color: '#333', marginTop: 0 }}>Test Credentials:</h3>
        <input
          type="text"
          placeholder="Username"
          value={testUsername}
          onChange={(e) => setTestUsername(e.target.value)}
          style={{ 
            marginRight: '10px', 
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={testPassword}
          onChange={(e) => setTestPassword(e.target.value)}
          style={{ 
            marginRight: '10px', 
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <select
          value={testRole}
          onChange={(e) => setTestRole(e.target.value as 'buyer' | 'seller')}
          style={{ 
            marginRight: '10px', 
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#333' }}>⚠️ Make sure your backend is running on port 5000!</h3>
        <button 
          onClick={testDirectAPILogin} 
          disabled={loading}
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            background: loading ? '#ccc' : '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          1. Test Direct API Login
        </button>
        
        <button 
          onClick={testContextLogin} 
          disabled={loading}
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            background: loading ? '#ccc' : '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          2. Test Context Login
        </button>
        
        <button 
          onClick={testGetMe} 
          disabled={loading}
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            background: loading ? '#ccc' : '#FF9800', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          3. Test Get Me
        </button>
        
        <button 
          onClick={testContextLogout} 
          disabled={loading}
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            background: loading ? '#ccc' : '#f44336', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          4. Test Logout
        </button>
        
        <button 
          onClick={checkStorageTokens}
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            background: '#9C27B0', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Check Storage
        </button>
        
        <button 
          onClick={clearAllStorage}
          style={{ 
            padding: '10px 20px', 
            background: '#666', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Clear All Storage
        </button>
      </div>

      <div style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '8px', 
        height: '400px', 
        overflow: 'auto',
        border: '2px solid #333'
      }}>
        <h3 style={{ color: '#333', marginTop: 0 }}>Test Results:</h3>
        <pre style={{ 
          fontFamily: 'Consolas, Monaco, "Courier New", monospace', 
          fontSize: '12px',
          color: '#333',
          lineHeight: '1.5',
          margin: 0,
          whiteSpace: 'pre-wrap'
        }}>
          {testResults.join('\n')}
        </pre>
      </div>
    </div>
  );
}
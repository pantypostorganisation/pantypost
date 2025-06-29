// src/components/admin/wallet/AdminDebugInfo.tsx
'use client';

import { useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';

export default function AdminDebugInfo() {
  const { depositLogs, orderHistory, adminActions } = useWallet();
  
  useEffect(() => {
    console.log('=== Admin Dashboard Data Load ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Deposit Logs:', {
      count: depositLogs.length,
      total: depositLogs
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + d.amount, 0),
      latest: depositLogs[depositLogs.length - 1]
    });
    console.log('Orders:', orderHistory.length);
    console.log('Admin Actions:', adminActions.length);
    
    // Also check localStorage directly
    const storageDeposits = localStorage.getItem('wallet_depositLogs');
    if (storageDeposits) {
      const parsed = JSON.parse(storageDeposits);
      console.log('localStorage deposits:', parsed.length);
      if (parsed.length !== depositLogs.length) {
        console.warn('⚠️ Mismatch between context and storage!');
        console.log('Context:', depositLogs.length, 'Storage:', parsed.length);
      }
    }
    console.log('=== End Data Load ===');
  }, [depositLogs, orderHistory, adminActions]);
  
  // Display a small debug indicator
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 text-xs text-gray-400 p-2 rounded border border-gray-700 opacity-75">
        <div>Deposits: {depositLogs.length}</div>
        <div>Total: ${depositLogs
          .filter(d => d.status === 'completed')
          .reduce((sum, d) => sum + d.amount, 0)
          .toFixed(2)}
        </div>
      </div>
    );
  }
  
  return null;
}
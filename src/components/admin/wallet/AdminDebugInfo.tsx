// src/components/admin/wallet/AdminDebugInfo.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useWallet } from '@/context/WalletContext';

export default function AdminDebugInfo() {
  const { depositLogs = [], orderHistory = [], adminActions = [] } = useWallet() || {};

  // Safer total calc
  const totalCompleted = useMemo(() => {
    try {
      const total = (depositLogs || [])
        .filter((d) => d && d.status === 'completed')
        .reduce((sum, d) => {
          const amt = Number(d?.amount);
          return sum + (Number.isFinite(amt) ? amt : 0);
        }, 0);
      return Number.isFinite(total) ? total : 0;
    } catch {
      return 0;
    }
  }, [depositLogs]);

  useEffect(() => {
    // Only log in development + on client
    if (process.env.NODE_ENV !== 'development') return;

    console.log('=== Admin Dashboard Data Load ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Deposit Logs:', {
      count: depositLogs?.length || 0,
      total: totalCompleted,
      latest: (depositLogs && depositLogs.length > 0) ? depositLogs[depositLogs.length - 1] : null,
    });
    console.log('Orders:', orderHistory?.length || 0);
    console.log('Admin Actions:', adminActions?.length || 0);

    // Guard localStorage usage
    try {
      if (typeof window !== 'undefined') {
        const storageDeposits = window.localStorage.getItem('wallet_depositLogs');
        if (storageDeposits) {
          const parsed = JSON.parse(storageDeposits);
          const storageLen = Array.isArray(parsed) ? parsed.length : 0;
          console.log('localStorage deposits:', storageLen);
          if (depositLogs?.length !== storageLen) {
            console.warn('⚠️ Mismatch between context and storage!');
            console.log('Context:', depositLogs?.length || 0, 'Storage:', storageLen);
          }
        }
      }
    } catch (error) {
      console.error('Error reading localStorage:', error);
    }
    console.log('=== End Data Load ===');
  }, [depositLogs, orderHistory, adminActions, totalCompleted]);

  if (process.env.NODE_ENV === 'development') {
    return (
      <div
        className="fixed bottom-4 right-4 bg-gray-900 text-xs text-gray-400 p-2 rounded border border-gray-700 opacity-75"
        role="status"
        aria-live="polite"
      >
        <div>Deposits: {depositLogs?.length || 0}</div>
        <div>Total: ${totalCompleted.toFixed(2)}</div>
      </div>
    );
  }

  return null;
}

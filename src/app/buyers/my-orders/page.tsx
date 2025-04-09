'use client';

import RequireAuth from '@/components/RequireAuth';

export default function MyOrdersPage() {
  return (
    <RequireAuth role="buyer">
      <main className="p-10">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <p className="text-gray-600">This page is under construction. Buyer-only access.</p>
      </main>
    </RequireAuth>
  );
}

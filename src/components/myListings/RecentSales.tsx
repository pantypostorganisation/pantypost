// src/components/myListings/RecentSales.tsx
'use client';

import { RecentSalesProps } from '@/types/myListings';
import { sanitizeStrict } from '@/utils/security/sanitization';

export default function RecentSales({ orders }: RecentSalesProps) {
  return (
    <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-white">Recent Sales</h2>
      <div className="space-y-5">
        {orders.length === 0 ? (
          <div className="text-center py-8 bg-black rounded-lg border border-dashed border-gray-700 text-gray-400 italic">
            <p>No sales yet. Keep promoting your listings!</p>
          </div>
        ) : (
          orders.map((order, index) => (
            <div
              key={`order-${order.id}-${index}`}
              className="border border-gray-700 p-4 rounded-lg text-sm bg-black hover:border-[#ff950e] transition"
            >
              <div className="flex items-center gap-4">
                {order.imageUrl && (
                  <img
                    src={order.imageUrl}
                    alt={sanitizeStrict(order.title)}
                    className="w-16 h-16 object-cover rounded-md border border-gray-600"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-base">{sanitizeStrict(order.title)}</h3>
                  <p className="text-[#ff950e] font-bold text-lg mt-1">
                    ${order.markedUpPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Sold on {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// src/components/buyers/my-orders/OrdersHeader.tsx
'use client';

import React from 'react';

/* =====================================================================
 * Was: a 14x14 icon tile, a"BUYER HUB" pill, a gradient-clipped h1, a
 * marketing sentence, and three feature cards advertising"Live
 * Tracking / Real-time updates","Package" and"ShieldCheck".
 *
 * That is landing-page copy on a page you only reach after logging in.
 * Nobody who has already bought something needs to be sold the feature
 * they are currently using. A page title is a page title.
 * ===================================================================== */

interface OrdersHeaderProps {
 orderCount?: number;
}

export default function OrdersHeader({ orderCount }: OrdersHeaderProps) {
 return (
 <div>
 <h1 className="text-2xl font-bold text-white sm:text-3xl">My orders</h1>
 {typeof orderCount === 'number' ? (
 <p className="mt-1 text-sm text-ink-muted">
 {orderCount} {orderCount === 1 ? 'order' : 'orders'}
 </p>
 ) : null}
 </div>
 );
}

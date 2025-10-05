'use client';

import { useMemo } from 'react';
import {
  Activity,
  Users,
  CheckCircle2,
  ShoppingBag,
  Star,
  Download,
  Upload
} from 'lucide-react';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface User {
  role: string;
  verified?: boolean;
  verificationStatus?: string;
  [key: string]: any;
}

interface Listing {
  seller?: string;
  [key: string]: any;
}

interface Deposit {
  username: string;
  amount: number;
  status: string;
  date?: string;
  role?: 'buyer' | 'seller' | 'admin';
  [key: string]: any;
}

interface Withdrawal {
  amount: number;
  date: string;
}

interface AdminHealthSectionProps {
  users: Record<string, User>;
  listings: Listing[];
  wallet: Record<string, number>;
  depositLogs: Deposit[];
  filteredDeposits: Deposit[];
  sellerWithdrawals: Record<string, Withdrawal[]>;
}

export default function AdminHealthSection({
  users = {},
  listings = [],
  wallet = {},
  depositLogs = [],
  filteredDeposits = [],
  sellerWithdrawals = {}
}: AdminHealthSectionProps) {
  const clean = (u?: string) => (typeof u === 'string' ? u.trim() : '');
  const isAdminUser = (u?: string) => {
    const uname = clean(u);
    if (!uname) return false;
    // Treat the platform/system account as admin; otherwise use role from users map
    if (uname === 'platform') return true;
    return users?.[uname]?.role === 'admin';
  };

  const depositorRole = (d: Deposit): 'buyer' | 'admin' => {
    const uname = clean(d?.username);
    const roleFromData = d?.role;
    const roleFromUsers = users?.[uname]?.role;
    const finalRole = roleFromData ?? roleFromUsers ?? (uname === 'platform' ? 'admin' : 'buyer');
    return finalRole === 'admin' ? 'admin' : 'buyer';
  };

  const {
    sellersSet,
    buyersSet,
    verifiedSellers,
    activeListings,
    avgListingsPerSeller,
    topSellers,
    depositorRoleByUser,
    topDepositors,
    topWithdrawers
  } = useMemo(() => {
    // Sellers
    const sellersFromUsers = new Set(
      Object.entries(users)
        .filter(([, info]) => info?.role === 'seller')
        .map(([u]) => clean(u))
        .filter((u) => u && !isAdminUser(u))
    );

    const sellersFromWithdrawals = new Set(
      Object.keys(sellerWithdrawals || {})
        .map((u) => clean(u))
        .filter((u) => u && !isAdminUser(u))
    );

    const sellersFromListings = new Set(
      (listings || [])
        .map((l) => clean(l?.seller))
        .filter((u) => u && !isAdminUser(u))
    );

    const sellersSetTemp = new Set<string>([
      ...Array.from(sellersFromUsers),
      ...Array.from(sellersFromWithdrawals),
      ...Array.from(sellersFromListings),
    ]);

    // Buyers
    const buyersFromUsers = new Set(
      Object.entries(users || {})
        .filter(([, info]) => info?.role === 'buyer')
        .map(([u]) => clean(u))
        .filter((u) => u && !isAdminUser(u))
    );

    const buyersFromDeposits = new Set(
      (filteredDeposits || [])
        .filter((d) => d?.status === 'completed')
        .filter((d) => depositorRole(d) !== 'admin')
        .map((d) => clean(d?.username))
        .filter((u) => u && !isAdminUser(u))
    );

    const buyersSetTemp = new Set<string>([
      ...Array.from(buyersFromUsers),
      ...Array.from(buyersFromDeposits),
    ]);

    const verifiedSellersTemp = Object.values(users || {}).filter(
      (u) => u?.role === 'seller' && (u?.verified || u?.verificationStatus === 'verified')
    );

    const activeListingsCount = (listings || []).length;
    const avgListings = sellersSetTemp.size > 0 ? (activeListingsCount / sellersSetTemp.size).toFixed(1) : '0';

    const topSellersTemp = Object.entries(wallet || {})
      .filter(([username, bal]) => users?.[username]?.role === 'seller' && Number.isFinite(bal))
      .sort(([, a], [, b]) => (Number(b) as number) - (Number(a) as number))
      .slice(0, 5);

    const depositorRoleByUserTemp: Record<string, 'buyer' | 'admin'> =
      (filteredDeposits || []).reduce((acc, d) => {
        const uname = clean(d?.username);
        if (!uname) return acc;
        const r = depositorRole(d);
        acc[uname] = r === 'admin' ? 'admin' : 'buyer';
        return acc;
      }, {} as Record<string, 'buyer' | 'admin'>);

    const depositTotals: Record<string, number> = (filteredDeposits || [])
      .filter((deposit) => deposit?.status === 'completed')
      .reduce((acc: Record<string, number>, deposit: Deposit) => {
        const uname = clean(deposit?.username);
        if (!uname || isAdminUser(uname)) return acc;
        const amt = Number(deposit?.amount);
        acc[uname] = (acc[uname] || 0) + (Number.isFinite(amt) ? amt : 0);
        return acc;
      }, {});

    const topDepositorsTemp = Object.entries(depositTotals)
      .sort(([, a], [, b]) => (Number(b) as number) - (Number(a) as number))
      .slice(0, 5);

    const topWithdrawersTemp = Object.entries(sellerWithdrawals || {})
      .map(([seller, withdrawals]) => ({
        seller,
        totalWithdrawn: (withdrawals || []).reduce((sum, w) => {
          const amt = Number(w?.amount);
          return sum + (Number.isFinite(amt) ? amt : 0);
        }, 0),
        withdrawalCount: (withdrawals || []).length
      }))
      .sort((a, b) => b.totalWithdrawn - a.totalWithdrawn)
      .slice(0, 5);

    return {
      sellersSet: sellersSetTemp,
      buyersSet: buyersSetTemp,
      verifiedSellers: verifiedSellersTemp,
      activeListings: activeListingsCount,
      avgListingsPerSeller: avgListings,
      topSellers: topSellersTemp,
      depositorRoleByUser: depositorRoleByUserTemp,
      topDepositors: topDepositorsTemp,
      topWithdrawers: topWithdrawersTemp
    };
  }, [users, listings, wallet, filteredDeposits, sellerWithdrawals]);

  const buyersCount = buyersSet.size;
  const sellersCount = sellersSet.size;
  const totalUsersCount = new Set<string>([...Array.from(buyersSet), ...Array.from(sellersSet)]).size;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number.isFinite(amount) ? amount : 0);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      {/* Platform Health */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-7 backdrop-blur-sm shadow-xl shadow-black/30">
        <div className="pointer-events-none absolute -top-16 -right-14 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />
        <h3 className="relative mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Activity className="h-5 w-5 text-emerald-300" />
          Platform Health
        </h3>
        <div className="relative space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-sky-300" />
              <span className="text-sm font-medium text-white/80">Total Users</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{totalUsersCount}</span>
              <p className="text-xs text-gray-400">
                {buyersCount} buyers, {sellersCount} sellers
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <span className="text-sm font-medium text-white/80">Verified Sellers</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{verifiedSellers.length}</span>
              <p className="text-xs text-gray-400">
                {sellersCount > 0 ? Math.round((verifiedSellers.length / sellersCount) * 100) : 0}% verified
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-purple-300" />
              <span className="text-sm font-medium text-white/80">Active Listings</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{activeListings}</span>
              <p className="text-xs text-gray-400">{avgListingsPerSeller} avg per seller</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Earning Sellers */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-7 backdrop-blur-sm shadow-xl shadow-black/30">
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-[#ff6b00]/15 blur-3xl" aria-hidden="true" />
        <h3 className="relative mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Star className="h-5 w-5 text-[#ffbf7f]" />
          Top Earning Sellers
        </h3>
        <div className="relative space-y-3">
          {topSellers.length > 0 ? (
            topSellers.map(([username, balance], index) => (
              <div
                key={username}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      index === 0
                        ? 'bg-yellow-400 text-black'
                        : index === 1
                        ? 'bg-slate-300 text-black'
                        : index === 2
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/10 text-gray-300'
                    }`}
                    aria-label={`Rank ${index + 1}`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      <SecureMessageDisplay content={username} allowBasicFormatting={false} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {users?.[username]?.verified ? '✅ Verified' : '⏳ Unverified'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{formatCurrency(Number(balance))}</p>
                  <p className="text-xs text-gray-400">earned</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-8 text-center text-gray-400">
              <Star className="mx-auto mb-2 h-8 w-8 text-gray-600" />
              <p>No seller earnings yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Depositors */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-7 backdrop-blur-sm shadow-xl shadow-black/30">
        <div className="pointer-events-none absolute -top-12 right-0 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" aria-hidden="true" />
        <h3 className="relative mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Download className="h-5 w-5 text-sky-300" />
          Top Depositors
        </h3>
        <div className="relative space-y-3">
          {topDepositors.length > 0 ? (
            topDepositors.map(([username, totalDeposited], index) => (
              <div
                key={username}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      index === 0
                        ? 'bg-sky-400 text-black'
                        : index === 1
                        ? 'bg-sky-300 text-black'
                        : index === 2
                        ? 'bg-sky-200 text-black'
                        : 'bg-white/10 text-gray-300'
                    }`}
                    aria-label={`Rank ${index + 1}`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      <SecureMessageDisplay content={username} allowBasicFormatting={false} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {depositorRoleByUser[username] === 'admin' ? '🛡️ Admin' : '💳 Buyer'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sky-200">{formatCurrency(Number(totalDeposited))}</p>
                  <p className="text-xs text-gray-400">deposited</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-8 text-center text-gray-400">
              <Download className="mx-auto mb-2 h-8 w-8 text-gray-600" />
              <p>No deposits yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Withdrawers */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-7 backdrop-blur-sm shadow-xl shadow-black/30">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 rounded-full bg-red-500/10 blur-3xl" aria-hidden="true" />
        <h3 className="relative mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Upload className="h-5 w-5 text-red-300" />
          Top Withdrawers
        </h3>
        <div className="relative space-y-3">
          {Object.keys(sellerWithdrawals || {}).length > 0 ? (
            topWithdrawers.map((withdrawer, index) => (
              <div
                key={withdrawer.seller}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      index === 0
                        ? 'bg-red-400 text-white'
                        : index === 1
                        ? 'bg-red-300 text-black'
                        : index === 2
                        ? 'bg-red-200 text-black'
                        : 'bg-white/10 text-gray-300'
                    }`}
                    aria-label={`Rank ${index + 1}`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      <SecureMessageDisplay content={withdrawer.seller} allowBasicFormatting={false} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {withdrawer.withdrawalCount} withdrawal{withdrawer.withdrawalCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-200">{formatCurrency(Number(withdrawer.totalWithdrawn))}</p>
                  <p className="text-xs text-gray-400">withdrawn</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-8 text-center text-gray-400">
              <Upload className="mx-auto mb-2 h-8 w-8 text-gray-600" />
              <p>No withdrawals yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// src/components/admin/wallet/AdminHealthSection.tsx
'use client';

import {
  Activity,
  Users,
  CheckCircle2,
  ShoppingBag,
  Star,
  Download,
  Upload
} from 'lucide-react';

interface User {
  role: string;
  verified?: boolean;
  verificationStatus?: string;
  [key: string]: any;
}

interface Listing {
  [key: string]: any;
}

interface Deposit {
  username: string;
  amount: number;
  status: string;
  date?: string;
  // If backend provides this, we honor it; otherwise we infer below.
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
  users,
  listings,
  wallet,
  depositLogs,
  filteredDeposits,
  sellerWithdrawals
}: AdminHealthSectionProps) {
  // Calculate metrics
  const allUsers = Object.values(users).filter((u: User) => u.role !== 'admin');
  const buyers = allUsers.filter((u: User) => u.role === 'buyer');
  const sellers = allUsers.filter((u: User) => u.role === 'seller');
  const verifiedSellers = sellers.filter(
    (u: User) => u.verified || u.verificationStatus === 'verified'
  );

  const activeListings = listings.length;
  const avgListingsPerSeller =
    sellers.length > 0 ? (activeListings / sellers.length).toFixed(1) : '0';

  // Top sellers
  const topSellers = Object.entries(wallet)
    .filter(([username]: [string, number]) => users[username]?.role === 'seller')
    .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
    .slice(0, 5);

  // Build a quick map of depositor -> role using deposit rows themselves.
  // Prefer the backend-provided deposit.role; otherwise infer:
  // 'platform' => 'admin', everyone else => 'buyer'.
  const depositorRoleByUser: Record<string, 'buyer' | 'seller' | 'admin'> =
    filteredDeposits.reduce((acc, d) => {
      const inferredRole =
        d.role ?? (d.username === 'platform' ? 'admin' : 'buyer');
      // Even if something upstream accidentally marked a deposit as 'seller',
      // treat depositors as buyers in the dashboard context.
      acc[d.username] = inferredRole === 'seller' ? 'buyer' : inferredRole;
      return acc;
    }, {} as Record<string, 'buyer' | 'seller' | 'admin'>);

  // Top depositors - compute totals from filteredDeposits
  const depositTotals: Record<string, number> = filteredDeposits
    .filter((deposit) => deposit.status === 'completed')
    .reduce((acc: Record<string, number>, deposit: Deposit) => {
      acc[deposit.username] = (acc[deposit.username] || 0) + deposit.amount;
      return acc;
    }, {});

  const topDepositors: [string, number][] = Object.entries(depositTotals)
    .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
    .slice(0, 5);

  // Top withdrawers
  const topWithdrawers = Object.entries(sellerWithdrawals)
    .map(([seller, withdrawals]: [string, Withdrawal[]]) => ({
      seller,
      totalWithdrawn: withdrawals.reduce(
        (sum: number, w: Withdrawal) => sum + w.amount,
        0
      ),
      withdrawalCount: withdrawals.length
    }))
    .sort((a, b) => b.totalWithdrawn - a.totalWithdrawn)
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const roleLabel = (username: string) => {
    const role = depositorRoleByUser[username] ?? (username === 'platform' ? 'admin' : 'buyer');
    if (role === 'admin') return '🛡️ Admin';
    return '💳 Buyer';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
      {/* Platform Health */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#ff950e]" />
          Platform Health
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-[#252525] rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-white">Total Users</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{allUsers.length}</span>
              <p className="text-xs text-gray-400">
                {buyers.length} buyers, {sellers.length} sellers
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-[#252525] rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span className="text-white">Verified Sellers</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">
                {verifiedSellers.length}
              </span>
              <p className="text-xs text-gray-400">
                {sellers.length > 0
                  ? Math.round((verifiedSellers.length / sellers.length) * 100)
                  : 0}
                % verified
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-[#252525] rounded-lg">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-purple-400" />
              <span className="text-white">Active Listings</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{activeListings}</span>
              <p className="text-xs text-gray-400">{avgListingsPerSeller} avg per seller</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Sellers */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-[#ff950e]" />
          Top Earning Sellers
        </h3>
        <div className="space-y-3">
          {topSellers.length > 0 ? (
            topSellers.map(([username, balance], index) => (
              <div
                key={username}
                className="flex items-center justify-between p-3 bg-[#252525] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? 'bg-yellow-500 text-black'
                        : index === 1
                        ? 'bg-gray-400 text-black'
                        : index === 2
                        ? 'bg-orange-600 text-white'
                        : 'bg-[#333] text-gray-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{username}</p>
                    <p className="text-xs text-gray-400">
                      {users[username]?.verified ? '✅ Verified' : '⏳ Unverified'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{formatCurrency(balance)}</p>
                  <p className="text-xs text-gray-500">earned</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Star className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p>No seller earnings yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Depositors */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-[#ff950e]" />
          Top Depositors
        </h3>
        <div className="space-y-3">
          {topDepositors.length > 0 ? (
            topDepositors.map(([username, totalDeposited], index) => (
              <div
                key={username}
                className="flex items-center justify-between p-3 bg-[#252525] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? 'bg-blue-500 text-white'
                        : index === 1
                        ? 'bg-blue-400 text-white'
                        : index === 2
                        ? 'bg-blue-300 text-black'
                        : 'bg-[#333] text-gray-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{username}</p>
                    <p className="text-xs text-gray-400">
                      {roleLabel(username)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-400">
                    {formatCurrency(totalDeposited)}
                  </p>
                  <p className="text-xs text-gray-500">deposited</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Download className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p>No deposits yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Withdrawers */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-[#ff950e]" />
          Top Withdrawers
        </h3>
        <div className="space-y-3">
          {topWithdrawers.length > 0 ? (
            topWithdrawers.map((withdrawer, index) => (
              <div
                key={withdrawer.seller}
                className="flex items-center justify-between p-3 bg-[#252525] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? 'bg-red-500 text-white'
                        : index === 1
                        ? 'bg-red-400 text-white'
                        : index === 2
                        ? 'bg-red-300 text-black'
                        : 'bg-[#333] text-gray-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{withdrawer.seller}</p>
                    <p className="text-xs text-gray-400">
                      {withdrawer.withdrawalCount} withdrawal
                      {withdrawer.withdrawalCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-400">
                    {formatCurrency(withdrawer.totalWithdrawn)}
                  </p>
                  <p className="text-xs text-gray-500">withdrawn</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p>No withdrawals yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

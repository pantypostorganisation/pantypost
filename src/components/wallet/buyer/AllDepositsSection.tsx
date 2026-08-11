// src/components/wallet/buyer/AllDepositsSection.tsx
'use client';

import { Clock, DollarSign, CheckCircle2, AlertCircle, RefreshCw, Bitcoin, CreditCard, ArrowUpRight, Calendar, TrendingUp, Filter, ExternalLink } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

interface Deposit {
 id: string;
 type: 'card' | 'crypto';
 amount: number;
 currency?: string;
 status: 'pending' | 'completed' | 'failed' | 'confirming';
 createdAt: string;
 completedAt?: string;
 txHash?: string;
 paymentMethod?: string;
 network?: string;
 processingFee?: number;
 depositId?: string;
 notes?: string;
}

interface AllDepositsSectionProps {
 deposits: Deposit[];
 onRefresh: () => void;
}

export default function AllDepositsSection({ deposits, onRefresh }: AllDepositsSectionProps) {
 const [filter, setFilter] = useState<'all' | 'card' | 'crypto'>('all');
 const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
 const [isRefreshing, setIsRefreshing] = useState(false);

 // Auto-refresh on mount
 useEffect(() => {
 onRefresh();
 }, []);

 // Filter and sort deposits
 const filteredDeposits = useMemo(() => {
 let filtered = [...deposits];
 
 // Apply filter
 if (filter !== 'all') {
 filtered = filtered.filter(d => d.type === filter);
 }
 
 // Apply sort
 if (sortBy === 'date') {
 filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
 } else {
 filtered.sort((a, b) => b.amount - a.amount);
 }
 
 return filtered;
 }, [deposits, filter, sortBy]);

 // Calculate statistics
 const stats = useMemo(() => {
 const total = deposits.reduce((sum, d) => d.status === 'completed' ? sum + d.amount : sum, 0);
 const cardDeposits = deposits.filter(d => d.type === 'card' && d.status === 'completed').reduce((sum, d) => sum + d.amount, 0);
 const cryptoDeposits = deposits.filter(d => d.type === 'crypto' && d.status === 'completed').reduce((sum, d) => sum + d.amount, 0);
 const pending = deposits.filter(d => d.status === 'pending' || d.status === 'confirming').length;
 const failed = deposits.filter(d => d.status === 'failed').length;
 
 return { total, cardDeposits, cryptoDeposits, pending, failed };
 }, [deposits]);

 const handleRefresh = async () => {
 setIsRefreshing(true);
 await onRefresh();
 setTimeout(() => setIsRefreshing(false), 500);
 };

 const formatDate = (dateString: string) => {
 const date = new Date(dateString);
 const now = new Date();
 const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
 
 if (diffInHours < 1) {
 const diffInMinutes = Math.floor(diffInHours * 60);
 return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
 } else if (diffInHours < 24) {
 const hours = Math.floor(diffInHours);
 return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
 } else if (diffInHours < 168) { // Less than a week
 const days = Math.floor(diffInHours / 24);
 return `${days} day${days !== 1 ? 's' : ''} ago`;
 } else {
 return date.toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'short',
 day: 'numeric',
 });
 }
 };

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'completed':
 return 'text-green-400 bg-green-500/10 border-green-500/30';
 case 'confirming':
 return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
 case 'pending':
 return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
 case 'failed':
 return 'text-red-400 bg-red-500/10 border-red-500/30';
 default:
 return 'text-ink-muted bg-gray-500/10 border-gray-500/30';
 }
 };

 const getStatusText = (status: string) => {
 switch (status) {
 case 'confirming':
 return 'Verifying';
 case 'pending':
 return 'Pending';
 case 'completed':
 return 'Completed';
 case 'failed':
 return 'Failed';
 default:
 return status;
 }
 };

 const getTypeIcon = (type: string) => {
 return type === 'crypto' ? (
 <Bitcoin className="h-4 w-4 text-primary" />
 ) : (
 <CreditCard className="h-4 w-4 text-primary" />
 );
 };

 const getExplorerUrl = (txHash: string, currency?: string) => {
 if (!txHash || !currency) return null;
 
 if (currency.includes('POLYGON')) {
 return `https://polygonscan.com/tx/${txHash}`;
 } else if (currency.includes('TRC20')) {
 return `https://tronscan.org/#/transaction/${txHash}`;
 } else if (currency === 'BTC') {
 return `https://blockchair.com/bitcoin/transaction/${txHash}`;
 } else if (currency.includes('ERC20') || currency === 'ETH') {
 return `https://etherscan.io/tx/${txHash}`;
 }
 return null;
 };

 return (
 <section className="rounded-lg border border-line bg-surface p-6 transition-colors sm:p-8">
 <div className="flex flex-col gap-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
 <TrendingUp className="h-5 w-5 text-primary" />
 </div>
 <div>
 <h2 className="text-2xl font-semibold text-white">All Deposits</h2>
 <p className="text-sm text-ink-muted">Complete history of your wallet funding</p>
 </div>
 </div>
 <button
 onClick={handleRefresh}
 disabled={isRefreshing}
 className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-primary hover:text-white disabled:opacity-50"
 >
 <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
 Refresh
 </button>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 <div className="rounded-md border border-line bg-surface p-4">
 <p className="text-xs text-ink-faint mb-1">Total Deposited</p>
 <p className="text-xl font-bold text-white">${stats.total.toFixed(2)}</p>
 </div>
 <div className="rounded-md border border-line bg-surface p-4">
 <p className="text-xs text-ink-faint mb-1">Card Deposits</p>
 <p className="text-xl font-bold text-white">${stats.cardDeposits.toFixed(2)}</p>
 </div>
 <div className="rounded-md border border-line bg-surface p-4">
 <p className="text-xs text-ink-faint mb-1">Crypto Deposits</p>
 <p className="text-xl font-bold text-white">${stats.cryptoDeposits.toFixed(2)}</p>
 </div>
 <div className="rounded-md border border-line bg-surface p-4">
 <p className="text-xs text-ink-faint mb-1">Status</p>
 <div className="flex items-center gap-2 text-xs">
 {stats.pending > 0 && (
 <span className="text-yellow-400">{stats.pending} pending</span>
 )}
 {stats.failed > 0 && (
 <span className="text-red-400">{stats.failed} failed</span>
 )}
 {stats.pending === 0 && stats.failed === 0 && (
 <span className="text-green-400">All complete</span>
 )}
 </div>
 </div>
 </div>

 {/* Filters */}
 <div className="flex flex-wrap gap-2">
 <div className="flex rounded-lg border border-line bg-surface p-1">
 <button
 onClick={() => setFilter('all')}
 className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
 filter === 'all' 
 ? 'bg-primary text-black' 
 : 'text-ink-muted hover:text-white'
 }`}
 >
 All
 </button>
 <button
 onClick={() => setFilter('card')}
 className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
 filter === 'card' 
 ? 'bg-primary text-black' 
 : 'text-ink-muted hover:text-white'
 }`}
 >
 Card
 </button>
 <button
 onClick={() => setFilter('crypto')}
 className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
 filter === 'crypto' 
 ? 'bg-primary text-black' 
 : 'text-ink-muted hover:text-white'
 }`}
 >
 Crypto
 </button>
 </div>
 <div className="flex rounded-lg border border-line bg-surface p-1">
 <button
 onClick={() => setSortBy('date')}
 className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
 sortBy === 'date' 
 ? 'bg-primary text-black' 
 : 'text-ink-muted hover:text-white'
 }`}
 >
 By Date
 </button>
 <button
 onClick={() => setSortBy('amount')}
 className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
 sortBy === 'amount' 
 ? 'bg-primary text-black' 
 : 'text-ink-muted hover:text-white'
 }`}
 >
 By Amount
 </button>
 </div>
 </div>

 {/* Deposits List */}
 <div className="space-y-3">
 {filteredDeposits.length === 0 ? (
 <div className="text-center py-12">
 <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface mb-4">
 <DollarSign className="h-8 w-8 text-ink-faint" />
 </div>
 <p className="text-ink-muted mb-2">No deposits yet</p>
 <p className="text-sm text-ink-faint">Your deposit history will appear here</p>
 </div>
 ) : (
 filteredDeposits.map((deposit) => (
 <div
 key={deposit.id}
 className="group/item rounded-md border border-line bg-surface p-4 transition-colors duration-200 hover:border-primary/40"
 >
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div className="flex items-start gap-3 flex-1">
 <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/40 bg-primary/10 flex-shrink-0">
 {getTypeIcon(deposit.type)}
 </div>
 <div className="space-y-1 flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <p className="font-medium text-white">
 ${deposit.amount.toFixed(2)}
 </p>
 {deposit.currency && (
 <span className="text-xs text-ink-faint">
 via {deposit.currency.replace('_', ' ')}
 </span>
 )}
 <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${getStatusColor(deposit.status)}`}>
 {deposit.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
 {(deposit.status === 'pending' || deposit.status === 'confirming') && <Clock className="h-3 w-3" />}
 {deposit.status === 'failed' && <AlertCircle className="h-3 w-3" />}
 {getStatusText(deposit.status)}
 </span>
 </div>
 <div className="flex flex-wrap items-center gap-3 text-xs text-ink-faint">
 <span className="flex items-center gap-1">
 <Calendar className="h-3 w-3" />
 {formatDate(deposit.createdAt)}
 </span>
 {deposit.network && (
 <span>Network: {deposit.network}</span>
 )}
 {deposit.paymentMethod && deposit.type === 'card' && (
 <span>Method: {deposit.paymentMethod}</span>
 )}
 {deposit.processingFee !== undefined && (
 <span className="text-green-400">Fee: ${deposit.processingFee.toFixed(2)}</span>
 )}
 </div>
 {deposit.txHash && (
 <p className="text-xs text-ink-faint font-mono truncate">
 TX: {deposit.txHash}
 </p>
 )}
 </div>
 </div>
 {deposit.txHash && deposit.type === 'crypto' && getExplorerUrl(deposit.txHash, deposit.currency) && (
 <button
 onClick={() => {
 const url = getExplorerUrl(deposit.txHash!, deposit.currency);
 if (url) window.open(url, '_blank');
 }}
 className="inline-flex items-center gap-1 text-xs text-primary hover:text-white transition-colors flex-shrink-0"
 >
 View TX
 <ExternalLink className="h-3 w-3" />
 </button>
 )}
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </section>
 );
}
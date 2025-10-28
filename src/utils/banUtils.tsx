// src/utils/banUtils.tsx
import { 
  AlertTriangle, 
  MessageSquare, 
  AlertCircle, 
  UserCheck, 
  Info 
} from 'lucide-react';
import { BanEntry, BanReason } from '@/types/ban';
import { sanitizeStrict } from '@/utils/security/sanitization';

export const getBanReasonDisplay = (reason: string, customReason?: string) => {
  if (!reason || typeof reason !== 'string') {
    return 'Unknown Reason';
  }

  const reasonMap: Record<string, { label: string, icon: any, color: string }> = {
    harassment: { label: 'Harassment', icon: AlertTriangle, color: 'text-red-400' },
    spam: { label: 'Spam', icon: MessageSquare, color: 'text-yellow-400' },
    inappropriate_content: { label: 'Inappropriate Content', icon: AlertCircle, color: 'text-orange-400' },
    scam: { label: 'Scam/Fraud', icon: AlertTriangle, color: 'text-red-500' },
    underage: { label: 'Underage', icon: UserCheck, color: 'text-purple-400' },
    payment_fraud: { label: 'Payment Fraud', icon: AlertTriangle, color: 'text-red-600' },
    other: { label: 'Other', icon: Info, color: 'text-gray-400' }
  };

  const reasonInfo = reasonMap[reason.toLowerCase()] || { label: reason, icon: Info, color: 'text-gray-400' };
  const Icon = reasonInfo.icon;

  // Sanitize customReason before display to prevent XSS
  const sanitizedCustomReason = customReason ? sanitizeStrict(customReason) : undefined;

  return (
    <span className={`flex items-center gap-1 ${reasonInfo.color}`}>
      <Icon size={14} />
      {reasonInfo.label}
      {sanitizedCustomReason && <span className="text-gray-400 ml-1">- {sanitizedCustomReason}</span>}
    </span>
  );
};

export const isValidBan = (ban: any): ban is BanEntry => {
  return ban && 
         typeof ban === 'object' && 
         ban.id && 
         ban.username && 
         typeof ban.username === 'string' &&
         ban.banType &&
         ban.reason &&
         ban.startTime &&
         typeof ban.bannedBy === 'string'; // Changed to check type instead of truthiness
};

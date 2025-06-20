// src/components/seller-verification/utils/verificationHelpers.ts

export const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const getTimeAgo = (timestamp?: string): string => {
  if (!timestamp) return 'Unknown date';
  
  const requestDate = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - requestDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  
  return 'just now';
};

export const generateVerificationCode = (username: string): string => {
  return `VERIF-${username}-${Math.floor(10000000 + Math.random() * 90000000)}`;
};
// src/components/MessageNotifications.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessageContext';
import { useRouter } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';

export default function MessageNotifications() {
  const { user } = useAuth();
  const { messageNotifications } = useMessages();
  const router = useRouter();
  const [visible, setVisible] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update visible notifications when they change
  useEffect(() => {
    if (!user || user.role !== 'seller' || !mounted) return;

    const notifications = messageNotifications[user.username] || [];
    setVisible(notifications.map((n) => n.buyer));
  }, [user, messageNotifications, mounted]);

  // Listen for storage changes for real-time updates
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'panty_message_notifications' && user?.role === 'seller') {
        const notifications = messageNotifications[user.username] || [];
        setVisible(notifications.map((n) => n.buyer));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, messageNotifications, mounted]);

  if (!mounted || !user || user.role !== 'seller') return null;

  const notifications = messageNotifications[user.username] || [];
  const visibleNotifications = notifications.filter((n) => visible.includes(n.buyer));

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map((notif) => {
        const buyerSafe = sanitizeStrict(notif.buyer);
        const threadParam = encodeURIComponent(notif.buyer);

        return (
          <div
            key={buyerSafe}
            className="bg-purple-600 text-white rounded-lg shadow-lg p-4 cursor-pointer hover:bg-purple-700 transition-all transform hover:scale-105 animate-slide-in"
            onClick={() => {
              // Navigate to the conversation (encode user-supplied value)
              router.push(`/sellers/messages?thread=${threadParam}`);
              // Remove from visible
              setVisible((prev) => prev.filter((b) => b !== notif.buyer));
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1">
                <MessageCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">
                    {notif.messageCount > 1 ? (
                      <>
                        {notif.messageCount} new messages from{' '}
                        <SecureMessageDisplay content={buyerSafe} allowBasicFormatting={false} as="span" />
                      </>
                    ) : (
                      <>
                        New message from{' '}
                        <SecureMessageDisplay content={buyerSafe} allowBasicFormatting={false} as="span" />
                      </>
                    )}
                  </div>
                  <SecureMessageDisplay
                    content={notif.lastMessage}
                    className="text-sm opacity-90 truncate mt-1"
                    allowBasicFormatting={false}
                    maxLength={100}
                    as="div"
                  />
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setVisible((prev) => prev.filter((b) => b !== notif.buyer));
                }}
                className="ml-3 p-1 hover:bg-purple-800 rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

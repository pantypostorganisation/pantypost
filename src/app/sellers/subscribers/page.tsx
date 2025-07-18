// src/app/sellers/subscribers/page.tsx
'use client';

import BanCheck from '@/components/BanCheck';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { useMessages } from '@/context/MessageContext';
import { useState } from 'react';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';

export default function SellerSubscribersPage() {
  const { user } = useAuth();
  const { subscriptions, users } = useListings();
  const { sendMessage } = useMessages();
  const [messageModal, setMessageModal] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [messageError, setMessageError] = useState('');

  if (!user || user.role !== 'seller') return null;

  // Find all buyers who have subscribed to this seller
  const subscribers: string[] = Object.entries(subscriptions)
    .filter(([_, sellers]) => Array.isArray(sellers) && sellers.includes(user.username))
    .map(([buyer]) => buyer);

  const handleSendMessage = () => {
    const trimmed = messageContent.trim();
    
    // Validate message
    if (!trimmed) {
      setMessageError('Please enter a message');
      return;
    }
    
    if (trimmed.length > 1000) {
      setMessageError('Message is too long (max 1000 characters)');
      return;
    }
    
    // Clear error and send
    setMessageError('');
    
    if (messageModal) {
      // Message is already sanitized by SecureTextarea
      sendMessage(user.username, messageModal, trimmed);
      setMessageSent(true);
      setTimeout(() => {
        setMessageModal(null);
        setMessageContent('');
        setMessageSent(false);
      }, 1500);
    }
  };

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <main className="p-10 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">🧾 Your Subscribers</h1>
          {subscribers.length === 0 ? (
            <p className="text-gray-500 italic">No subscribers yet.</p>
          ) : (
            <ul className="space-y-4">
              {subscribers.map((buyer) => (
                <li
                  key={buyer}
                  className="border rounded p-4 shadow bg-white dark:bg-black flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg font-semibold">
                      <SecureMessageDisplay content={buyer} allowBasicFormatting={false} />
                    </h3>
                    <p className="text-sm text-gray-500">Subscribed to you</p>
                  </div>
                  <button
                    onClick={() => {
                      setMessageModal(buyer);
                      setMessageContent('');
                      setMessageError('');
                    }}
                    className="text-sm bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
                  >
                    Message
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Message Modal */}
          {messageModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-sm">
                <h2 className="text-lg font-bold mb-3">
                  Message <SecureMessageDisplay content={messageModal} allowBasicFormatting={false} />
                </h2>
                <SecureTextarea
                  value={messageContent}
                  onChange={setMessageContent}
                  onBlur={() => setMessageError('')}
                  rows={4}
                  placeholder="Type your message..."
                  maxLength={1000}
                  characterCount={true}
                  error={messageError}
                  touched={!!messageError}
                  className="mb-3"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setMessageModal(null);
                      setMessageContent('');
                      setMessageError('');
                    }}
                    className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={messageSent}
                    className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {messageSent ? '✅ Sent!' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </RequireAuth>
    </BanCheck>
  );
}

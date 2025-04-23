'use client';

import { useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';

type Message = {
  sender: string;
  receiver: string;
  content: string;
  date: string;
};

export default function AdminMessagesPage() {
  const { user, users } = useListings();
  const { messages, sendMessage } = useMessages();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [content, setContent] = useState<string>('');

  if (!user || user.role !== 'admin') return null;

  const username = user.username;

  const allMessages: Message[] = Object.values(messages).flat();

  const adminMessages = allMessages.filter(
    (msg: Message) =>
      msg.sender === username || msg.receiver === username
  );

  // ✅ Fix: Show all users except this admin
  const allUsernames = Object.keys(users || {});
  const uniqueUsers = allUsernames.filter(name => name !== username);

  const handleSend = () => {
    if (!selectedUser || !content.trim()) {
      alert('Enter a message and select a user.');
      return;
    }

    sendMessage(username, selectedUser, content.trim());
    setContent('');
  };

  return (
    <RequireAuth role="admin">
      <main className="p-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Messages</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Message User:</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select --</option>
            {uniqueUsers.map((name: string) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message here..."
            className="w-full p-2 border rounded"
            rows={4}
          />
          <button
            onClick={handleSend}
            className="mt-2 bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
          >
            Send Message
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-4">Your Conversations</h2>

        {adminMessages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          <ul className="space-y-4">
            {adminMessages.map((msg: Message, index: number) => (
              <li key={index} className="border rounded p-4">
                <p className="text-sm text-gray-500 mb-1">
                  From: <strong>{msg.sender}</strong> → <strong>{msg.receiver}</strong>
                </p>
                <p>{msg.content}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </RequireAuth>
  );
}

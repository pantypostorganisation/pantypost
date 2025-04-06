'use client';

import { useState } from 'react';

type Props = {
  sellerName: string;
  onClose: () => void;
};

export default function MessageModal({ sellerName, onClose }: Props) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) {
      alert('Please type a message.');
      return;
    }

    alert(`Message sent to ${sellerName}: "${message}"`);
    setMessage('');
    onClose(); // Close the modal
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Message {sellerName}</h2>
        <textarea
          rows={4}
          placeholder="Write your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

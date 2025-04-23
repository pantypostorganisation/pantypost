'use client';

import { useState } from 'react';
import { useListings } from '@/context/ListingContext';
import { useRequests, RequestStatus } from '@/context/RequestContext';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import RequireAuth from '@/components/RequireAuth';

export default function CustomRequestPage() {
  const { user } = useListings();
  const { addRequest } = useRequests();
  const router = useRouter();

  const [seller, setSeller] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = () => {
    if (!title || !description || !price || !seller) {
      alert('Please fill out all required fields.');
      return;
    }

    const newRequest = {
      id: uuidv4(),
      buyer: user!.username,
      seller,
      title,
      description,
      price: parseFloat(price),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      status: 'pending' as RequestStatus,
      date: new Date().toISOString()
    };

    addRequest(newRequest);
    alert('Custom request sent!');
    router.push('/buyers/dashboard');
  };

  return (
    <RequireAuth role="buyer">
      <main className="p-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📝 Create Custom Request</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target Seller *</label>
            <input
              type="text"
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., seller123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Request Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 48hr worn gym panties"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Request Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2"
              placeholder="Include any details, preferences, or conditions you have in mind"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Suggested Price ($) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 35.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., gym, sweaty, cotton"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="mt-4 bg-pink-600 text-white px-6 py-2 rounded hover:bg-pink-700"
          >
            Send Request
          </button>
        </div>
      </main>
    </RequireAuth>
  );
}

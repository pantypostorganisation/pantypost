'use client';

import { useState } from 'react';
import { useListings } from '@/context/ListingContext';
import { useRequests, RequestStatus } from '@/context/RequestContext';
import { useMessages } from '@/context/MessageContext';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import RequireAuth from '@/components/RequireAuth';

export default function CustomRequestPage() {
  const { user } = useListings();
  const { addRequest } = useRequests();
  const { sendMessage } = useMessages();
  const router = useRouter();

  const [seller, setSeller] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!title || !description || !price || !seller) {
      setError('Please fill out all required fields.');
      return;
    }

    const requestId = uuidv4();
    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    const newRequest = {
      id: requestId,
      buyer: user!.username,
      seller,
      title,
      description,
      price: parseFloat(price),
      tags: tagsArray,
      status: 'pending' as RequestStatus,
      date: new Date().toISOString()
    };

    addRequest(newRequest);

    // THIS IS THE ONLY CORRECT WAY TO SEND THE MESSAGE:
    sendMessage(
      user!.username,
      seller,
      `[PantyPost Custom Request] ${title}`,
      {
        type: 'customRequest',
        meta: {
          id: requestId,
          title,
          price: parseFloat(price),
          tags: tagsArray,
        }
      }
    );

    router.push('/buyers/requests');
  };

  return (
    <RequireAuth role="buyer">
      <main className="p-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📝 Create Custom Request</h1>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="seller" className="block text-sm font-medium mb-1">
              Target Seller *
            </label>
            <input
              id="seller"
              name="seller"
              type="text"
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., seller123"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Request Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 48hr worn gym panties"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Request Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2"
              placeholder="Include any details, preferences, or conditions you have in mind"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-1">
              Suggested Price ($) *
            </label>
            <input
              id="price"
              name="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 35.00"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., gym, sweaty, cotton"
              autoComplete="off"
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

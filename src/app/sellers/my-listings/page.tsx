'use client';

import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function MyListingsPage() {
  const { listings = [], addListing, removeListing, user } = useListings();
  const { orderHistory } = useWallet();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleAddListing = () => {
    if (!title || !description || !price || !imageUrl) {
      alert('Please fill in all fields.');
      return;
    }

    const numericPrice = parseFloat(price);

    addListing({
      id: uuidv4(),
      title,
      description,
      price: numericPrice,
      markedUpPrice: numericPrice * 1.1,
      imageUrl,
      date: new Date().toISOString(),
      seller: user?.username || 'unknown',
    });

    setTitle('');
    setDescription('');
    setPrice('');
    setImageUrl('');
  };

  const myListings = listings?.filter(
    (listing) => listing.seller === user?.username
  ) ?? [];

  const sellerOrders = orderHistory.filter(
    (order) => order.seller === user?.username
  );

  return (
    <RequireAuth role="seller">
      <main className="p-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Listings</h1>

        <div className="mb-10 space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleAddListing}
            className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
          >
            Add Listing
          </button>
        </div>

        <div className="grid gap-4">
          {myListings.length === 0 ? (
            <p>You haven't listed anything yet.</p>
          ) : (
            myListings.map((listing) => (
              <div key={listing.id} className="border rounded p-4 shadow">
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-full h-48 object-cover rounded mb-2"
                />
                <h2 className="text-xl font-bold">{listing.title}</h2>
                <p className="text-gray-600">{listing.description}</p>
                <p className="text-pink-700 font-semibold mb-2">
                  Price (before fee): ${listing.price.toFixed(2)}
                </p>
                <button
                  onClick={() => removeListing(listing.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {sellerOrders.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Order History</h2>
            <div className="grid gap-4">
              {sellerOrders.map((order) => (
                <div
                  key={order.id + order.date}
                  className="border rounded p-4 bg-gray-50"
                >
                  <img
                    src={order.imageUrl}
                    alt={order.title}
                    className="w-full h-48 object-cover rounded mb-2"
                  />
                  <h3 className="text-lg font-semibold">{order.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {order.description}
                  </p>
                  <p className="text-pink-700 font-semibold">
                    Sold for ${order.markedUpPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Purchased on{' '}
                    {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </RequireAuth>
  );
}


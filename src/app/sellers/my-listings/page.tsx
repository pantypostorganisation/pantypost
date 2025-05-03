'use client';

import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Crown, Sparkles, Trash2, Clock } from 'lucide-react';
import { Listing } from '@/context/ListingContext'; // Import Listing type

export default function MyListingsPage() {
  const { listings = [], addListing, removeListing, user } = useListings();
  const { orderHistory } = useWallet();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [tags, setTags] = useState('');
  // Changed wearTime state to hoursWorn and type to number or empty string
  const [hoursWorn, setHoursWorn] = useState<number | ''>('');

  const handleAddListing = () => {
    if (!title || !description || !price || !imageUrl) {
      alert('Please fill in all required fields (title, description, price, image).');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
        alert('Please enter a valid price.');
        return;
    }

    const tagsList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    // Prepare listing data, including hoursWorn
    const newListingData = {
      title,
      description,
      price: numericPrice,
      imageUrl,
      seller: user?.username || 'unknown',
      isPremium,
      tags: tagsList,
      // Pass hoursWorn as a number, or undefined if empty
      hoursWorn: hoursWorn === '' ? undefined : Number(hoursWorn),
    };

    // Call addListing with the new data structure
    addListing(newListingData);

    // Clear form fields
    setTitle('');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setIsPremium(false);
    setTags('');
    setHoursWorn(''); // Clear hoursWorn state
  };

  // Ensure myListings is typed correctly
  const myListings: Listing[] = listings?.filter(
    (listing: Listing) => listing.seller === user?.username
  ) ?? [];

  // Count premium vs standard listings
  const premiumCount = myListings.filter(listing => listing.isPremium).length;
  const standardCount = myListings.length - premiumCount;

  const sellerOrders = orderHistory.filter(
    (order) => order.seller === user?.username
  );

  return (
    <RequireAuth role="seller">
      <main className="p-10 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">My Listings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left side: form + active listings */}
          <div className="lg:col-span-2 space-y-10">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Standard Listings</h3>
                  <span className="text-2xl font-bold text-pink-600">{standardCount}</span>
                </div>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg shadow border border-yellow-300">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Premium Listings</h3>
                  <span className="text-2xl font-bold text-yellow-600">{premiumCount}</span>
                </div>
              </div>
            </div>

            {/* Add listing form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Create New Listing</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 'Black Lace Panties Worn 24 Hours'"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border rounded text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Describe your item in detail to attract buyers"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border rounded h-24 text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 29.99"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full p-2 border rounded text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/your-image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full p-2 border rounded text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. thong, black, lace, cotton, gym"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full p-2 border rounded text-gray-800"
                  />
                  <p className="text-xs text-gray-500 mt-1">Help buyers find your items with relevant tags</p>
                </div>

                {/* Replaced Wear Time dropdown with Hours Worn number input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worn (optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 24"
                    value={hoursWorn}
                    onChange={(e) => setHoursWorn(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded text-gray-800"
                    min="0" // Ensure non-negative hours
                  />
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2 py-3 px-4 border-2 rounded-lg cursor-pointer border-yellow-400 bg-yellow-50">
                    <input
                      type="checkbox"
                      checked={isPremium}
                      onChange={() => setIsPremium(!isPremium)}
                      className="h-5 w-5"
                    />
                    <Crown className="text-yellow-500 w-5 h-5" />
                    <div>
                      <span className="font-semibold text-gray-800">Make Premium Listing</span>
                      <p className="text-xs text-gray-600 mt-0.5">Only available to your subscribers</p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleAddListing}
                  className="w-full bg-pink-600 text-white px-4 py-3 rounded-lg hover:bg-pink-700 font-medium mt-2 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Create Listing
                </button>
              </div>
            </div>

            {/* Seller's own listings */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Your Active Listings</h2>

              {myListings.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-300">
                  <p className="text-gray-700">You haven't created any listings yet.</p>
                  <p className="text-sm text-gray-600 mt-1">Use the form above to add your first listing</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myListings.map((listing) => (
                    <div
                      key={listing.id}
                      className={`border rounded-lg overflow-hidden shadow-sm hover:shadow transition relative
                        ${listing.isPremium ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}`
                      }
                    >
                      {listing.isPremium && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center">
                            <Crown className="w-3 h-3 mr-1" /> Premium
                          </span>
                        </div>
                      )}

                      <div className="relative">
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-full h-48 object-cover"
                        />
                        {/* Display hoursWorn if available */}
                        {listing.hoursWorn !== undefined && listing.hoursWorn !== null && (
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> {listing.hoursWorn} Hours Worn
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-800">{listing.title}</h3>
                        <p className="text-gray-700 text-sm mt-1 line-clamp-2">{listing.description}</p>

                        {listing.tags && listing.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {listing.tags.map((tag, idx) => (
                              <span key={idx} className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-3">
                          <p className="text-pink-700 font-semibold">
                            ${listing.price.toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeListing(listing.id)}
                            className="text-red-500 p-1 rounded hover:bg-red-50"
                            aria-label="Delete listing"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side: order history and premium tips */}
          <div className="space-y-6">
            {/* Premium Seller Tips */}
            <div className="bg-yellow-600 p-5 rounded-lg shadow text-white">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <Crown className="text-yellow-200 w-5 h-5" />
                Premium Seller Tips
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-200 font-bold">•</span>
                  <span>Premium listings are only visible to your subscribers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-200 font-bold">•</span>
                  <span>Set your monthly subscription price in your profile settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-200 font-bold">•</span>
                  <span>Use high-quality images for better conversion rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-200 font-bold">•</span>
                  <span>Premium listings can command higher prices</span>
                </li>
              </ul>
            </div>

            {/* Order History */}
            <div className="bg-white p-5 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Recent Sales</h2>
              <div className="space-y-4">
                {sellerOrders.length === 0 ? (
                  <p className="text-gray-700 italic">No sales yet. Keep promoting your listings!</p>
                ) : (
                  sellerOrders.map((order) => (
                    <div
                      key={order.id + order.date}
                      className="border p-3 rounded-lg text-sm bg-gray-50 hover:shadow-sm transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={order.imageUrl}
                          alt={order.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{order.title}</h3>
                          <p className="text-pink-700 font-semibold">
                            ${order.markedUpPrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Sold on {new Date(order.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useListings(); // Ensure this comes from a context that provides it

  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | null>(null);

  const handleLogin = () => {
    if (!username || !role) {
      alert('Enter a username and choose a role.');
      return;
    }

    login(username, role); // Call login with correct shape
    router.push('/');
  };

  return (
    <main className="p-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Login</h1>

      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setRole('buyer')}
          className={`flex-1 p-2 rounded ${
            role === 'buyer' ? 'bg-pink-600 text-white' : 'bg-gray-200'
          }`}
        >
          I'm a Buyer
        </button>
        <button
          onClick={() => setRole('seller')}
          className={`flex-1 p-2 rounded ${
            role === 'seller' ? 'bg-pink-600 text-white' : 'bg-gray-200'
          }`}
        >
          I'm a Seller
        </button>
      </div>

      <button
        onClick={handleLogin}
        className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 rounded"
      >
        Log In
      </button>
    </main>
  );
}

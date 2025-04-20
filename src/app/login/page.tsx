'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthReady, user } = useListings();

  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | null>(null);

  useEffect(() => {
    if (isAuthReady && user) {
      router.push('/');
    }
  }, [isAuthReady, user]);

  const handleLogin = () => {
    if (!username.trim() || !role) {
      alert('❌ Please enter a username and select a role.');
      return;
    }

    login(username.trim(), role);
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
          className={`flex-1 p-2 rounded font-semibold ${
            role === 'buyer' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          I'm a Buyer
        </button>
        <button
          onClick={() => setRole('seller')}
          className={`flex-1 p-2 rounded font-semibold ${
            role === 'seller' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          I'm a Seller
        </button>
      </div>

      <button
        onClick={handleLogin}
        className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 rounded font-medium"
      >
        Log In
      </button>
    </main>
  );
}

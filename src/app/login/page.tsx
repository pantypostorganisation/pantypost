a'use client';

import { useState } from 'react';
import { useListings } from '@/context/ListingContext';

export default function LoginPage() {
  const { login, user, logout } = useListings();
  const [username, setUsername] = useState('');

  if (user) {
    return (
      <main className="p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user}!</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Log Out
        </button>
      </main>
    );
  }

  return (
    <main className="p-10 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      <button
        onClick={() => login(username)}
        className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 w-full"
      >
        Login
      </button>
    </main>
  );
}

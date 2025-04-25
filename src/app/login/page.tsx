'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { User, ShoppingBag } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthReady, user } = useListings();

  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthReady && user) {
      router.push('/');
    }
  }, [isAuthReady, user]);

  const handleLogin = () => {
    if (!username.trim() || !role) {
      setError('Please enter a username and select a role.');
      return;
    }
    setError('');
    login(username.trim(), role);
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-6 bg-black">
      <main className="w-full max-w-md mx-auto p-8 bg-[#1a1a1a] rounded-3xl shadow-xl flex flex-col items-center text-white">
        {/* Logo + Branding */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mb-2 shadow-lg overflow-hidden">
            <img
              src="/logo.png"
              alt="PantyPost Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          <span className="text-3xl font-extrabold tracking-tight mb-1 text-white">PantyPost</span>
          <span className="text-xs text-[#ff950e] font-semibold tracking-wide uppercase">Marketplace for used underwear</span>
        </div>

        <h1 className="text-xl font-bold mb-6 text-white">Sign In</h1>

        {error && (
          <div className="w-full mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded text-sm text-center">
            {error}
          </div>
        )}

        {/* Username input */}
        <div className="w-full mb-4">
          <label className="block text-sm font-medium text-white mb-1" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            autoFocus
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            autoComplete="username"
          />
        </div>

        {/* Role buttons */}
        <div className="w-full flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setRole('buyer')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg font-semibold border transition
              ${role === 'buyer'
                ? 'bg-[#ff950e] text-black border-[#ff950e] shadow'
                : 'bg-black text-white border-gray-600 hover:bg-[#1a1a1a]'}`}
          >
            <ShoppingBag className="w-5 h-5" />
            Buyer
          </button>
          <button
            type="button"
            onClick={() => setRole('seller')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg font-semibold border transition
              ${role === 'seller'
                ? 'bg-[#ff950e] text-black border-[#ff950e] shadow'
                : 'bg-black text-white border-gray-600 hover:bg-[#1a1a1a]'}`}
          >
            <User className="w-5 h-5" />
            Seller
          </button>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-white text-black hover:bg-[#ff950e] hover:text-black font-bold text-lg py-3 rounded-lg shadow transition"
        >
          Log In
        </button>
      </main>
    </div>
  );
}

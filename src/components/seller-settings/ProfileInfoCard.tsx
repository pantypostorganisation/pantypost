// src/components/seller-settings/ProfileInfoCard.tsx
'use client';

import { Upload, X } from 'lucide-react';
import { RefObject } from 'react';

interface ProfileInfoCardProps {
  username?: string;
  bio: string;
  setBio: (bio: string) => void;
  preview: string | null;
  subscriptionPrice: string;
  setSubscriptionPrice: (price: string) => void;
  handleProfilePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeProfilePic: () => void;
  profilePicInputRef: RefObject<HTMLInputElement>;
}

export default function ProfileInfoCard({
  username,
  bio,
  setBio,
  preview,
  subscriptionPrice,
  setSubscriptionPrice,
  handleProfilePicChange,
  removeProfilePic,
  profilePicInputRef
}: ProfileInfoCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6">
      <h2 className="text-xl font-bold mb-6 text-white">Profile Info</h2>

      {/* Profile Picture Section */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-32 h-32 rounded-full border-4 border-[#ff950e] bg-black flex items-center justify-center overflow-hidden mb-4 shadow-lg relative group">
          {preview ? (
            <img
              src={preview}
              alt="Profile preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-4xl font-bold">
              {username ? username.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          {preview && (
            <button
              onClick={removeProfilePic}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-8 h-8 text-white" />
            </button>
          )}
        </div>
        
        <button
          onClick={() => profilePicInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition"
        >
          <Upload className="w-4 h-4" />
          {preview ? 'Change Photo' : 'Upload Photo'}
        </button>
        
        <input
          ref={profilePicInputRef}
          type="file"
          accept="image/*"
          onChange={handleProfilePicChange}
          className="hidden"
        />
      </div>

      {/* Bio Section */}
      <div className="mb-4">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
        <textarea
          id="bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] h-28 resize-none"
          placeholder="Tell buyers about yourself..."
        />
        <p className="text-xs text-gray-500 mt-1">
          {bio.length}/500 - Describe yourself, your style, and what makes your items special
        </p>
      </div>

      {/* Subscription Price */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Subscription Price ($/month)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-gray-400">$</span>
          </div>
          <input
            id="subscriptionPrice"
            name="subscriptionPrice"
            type="number"
            value={subscriptionPrice}
            onChange={(e) => setSubscriptionPrice(e.target.value)}
            className="w-full pl-8 p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            placeholder="19.99"
            min="0"
            step="0.01"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          This is what buyers will pay to access your premium content
        </p>
      </div>
    </div>
  );
}

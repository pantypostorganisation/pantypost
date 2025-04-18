'use client';

import { useListings } from '@/context/ListingContext';
import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';

export default function SellerProfileSettingsPage() {
  const { user } = useListings();
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user?.username) {
      const storedBio = sessionStorage.getItem(`profile_bio_${user.username}`);
      const storedPic = sessionStorage.getItem(`profile_pic_${user.username}`);
      if (storedBio) setBio(storedBio);
      if (storedPic) setProfilePic(storedPic);
    }
  }, [user]);

  const handleSave = () => {
    if (!user?.username) return;

    sessionStorage.setItem(`profile_bio_${user.username}`, bio);
    if (preview) {
      sessionStorage.setItem(`profile_pic_${user.username}`, preview);
      setProfilePic(preview);
      setPreview(null);
    }
    alert('✅ Profile updated!');
  };

  const compressImage = (file: File, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 300;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7); // quality: 70%
          callback(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (compressed) => {
        setPreview(compressed);
      });
    }
  };

  return (
    <RequireAuth role="seller">
      <main className="p-10 max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🛠️ My Profile</h1>

        <div className="mb-6">
          <label className="block font-medium mb-1">Profile Picture</label>
          <div className="flex items-center gap-4 mb-2">
            {preview || profilePic ? (
              <img
                src={preview || profilePic || ''}
                alt="Profile Preview"
                className="w-24 h-24 rounded-full object-cover border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-300" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-sm"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block font-medium mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-2 border rounded h-28"
            placeholder="Tell buyers a little about yourself..."
          />
        </div>

        <button
          onClick={handleSave}
          className="bg-pink-600 text-white px-6 py-2 rounded hover:bg-pink-700"
        >
          Save Changes
        </button>
      </main>
    </RequireAuth>
  );
}
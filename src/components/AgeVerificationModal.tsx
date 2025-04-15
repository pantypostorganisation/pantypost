'use client';

import { useEffect, useState } from 'react';

export default function AgeVerificationModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('ageVerified');
    if (!verified) {
      setIsVisible(true);
    }
  }, []);

  const handleYes = () => {
    localStorage.setItem('ageVerified', 'true');
    setIsVisible(false);
  };

  const handleNo = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
      <div className="bg-white text-black p-8 rounded shadow max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Are you over 21?</h2>
        <p className="mb-4">
          You must be 21 years old or older to access and use our website. Please verify your age.
        </p>
        <p className="text-sm mb-6">
          By entering our website, you agree to the terms & conditions.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleYes}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            I am over 21
          </button>
          <button
            onClick={handleNo}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            I am under 21
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { sanitizeStrict } from '@/utils/security/sanitization';

interface UnsubscribeModalProps {
  show: boolean;
  username: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function UnsubscribeModal({
  show,
  username,
  onClose,
  onConfirm,
}: UnsubscribeModalProps) {
  if (!show) return null;

  const sanitizedUsername = sanitizeStrict(username);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700">
        <h2 className="text-2xl font-bold text-red-500 mb-6 text-center">
          Confirm Unsubscription
        </h2>
        <p className="mb-6 text-center text-white text-base">
          Are you sure you want to unsubscribe from{' '}
          <strong className="text-red-400">{sanitizedUsername}</strong>? This will
          remove your access to premium listings.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition font-medium text-lg"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition text-lg"
            type="button"
          >
            Unsubscribe
          </button>
        </div>
      </div>
    </div>
  );
}

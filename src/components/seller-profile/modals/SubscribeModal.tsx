// src/components/seller-profile/modals/SubscribeModal.tsx
'use client';

interface SubscribeModalProps {
  show: boolean;
  username: string;
  subscriptionPrice: number | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SubscribeModal({
  show,
  username,
  subscriptionPrice,
  onClose,
  onConfirm,
}: SubscribeModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700">
        <h2 className="text-2xl font-bold text-[#ff950e] mb-6 text-center">
          Confirm Subscription
        </h2>
        <p className="mb-6 text-center text-white text-base">
          Subscribe to <strong className="text-[#ff950e]">{username}</strong> for{' '}
          <span className="text-xl font-bold text-[#ff950e]">
            ${subscriptionPrice ? subscriptionPrice.toFixed(2) : '...'}/month
          </span>?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition font-medium text-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#ff950e] text-black font-bold hover:bg-[#e0850d] transition text-lg"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

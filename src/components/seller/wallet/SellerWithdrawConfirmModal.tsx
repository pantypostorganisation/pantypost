'use client';

interface SellerWithdrawConfirmModalProps {
  showConfirmation: boolean;
  setShowConfirmation: (show: boolean) => void;
  withdrawAmount: string;
  isLoading: boolean;
  handleConfirmWithdraw: () => void;
}

export default function SellerWithdrawConfirmModal({
  showConfirmation,
  setShowConfirmation,
  withdrawAmount,
  isLoading,
  handleConfirmWithdraw,
}: SellerWithdrawConfirmModalProps) {
  if (!showConfirmation) return null;

  const amountNum = Number.parseFloat(withdrawAmount);
  const displayAmount = Number.isFinite(amountNum) ? amountNum.toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-md w-full border border-[#333] shadow-xl">
        <h3 className="text-xl font-bold mb-4">Confirm Withdrawal</h3>
        <p className="mb-6 text-gray-300">
          Are you sure you want to withdraw{' '}
          <span className="font-bold text-white">${displayAmount}</span>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmation(false)}
            className="flex-1 px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmWithdraw}
            className="flex-1 px-4 py-2 bg-[#ff950e] hover:bg-[#e88800] text-black rounded-lg font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : (
              'Confirm Withdrawal'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

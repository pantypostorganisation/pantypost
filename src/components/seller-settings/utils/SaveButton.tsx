// src/components/seller-settings/utils/SaveButton.tsx
'use client';

interface SaveButtonProps {
  onClick: () => void;
  showSuccess: boolean;
}

export default function SaveButton({ onClick, showSuccess }: SaveButtonProps) {
  return (
    <div className="flex flex-col items-center">
      <img
        src="/Save_All_Button.png"
        alt="Save All Profile Changes"
        onClick={onClick}
        className="w-24 h-auto object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-200"
      />
      
      {showSuccess && (
        <div className="bg-green-900 text-green-100 p-3 rounded-lg mt-3 text-center">
          ✅ Profile updated successfully!
        </div>
      )}
    </div>
  );
}

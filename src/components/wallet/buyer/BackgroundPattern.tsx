// src/components/wallet/buyer/BackgroundPattern.tsx
'use client';

export default function BackgroundPattern() {
  return (
    <div className="fixed inset-0 opacity-5 pointer-events-none">
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255, 149, 14, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 149, 14, 0.2) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(255, 149, 14, 0.15) 0%, transparent 50%)`
      }} />
    </div>
  );
}
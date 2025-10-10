'use client';

export default function BackgroundPattern() {
  return (
    <div className="fixed inset-0 opacity-5 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.25) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(37, 99, 235, 0.2) 0%, transparent 50%)`,
        }}
      />
    </div>
  );
}

// src/components/icons/WalletCardIcon.tsx
export const WalletCardIcon = ({ className = "w-5 h-3.5" }: { className?: string }) => (
  <svg
    viewBox="0 0 86 54"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Card background - dark gradient */}
    <rect
      width="86"
      height="54"
      rx="7"
      fill="url(#cardGradient)"
    />
    
    {/* Card border */}
    <rect
      width="86"
      height="54"
      rx="7"
      fill="none"
      stroke="#444"
      strokeWidth="1"
    />
    
    {/* Chip - golden color */}
    <rect
      x="10"
      y="14"
      width="16"
      height="12"
      rx="2"
      fill="#d4af37"
    />
    
    {/* Chip contact lines */}
    <rect x="12" y="16" width="4" height="3" fill="#b8860b" />
    <rect x="17" y="16" width="4" height="3" fill="#b8860b" />
    <rect x="22" y="16" width="2" height="3" fill="#b8860b" />
    <rect x="12" y="20" width="4" height="3" fill="#b8860b" />
    <rect x="17" y="20" width="4" height="3" fill="#b8860b" />
    <rect x="22" y="20" width="2" height="3" fill="#b8860b" />
    
    {/* Card number - simple dots */}
    <text
      x="43"
      y="38"
      textAnchor="middle"
      fill="#888"
      fontSize="10"
      fontFamily="monospace"
      letterSpacing="2"
    >
      •••• ••••
    </text>
    
    {/* Contactless waves - simplified */}
    <g transform="translate(70, 24)">
      <path
        d="M 0 4 Q 2 2 2 0 Q 2 -2 0 -4"
        stroke="#888"
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M 3 6 Q 6 3 6 0 Q 6 -3 3 -6"
        stroke="#888"
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M 6 8 Q 10 4 10 0 Q 10 -4 6 -8"
        stroke="#888"
        strokeWidth="0.8"
        fill="none"
      />
    </g>
    
    {/* Orange accent bar at bottom */}
    <rect
      x="10"
      y="46"
      width="30"
      height="2"
      rx="1"
      fill="#ff950e"
      opacity="0.9"
    />
    
    <defs>
      <linearGradient id="cardGradient" x1="0" y1="0" x2="86" y2="54">
        <stop offset="0%" stopColor="#2a2a2a" />
        <stop offset="50%" stopColor="#1a1a1a" />
        <stop offset="100%" stopColor="#0a0a0a" />
      </linearGradient>
    </defs>
  </svg>
);
import React from 'react'

interface ProductPlaceholderProps {
  category: 'velas' | 'aromas' | 'wax-melts' | 'quemadores' | 'packs' | 'regalarte'
  title: string
  className?: string
}

export function ProductPlaceholder({
  category,
  title,
  className = '',
}: ProductPlaceholderProps) {
  // Render category-specific visual placeholder with warm Solística aesthetics
  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-xl bg-[#EDE6DC] flex items-center justify-center p-6 select-none ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5EFE6] via-[#EFE8DF] to-[#E5DDD1] opacity-90" />

      {category === 'velas' && (
        <svg
          viewBox="0 0 200 200"
          className="relative z-10 w-full h-full text-[#38271D]"
          fill="none"
        >
          {/* Shadow */}
          <ellipse cx="100" cy="168" rx="55" ry="12" fill="#D4C7B5" opacity="0.6" />
          {/* Glass Jar Body */}
          <rect x="52" y="70" width="96" height="90" rx="12" fill="#FAF6F0" fillOpacity="0.85" stroke="#C8BBA8" strokeWidth="2" />
          <rect x="56" y="78" width="88" height="78" rx="8" fill="#F3EAD8" />
          {/* Wax Surface */}
          <ellipse cx="100" cy="78" rx="44" ry="8" fill="#E8D9C0" stroke="#C8BBA8" strokeWidth="1" />
          {/* Wick */}
          <path d="M100 78 V60" stroke="#5A4A3A" strokeWidth="2.5" strokeLinecap="round" />
          {/* Flame Glow */}
          <circle cx="100" cy="48" r="16" fill="#FAD082" opacity="0.4" />
          <circle cx="100" cy="48" r="10" fill="#F8B84E" opacity="0.6" />
          {/* Flame */}
          <path d="M100 36 C105 44, 106 50, 100 54 C94 50, 95 44, 100 36 Z" fill="#E86A33" />
          <path d="M100 40 C102 45, 103 49, 100 52 C97 49, 98 45, 100 40 Z" fill="#FFDA79" />
          {/* Label */}
          <rect x="68" y="98" width="64" height="42" rx="4" fill="#FAF6F0" stroke="#D8C8B4" strokeWidth="1" />
          <line x1="76" y1="108" x2="124" y2="108" stroke="#38271D" strokeWidth="1" strokeDasharray="2 2" />
          <text x="100" y="122" textAnchor="middle" fontSize="7" fontFamily="Georgia, serif" fill="#38271D" fontWeight="bold">SOLÍSTICA</text>
          <text x="100" y="132" textAnchor="middle" fontSize="5" fontFamily="sans-serif" fill="#7A6A5D" letterSpacing="0.5">CERA VEGETAL</text>
        </svg>
      )}

      {category === 'aromas' && (
        <svg
          viewBox="0 0 200 200"
          className="relative z-10 w-full h-full text-[#38271D]"
          fill="none"
        >
          {/* Shadow */}
          <ellipse cx="100" cy="170" rx="48" ry="10" fill="#D4C7B5" opacity="0.6" />
          {/* Reeds */}
          <path d="M90 100 L65 30" stroke="#8C7A6B" strokeWidth="3" strokeLinecap="round" />
          <path d="M96 100 L85 22" stroke="#8C7A6B" strokeWidth="3" strokeLinecap="round" />
          <path d="M100 100 L100 18" stroke="#8C7A6B" strokeWidth="3" strokeLinecap="round" />
          <path d="M104 100 L115 22" stroke="#8C7A6B" strokeWidth="3" strokeLinecap="round" />
          <path d="M110 100 L135 30" stroke="#8C7A6B" strokeWidth="3" strokeLinecap="round" />
          {/* Bottle Neck / Cap */}
          <rect x="88" y="90" width="24" height="16" rx="3" fill="#B8A692" stroke="#9A8874" strokeWidth="1.5" />
          {/* Glass Bottle Body */}
          <rect x="68" y="104" width="64" height="60" rx="10" fill="#F5EFE6" fillOpacity="0.85" stroke="#C8BBA8" strokeWidth="2" />
          {/* Liquid level */}
          <rect x="72" y="122" width="56" height="38" rx="6" fill="#E8D2B8" opacity="0.7" />
          {/* Label */}
          <rect x="76" y="116" width="48" height="32" rx="3" fill="#FAF6F0" stroke="#D8C8B4" strokeWidth="1" />
          <text x="100" y="130" textAnchor="middle" fontSize="6" fontFamily="Georgia, serif" fill="#38271D" fontWeight="bold">SOLÍSTICA</text>
          <text x="100" y="140" textAnchor="middle" fontSize="5" fontFamily="sans-serif" fill="#7A6A5D">DIFFUSER</text>
        </svg>
      )}

      {category === 'wax-melts' && (
        <svg
          viewBox="0 0 200 200"
          className="relative z-10 w-full h-full text-[#38271D]"
          fill="none"
        >
          {/* Shadow */}
          <ellipse cx="100" cy="165" rx="58" ry="12" fill="#D4C7B5" opacity="0.6" />
          {/* Clamshell Plastic Container */}
          <rect x="48" y="45" width="104" height="110" rx="12" fill="#FAF6F0" fillOpacity="0.9" stroke="#C8BBA8" strokeWidth="2" />
          {/* 6 Wax Cubes */}
          <rect x="58" y="55" width="38" height="28" rx="6" fill="#F0DCBA" stroke="#D8C4A0" strokeWidth="1" />
          <rect x="104" y="55" width="38" height="28" rx="6" fill="#F0DCBA" stroke="#D8C4A0" strokeWidth="1" />
          <rect x="58" y="89" width="38" height="28" rx="6" fill="#E8CEA8" stroke="#D0B690" strokeWidth="1" />
          <rect x="104" y="89" width="38" height="28" rx="6" fill="#E8CEA8" stroke="#D0B690" strokeWidth="1" />
          <rect x="58" y="123" width="38" height="24" rx="6" fill="#DFC298" stroke="#C8AA80" strokeWidth="1" />
          <rect x="104" y="123" width="38" height="24" rx="6" fill="#DFC298" stroke="#C8AA80" strokeWidth="1" />
          {/* Center Label / Stamp */}
          <circle cx="100" cy="103" r="18" fill="#FAF6F0" stroke="#C45A37" strokeWidth="1" />
          <text x="100" y="101" textAnchor="middle" fontSize="5" fontFamily="Georgia, serif" fill="#38271D" fontWeight="bold">WAX</text>
          <text x="100" y="108" textAnchor="middle" fontSize="4" fontFamily="sans-serif" fill="#C45A37" fontWeight="bold">MELTS</text>
        </svg>
      )}

      {category === 'quemadores' && (
        <svg
          viewBox="0 0 200 200"
          className="relative z-10 w-full h-full text-[#38271D]"
          fill="none"
        >
          {/* Shadow */}
          <ellipse cx="100" cy="168" rx="50" ry="12" fill="#D4C7B5" opacity="0.6" />
          {/* Ceramic Burner Body */}
          <path d="M68 80 C62 110, 60 145, 68 160 H132 C140 145, 138 110, 132 80 Z" fill="#E8DACB" stroke="#C4B4A2" strokeWidth="2" />
          {/* Top Dish */}
          <ellipse cx="100" cy="78" rx="36" ry="12" fill="#DCCBBB" stroke="#BCA896" strokeWidth="2" />
          <ellipse cx="100" cy="76" rx="28" ry="8" fill="#C8B3A0" />
          {/* Center Arch Cutout for Tealight */}
          <path d="M82 160 A18 22 0 0 1 118 160 Z" fill="#38271D" opacity="0.8" />
          {/* Tealight Candle inside */}
          <rect x="88" y="148" width="24" height="12" rx="2" fill="#FAF6F0" />
          <circle cx="100" cy="142" r="8" fill="#FAD082" opacity="0.7" />
          <path d="M100 136 C102 140, 103 143, 100 146 C97 143, 98 140, 100 136 Z" fill="#E86A33" />
        </svg>
      )}

      {category === 'packs' && (
        <svg
          viewBox="0 0 200 200"
          className="relative z-10 w-full h-full text-[#38271D]"
          fill="none"
        >
          {/* Shadow */}
          <ellipse cx="100" cy="168" rx="60" ry="12" fill="#D4C7B5" opacity="0.6" />
          {/* Wooden / Craft Gift Box Frame */}
          <rect x="42" y="55" width="116" height="108" rx="10" fill="#D8C4A8" stroke="#B8A488" strokeWidth="2" />
          <rect x="48" y="61" width="104" height="96" rx="6" fill="#EFE5D5" />
          {/* Candle inside box */}
          <rect x="58" y="88" width="38" height="58" rx="6" fill="#FAF6F0" stroke="#C8BBA8" strokeWidth="1" />
          <circle cx="77" cy="80" r="6" fill="#FAD082" opacity="0.6" />
          <path d="M77 75 C78 78, 79 80, 77 82 C75 80, 76 78, 77 75 Z" fill="#E86A33" />
          {/* Diffuser inside box */}
          <rect x="106" y="98" width="34" height="48" rx="6" fill="#FAF6F0" stroke="#C8BBA8" strokeWidth="1" />
          <path d="M123 98 L123 60" stroke="#8C7A6B" strokeWidth="2" strokeLinecap="round" />
          <path d="M123 98 L113 62" stroke="#8C7A6B" strokeWidth="2" strokeLinecap="round" />
          <path d="M123 98 L133 62" stroke="#8C7A6B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}

      {category === 'regalarte' && (
        <svg
          viewBox="0 0 200 200"
          className="relative z-10 w-full h-full text-[#38271D]"
          fill="none"
        >
          {/* Shadow */}
          <ellipse cx="100" cy="168" rx="55" ry="12" fill="#D4C7B5" opacity="0.6" />
          {/* Gift Box Base */}
          <rect x="52" y="80" width="96" height="82" rx="8" fill="#CBB69D" stroke="#A8937A" strokeWidth="2" />
          {/* Lid */}
          <rect x="46" y="68" width="108" height="18" rx="5" fill="#BF9F80" stroke="#A8937A" strokeWidth="2" />
          {/* Satin Ribbon Vertical */}
          <rect x="92" y="68" width="16" height="94" fill="#FAF6F0" opacity="0.9" />
          {/* Satin Ribbon Bow */}
          <path d="M100 68 C80 50, 65 65, 92 68 Z" fill="#FAF6F0" />
          <path d="M100 68 C120 50, 135 65, 108 68 Z" fill="#FAF6F0" />
          <circle cx="100" cy="68" r="5" fill="#FAF6F0" />
        </svg>
      )}
    </div>
  )
}

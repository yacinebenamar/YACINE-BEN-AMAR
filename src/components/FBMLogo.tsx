import React from 'react';

interface FBMLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function FBMLogo({ className = '', size = 'md' }: FBMLogoProps) {
  // Dimensions based on size
  const dimensions = {
    sm: { width: 'w-24', logoHeight: 36 },
    md: { width: 'w-48', logoHeight: 64 },
    lg: { width: 'w-64', logoHeight: 88 },
    xl: { width: 'w-80', logoHeight: 110 }
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* SVG Container for the high-end vector recreation of the FBM logo */}
      <svg 
        viewBox="0 0 500 280" 
        className={`${dimensions.width} h-auto filter drop-shadow-md`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rounded Green Diamond (rotated 45deg) - Hex: #76BC21 */}
        {/* We can construct it using a path or group with transform */}
        <g transform="translate(185, 120) rotate(45)">
          <rect 
            x="-65" 
            y="-65" 
            width="130" 
            height="130" 
            rx="28" 
            fill="#76BC21" 
            className="transition-all duration-300 hover:fill-[#8ad12e]"
          />
        </g>

        {/* The capital Letter 'F' inside the green diamond */}
        {/* White, bold sans-serif block letter */}
        <path 
          d="M152 78 H204 V96 H169 V113 H196 V131 H169 V164 H152 V78 Z" 
          fill="white" 
          stroke="white"
          strokeWidth="1.5"
        />

        {/* Stylized 'B' and 'm' letters on the right */}
        {/* 'B' element */}
        <path 
          d="M215 106 H256 C272 106 280 113 280 123 C280 131 273 137 262 139 C275 141 282 147 282 159 C282 171 271 178 253 178 H215 V106 Z M233 120 V134 H250 C258 134 262 131 262 127 C262 123 258 120 250 120 H233 Z M233 148 V164 H251 C259 164 264 160 264 156 C264 152 259 148 251 148 H233 Z" 
          fill="white"
        />

        {/* 'm' element - stylized with modern industrial arcs */}
        <path 
          d="M293 115 H310 V124 C314 117 323 113 333 113 C344 113 351 119 353 127 C359 117 368 113 379 113 C395 113 403 123 403 142 V178 H386 V145 C386 134 382 129 374 129 C366 129 361 134 361 145 V178 H344 V145 C344 134 340 129 332 129 C324 129 319 134 319 145 V178 H293 V115 Z" 
          fill="white"
        />

        {/* Text Line 1: LES FRÈRES BEN AMAR */}
        {/* 'LES FRÈRES' in bright green #76BC21 */}
        <text 
          x="105" 
          y="230" 
          fontFamily="'Cairo', 'Inter', sans-serif" 
          fontWeight="900" 
          fontSize="36" 
          fill="#76BC21" 
          letterSpacing="1.5"
        >
          LES FRÈRES
        </text>

        {/* 'BEN AMAR' in pure white */}
        <text 
          x="285" 
          y="230" 
          fontFamily="'Cairo', 'Inter', sans-serif" 
          fontWeight="900" 
          fontSize="36" 
          fill="white" 
          letterSpacing="1.5"
        >
          BEN AMAR
        </text>

        {/* Text Line 2: LA QUALITÉ ET LA PERFORMANCE */}
        <text 
          x="250" 
          y="262" 
          fontFamily="'Cairo', 'Inter', sans-serif" 
          fontWeight="700" 
          fontSize="15" 
          fill="white" 
          opacity="0.8"
          letterSpacing="5"
          textAnchor="middle"
        >
          LA QUALITÉ ET LA PERFORMANCE
        </text>
      </svg>
    </div>
  );
}

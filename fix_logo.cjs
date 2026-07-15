const fs = require('fs');
const file = 'src/components/FBMLogo.tsx';
let code = `import React from 'react';

interface FBMLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function FBMLogo({ className = '', size = 'md', showText = false }: FBMLogoProps) {
  const dimensions = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-16',
    xl: 'h-24',
  }[size];

  return (
    <div className={\`flex flex-col items-center justify-center select-none \${className}\`}>
      <div className={\`relative \${dimensions} flex items-center justify-center\`}>
        <svg viewBox="0 0 120 120" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Green Diamond */}
          <rect x="15" y="60" width="85" height="85" rx="12" transform="rotate(-45 15 60)" fill="#8CC63F" />
          
          {/* FBM Text inside diamond */}
          <text 
            x="60" 
            y="68" 
            fontFamily="Inter, system-ui, sans-serif" 
            fontSize="32" 
            fontWeight="900" 
            fill="#ffffff" 
            textAnchor="middle" 
            letterSpacing="2"
          >
            FBM
          </text>
        </svg>
      </div>
      {showText && (
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center gap-2 font-sans font-black text-xl tracking-tight">
            <span className="text-fbm-green">FBM</span>
            <span className="text-fbm-blue dark:text-white">ERP</span>
          </div>
          <div className="text-[9px] font-sans tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase mt-1">
            Les Frères Ben Amar
          </div>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync(file, code);

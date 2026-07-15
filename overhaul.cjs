const fs = require('fs');

// 1. TAILWIND CONFIG
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fbm: {
          blue: '#060A24',
          'blue-card': '#0B1238',
          'blue-border': '#161F54',
          green: '#8CC63F',
          'green-hover': '#7DB038',
          light: '#F4F6FB',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'soft-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}`;
fs.writeFileSync('tailwind.config.js', tailwindConfig);

// 2. INDEX.HTML
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<link href="https:\/\/fonts.googleapis.com\/css2\?family=[^"]+" rel="stylesheet" \/>/, '<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet" />');
html = html.replace(/<body[^>]+>/, '<body class="bg-fbm-light dark:bg-fbm-blue text-slate-900 dark:text-white font-sans antialiased selection:bg-fbm-green/30">');
fs.writeFileSync('index.html', html);

// 3. INDEX.CSS
let css = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply transition-colors duration-200;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  @apply bg-slate-300 dark:bg-fbm-blue-border rounded-full;
}
::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-400 dark:bg-slate-600;
}
`;
fs.writeFileSync('src/index.css', css);

// 4. LOGO
const logoCode = `import React from 'react';

interface FBMLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function FBMLogo({ className = '', size = 'md' }: FBMLogoProps) {
  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  }[size];

  return (
    <div className={\`flex flex-col items-center justify-center select-none \${className}\`}>
      <div className={\`relative \${dimensions} flex items-center justify-center\`}>
        <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Green Diamond for F */}
          <rect x="20" y="60" width="56" height="56" rx="8" transform="rotate(-45 20 60)" fill="#8CC63F" />
          {/* The F cut out */}
          <path d="M 45 40 L 70 40 L 70 50 L 55 50 L 55 60 L 65 60 L 65 70 L 55 70 L 55 85 L 45 85 Z" fill="#ffffff" />
          {/* The B and M - stylized */}
          <path d="M 75 40 C 90 40 95 45 95 52.5 C 95 57 90 60 85 60 C 95 60 100 65 100 72.5 C 100 80 90 85 75 85 L 75 40 Z" className="fill-fbm-blue dark:fill-white" />
          <path d="M 105 50 C 112 50 115 55 115 62.5 L 115 85 L 105 85 L 105 65 C 105 60 100 60 100 60 L 100 85 L 90 85 L 90 50 L 115 50 Z" className="fill-fbm-blue dark:fill-white" />
        </svg>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/FBMLogo.tsx', logoCode);

console.log("Basic config updated.");

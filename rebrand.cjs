const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('family=Cairo:wght@400;500;600;700;800', 'family=Readex+Pro:wght@300;400;500;600;700');
html = html.replace('font-cairo', 'font-sans');
html = html.replace(/bg-slate-50 dark:bg-\[\#00041D\]/g, 'bg-slate-50 dark:bg-zinc-950');
html = html.replace(/background-color: \#00041D/g, 'background-color: #09090b');
fs.writeFileSync('index.html', html);

// 2. Update tailwind.config.js
let tailwind = fs.readFileSync('tailwind.config.js', 'utf8');
tailwind = tailwind.replace(
  /fontFamily: \{\s*cairo: \['Cairo', 'sans-serif'\],\s*\}/,
  "fontFamily: { sans: ['Readex Pro', 'sans-serif'] }"
);
fs.writeFileSync('tailwind.config.js', tailwind);

// 3. Update CSS
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/rgba\(0, 8, 57,/g, 'rgba(9, 9, 11,'); // zinc-950
css = css.replace(/rgba\(5, 14, 70,/g, 'rgba(24, 24, 27,'); // zinc-900
fs.writeFileSync('src/index.css', css);

// 4. Update all components
const components = [
  'src/App.tsx',
  'src/components/AdminDashboard.tsx',
  'src/components/WorkerDashboard.tsx',
  'src/components/SmartLogin.tsx',
  'src/components/FBMLogo.tsx'
];

const replaceMap = [
  { p: /bg-\[\#00041D\]/g, r: 'bg-zinc-950' },
  { p: /bg-\[\#020B2D\]/g, r: 'bg-zinc-900' },
  { p: /bg-\[\#050E46\]/g, r: 'bg-zinc-900' },
  { p: /bg-\[\#07113A\]/g, r: 'bg-zinc-900' },
  { p: /bg-\[\#000839\]/g, r: 'bg-zinc-950' },
  { p: /dark:bg-slate-900/g, r: 'dark:bg-zinc-900' },
  { p: /dark:bg-slate-800/g, r: 'dark:bg-zinc-800' },
  { p: /border-slate-800/g, r: 'border-white/10' },
  { p: /border-slate-700/g, r: 'border-white/10' },
  { p: /dark:border-slate-800/g, r: 'dark:border-white/10' },
  { p: /dark:border-slate-700/g, r: 'dark:border-white/10' },
  { p: /text-slate-900/g, r: 'text-zinc-900' },
  { p: /text-slate-800/g, r: 'text-zinc-800' },
  { p: /text-slate-500/g, r: 'text-zinc-500' },
  { p: /text-slate-400/g, r: 'text-zinc-400' },
  { p: /text-slate-300/g, r: 'text-zinc-300' },
  { p: /dark:text-white/g, r: 'dark:text-zinc-50' },
  { p: /dark:hover:bg-\[\#000839\]/g, r: 'dark:hover:bg-zinc-800' },
  { p: /text-\[\#000839\]/g, r: 'text-zinc-950' },
  { p: /border-\[\#000839\]/g, r: 'border-zinc-950' },
  { p: /shadow-\[\#00041D\]/g, r: 'shadow-zinc-950' },
];

components.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    replaceMap.forEach(({ p, r }) => {
      content = content.replace(p, r);
    });
    // Global font fixes
    content = content.replace(/font-cairo/g, 'font-sans');
    fs.writeFileSync(file, content);
    console.log("Processed", file);
  }
});

const fs = require('fs');

const cleanComponent = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Remove ambient glowing orbs
  code = code.replace(/\{\/\* Ambient glowing orbs[^\}]*\/\}\n\s*<div className="absolute top-\[-10%\][^>]*\/>\n\s*<div className="absolute bottom-\[-10%\][^>]*\/>/g, '');
  code = code.replace(/\{\/\* Background glow \*\/\}\n\s*<div className="absolute top-1\/2[^>]*\/>/g, '');
  
  // Clean up backgrounds
  code = code.replace(/bg-slate-50 dark:bg-\[\#00041D\]/g, 'bg-slate-50 dark:bg-zinc-950');
  code = code.replace(/bg-white\/60 dark:bg-\[\#020B2D\]\/60 backdrop-blur-3xl/g, 'bg-white dark:bg-zinc-900');
  code = code.replace(/bg-white\/80 dark:bg-\[\#020B2D\]\/80 backdrop-blur-2xl/g, 'bg-white dark:bg-zinc-900');
  code = code.replace(/bg-white\/90 dark:bg-\[\#020B2D\]\/90 backdrop-blur-2xl/g, 'bg-white dark:bg-zinc-900');
  
  // Remove shadows that are too much
  code = code.replace(/shadow-xl shadow-slate-200\/20 dark:shadow-none/g, 'shadow-sm');
  code = code.replace(/shadow-\[0_-10px_40px_rgba\(0,0,0,0\.05\)\]/g, 'shadow-md');
  code = code.replace(/shadow-2xl shadow-slate-300\/30 dark:shadow-\[\#00041D\]/g, 'shadow-xl');

  // Clean up cards
  code = code.replace(/bg-white dark:bg-\[\#07113A\]\/50 dark:backdrop-blur-xl/g, 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-2xl');
  code = code.replace(/bg-white dark:bg-zinc-900\/50/g, 'bg-white dark:bg-zinc-900');

  // FBM Green to a more professional emerald/green
  // Actually the user might like the original brand green, but let's make it look better
  // Just ensure we don't have too many gradients
  code = code.replace(/bg-gradient-to-r from-\[\#76BC21\]\/10 to-transparent/g, 'bg-[#76BC21]/10');
  
  // Ensure the body has no inline styles overriding Tailwind
  
  fs.writeFileSync(filePath, code);
  console.log("Cleaned up", filePath);
}

cleanComponent('src/components/AdminDashboard.tsx');
cleanComponent('src/components/WorkerDashboard.tsx');
cleanComponent('src/components/SmartLogin.tsx');
cleanComponent('src/App.tsx');

// Fix index.html body inline style
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/style="background-color: \#[^"]+"/g, '');
html = html.replace(/<body class="[^"]+"/g, '<body class="bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 font-sans antialiased">');
fs.writeFileSync('index.html', html);


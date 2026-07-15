const fs = require('fs');

const refineComponent = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Remove the grid pattern
  code = code.replace(/<div\s+className="absolute inset-0 z-0 opacity-10 pointer-events-none"\s+style=\{\{[^}]+\}\}\s*\/>/g, '');

  // Simplify rounded corners
  code = code.replace(/rounded-\[2rem\]/g, 'rounded-2xl');
  code = code.replace(/rounded-3xl/g, 'rounded-2xl');

  // Simplify backgrounds and borders
  code = code.replace(/bg-\[\#f8fafc\]\/80/g, 'bg-white');
  code = code.replace(/bg-\[\#f8fafc\]/g, 'bg-white');
  code = code.replace(/dark:bg-zinc-950\/80/g, 'dark:bg-zinc-900');
  
  // Make borders elegant
  code = code.replace(/border-slate-300\/80/g, 'border-slate-200');
  code = code.replace(/dark:border-white\/10\/80/g, 'dark:border-white/5');
  code = code.replace(/border border-slate-200/g, 'border border-slate-200/60');
  
  // Remove extreme shadows
  code = code.replace(/shadow-2xl/g, 'shadow-sm');
  code = code.replace(/shadow-xl/g, 'shadow-sm');
  code = code.replace(/shadow-\[0_0_15px_rgba[^\]]+\]/g, 'shadow-sm');
  code = code.replace(/shadow-\[0_0_5px_#76BC21\]/g, 'shadow-sm');

  // Fix button styles to be more corporate
  code = code.replace(/border border-\[\#76BC21\]\/50 hover:bg-\[\#76BC21\]\/10 text-\[\#76BC21\] font-bold py-3 px-4/g, 
    'bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-medium py-2.5 px-4');
  
  // FBM colors to elegant versions
  // Keep the brand color where necessary, but use it sparingly
  
  fs.writeFileSync(filePath, code);
  console.log("Refined", filePath);
}

refineComponent('src/components/AdminDashboard.tsx');
refineComponent('src/components/WorkerDashboard.tsx');
refineComponent('src/components/SmartLogin.tsx');


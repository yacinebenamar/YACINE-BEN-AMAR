const fs = require('fs');

const fix = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace colors
  code = code.replace(/bg-slate-50 dark:bg-zinc-950/g, 'bg-fbm-light dark:bg-fbm-blue');
  code = code.replace(/bg-white dark:bg-zinc-900/g, 'bg-white dark:bg-fbm-blue-card');
  code = code.replace(/bg-white dark:bg-zinc-950/g, 'bg-white dark:bg-fbm-blue');
  
  code = code.replace(/border-slate-200\/80 dark:border-zinc-800\/80/g, 'border-slate-200 dark:border-fbm-blue-border');
  code = code.replace(/border-slate-200 dark:border-zinc-800/g, 'border-slate-200 dark:border-fbm-blue-border');
  code = code.replace(/border-slate-200 dark:border-white\/5/g, 'border-slate-200 dark:border-fbm-blue-border');
  
  code = code.replace(/text-zinc-900 dark:text-zinc-50/g, 'text-slate-900 dark:text-white');
  code = code.replace(/text-zinc-500 dark:text-zinc-400/g, 'text-slate-500 dark:text-slate-400');
  
  // Specific FBM Green brand colors
  code = code.replace(/text-\[\#76BC21\]/g, 'text-fbm-green');
  code = code.replace(/bg-\[\#76BC21\]/g, 'bg-fbm-green hover:bg-fbm-green-hover text-white dark:text-fbm-blue');
  code = code.replace(/border-\[\#76BC21\]/g, 'border-fbm-green');
  
  code = code.replace(/hover:border-zinc-700/g, 'hover:border-fbm-blue-border');
  code = code.replace(/hover:bg-zinc-800/g, 'hover:bg-fbm-blue-border');
  
  fs.writeFileSync(filePath, code);
  console.log("Updated", filePath);
};

fix('src/components/AdminDashboard.tsx');
fix('src/components/WorkerDashboard.tsx');
fix('src/components/SmartLogin.tsx');
fix('src/App.tsx');

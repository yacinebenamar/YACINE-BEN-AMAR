const fs = require('fs');

const fix = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  code = code.replace(/bg-zinc-950/g, 'bg-fbm-blue');
  code = code.replace(/bg-zinc-900/g, 'bg-fbm-blue-card');
  code = code.replace(/bg-zinc-800/g, 'bg-fbm-blue-border');
  
  code = code.replace(/border-zinc-800/g, 'border-fbm-blue-border');
  code = code.replace(/border-zinc-900/g, 'border-fbm-blue-border');
  
  code = code.replace(/text-zinc-900/g, 'text-slate-900');
  code = code.replace(/text-zinc-800/g, 'text-slate-800');
  code = code.replace(/text-zinc-700/g, 'text-slate-700');
  code = code.replace(/text-zinc-600/g, 'text-slate-600');
  code = code.replace(/text-zinc-500/g, 'text-slate-500');
  code = code.replace(/text-zinc-400/g, 'text-slate-400');
  code = code.replace(/text-zinc-300/g, 'text-slate-300');
  code = code.replace(/text-zinc-200/g, 'text-slate-200');
  code = code.replace(/text-zinc-100/g, 'text-slate-100');
  code = code.replace(/text-zinc-50/g, 'text-white');
  
  fs.writeFileSync(filePath, code);
  console.log("Updated", filePath);
};

fix('src/components/AdminDashboard.tsx');
fix('src/components/WorkerDashboard.tsx');
fix('src/components/SmartLogin.tsx');
fix('src/App.tsx');

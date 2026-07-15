const fs = require('fs');

const fix = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix up specific issues
  code = code.replace(/text-zinc-950/g, 'text-slate-900');
  
  // Make the logo look beautiful on mobile
  code = code.replace(/bg-white\/80 dark:bg-fbm-blue-card\/80  border-b border-slate-100 dark:border-fbm-blue-border\/50 px-5 pt-8 pb-5 flex flex-col z-40 sticky top-0 shadow-sm/g, 'bg-white dark:bg-fbm-blue-card border-b border-slate-200 dark:border-fbm-blue-border px-5 pt-10 pb-6 flex flex-col z-40 sticky top-0 shadow-sm');
  
  fs.writeFileSync(filePath, code);
  console.log("Updated", filePath);
};

fix('src/components/AdminDashboard.tsx');
fix('src/components/WorkerDashboard.tsx');

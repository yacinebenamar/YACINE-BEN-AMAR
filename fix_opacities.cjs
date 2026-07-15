const fs = require('fs');

const files = [
  'src/App.tsx',
  'src/components/AdminDashboard.tsx',
  'src/components/WorkerDashboard.tsx',
  'src/components/SmartLogin.tsx',
  'src/components/TaskSignatureModal.tsx',
  'src/components/ConfirmModal.tsx',
  'src/components/EmptyState.tsx',
  'src/components/NotificationPopover.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix things like bg-slate-100/ dark:bg-slate-900/60 -> bg-slate-100/60 dark:bg-slate-900/60
    content = content.replace(/bg-\[\#f8fafc\]\/\s*dark:bg-\[\#000839\]\/(\d+)/g, 'bg-[#f8fafc]/$1 dark:bg-[#000839]/$1');
    content = content.replace(/bg-white\/\s*dark:bg-\[\#050E46\]\/(\d+)/g, 'bg-white/$1 dark:bg-[#050E46]/$1');
    content = content.replace(/text-slate-900\/\s*dark:text-white\/(\d+)/g, 'text-slate-900/$1 dark:text-white/$1');
    content = content.replace(/border-slate-200\/\s*dark:border-slate-800\/(\d+)/g, 'border-slate-200/$1 dark:border-slate-800/$1');
    content = content.replace(/border-slate-300\/\s*dark:border-slate-700\/(\d+)/g, 'border-slate-300/$1 dark:border-slate-700/$1');
    content = content.replace(/bg-slate-100\/\s*dark:bg-slate-900\/(\d+)/g, 'bg-slate-100/$1 dark:bg-slate-900/$1');
    content = content.replace(/bg-slate-200\/\s*dark:bg-slate-800\/(\d+)/g, 'bg-slate-200/$1 dark:bg-slate-800/$1');
    content = content.replace(/bg-slate-300\/\s*dark:bg-slate-700\/(\d+)/g, 'bg-slate-300/$1 dark:bg-slate-700/$1');
    
    // Also fix hover:bg-[#f8fafc] dark:bg-[#000839] -> it should probably be hover:bg-[#f8fafc] dark:hover:bg-[#000839]
    content = content.replace(/hover:bg-\[\#f8fafc\] dark:bg-\[\#000839\]/g, 'hover:bg-[#f8fafc] dark:hover:bg-[#000839]');
    content = content.replace(/hover:bg-white dark:bg-\[\#050E46\]/g, 'hover:bg-white dark:hover:bg-[#050E46]');
    content = content.replace(/hover:text-slate-900 dark:text-white/g, 'hover:text-slate-900 dark:hover:text-white');
    content = content.replace(/hover:text-slate-500 dark:text-slate-400/g, 'hover:text-slate-500 dark:hover:text-slate-400');
    content = content.replace(/hover:text-slate-600 dark:text-slate-300/g, 'hover:text-slate-600 dark:hover:text-slate-300');
    content = content.replace(/hover:border-slate-200 dark:border-slate-800/g, 'hover:border-slate-200 dark:hover:border-slate-800');
    content = content.replace(/hover:border-slate-300 dark:border-slate-700/g, 'hover:border-slate-300 dark:hover:border-slate-700');
    content = content.replace(/hover:bg-slate-100 dark:bg-slate-900/g, 'hover:bg-slate-100 dark:hover:bg-slate-900');
    content = content.replace(/hover:bg-slate-200 dark:bg-slate-800/g, 'hover:bg-slate-200 dark:hover:bg-slate-800');
    content = content.replace(/hover:bg-slate-300 dark:bg-slate-700/g, 'hover:bg-slate-300 dark:hover:bg-slate-700');

    // Also fix any focus variants if needed (but hover is most common)
    content = content.replace(/focus:bg-\[\#f8fafc\] dark:bg-\[\#000839\]/g, 'focus:bg-[#f8fafc] dark:focus:bg-[#000839]');
    content = content.replace(/focus:border-slate-200 dark:border-slate-800/g, 'focus:border-slate-200 dark:focus:border-slate-800');
    content = content.replace(/focus:border-slate-300 dark:border-slate-700/g, 'focus:border-slate-300 dark:focus:border-slate-700');
    
    fs.writeFileSync(file, content);
  }
});

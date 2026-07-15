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

const replaceMap = [
  { pattern: /bg-\[\#000839\](?!\/)/g, replacement: 'bg-[#f8fafc] dark:bg-[#000839]' },
  { pattern: /bg-\[\#000839\]\//g, replacement: 'bg-[#f8fafc]/ dark:bg-[#000839]/' },
  { pattern: /bg-\[\#050E46\](?!\/)/g, replacement: 'bg-white dark:bg-[#050E46]' },
  { pattern: /bg-\[\#050E46\]\//g, replacement: 'bg-white/ dark:bg-[#050E46]/' },
  { pattern: /text-white(?!\/)/g, replacement: 'text-slate-900 dark:text-white' },
  { pattern: /text-white\//g, replacement: 'text-slate-900/ dark:text-white/' },
  { pattern: /text-slate-400(?!\/)/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { pattern: /text-slate-300(?!\/)/g, replacement: 'text-slate-600 dark:text-slate-300' },
  { pattern: /border-slate-800(?!\/)/g, replacement: 'border-slate-200 dark:border-slate-800' },
  { pattern: /border-slate-800\//g, replacement: 'border-slate-200/ dark:border-slate-800/' },
  { pattern: /border-slate-700(?!\/)/g, replacement: 'border-slate-300 dark:border-slate-700' },
  { pattern: /border-slate-700\//g, replacement: 'border-slate-300/ dark:border-slate-700/' },
  { pattern: /bg-slate-900(?!\/)/g, replacement: 'bg-slate-100 dark:bg-slate-900' },
  { pattern: /bg-slate-900\//g, replacement: 'bg-slate-100/ dark:bg-slate-900/' },
  { pattern: /bg-slate-800(?!\/)/g, replacement: 'bg-slate-200 dark:bg-slate-800' },
  { pattern: /bg-slate-800\//g, replacement: 'bg-slate-200/ dark:bg-slate-800/' },
  { pattern: /bg-slate-700(?!\/)/g, replacement: 'bg-slate-300 dark:bg-slate-700' },
  { pattern: /bg-slate-700\//g, replacement: 'bg-slate-300/ dark:bg-slate-700/' },
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    replaceMap.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });
    fs.writeFileSync(file, content);
    console.log("Processed " + file);
  }
});

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
    
    // Any solid bg color like bg-red-500, bg-blue-600, bg-indigo-600 with text-slate-900 dark:text-white should just be text-white
    content = content.replace(/bg-red-(\d+)([^"']*)text-slate-900 dark:text-white/g, 'bg-red-$1$2text-white');
    content = content.replace(/bg-red-(\d+)([^"']*)hover:text-slate-900 dark:text-white/g, 'bg-red-$1$2hover:text-white');
    
    content = content.replace(/bg-[#76BC21]([^"']*)text-slate-900 dark:text-white/g, 'bg-[#76BC21]$1text-white');
    content = content.replace(/bg-blue-(\d+)([^"']*)text-slate-900 dark:text-white/g, 'bg-blue-$1$2text-white');
    content = content.replace(/bg-indigo-(\d+)([^"']*)text-slate-900 dark:text-white/g, 'bg-indigo-$1$2text-white');
    
    fs.writeFileSync(file, content);
  }
});

const fs = require('fs');

function upgradeCards(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');

    // Make all cards have a bit more padding and softer styling
    code = code.replace(/bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white\/5 rounded-2xl p-4/g, 
      'bg-white dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors');
    
    code = code.replace(/bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white\/5 rounded-2xl p-6/g, 
      'bg-white dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80 rounded-3xl p-7 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors');

    // Upgrade buttons
    code = code.replace(/bg-\[\#76BC21\] hover:bg-\[\#62a118\] text-zinc-950 font-bold/g, 
      'bg-[#76BC21] hover:bg-[#68A71D] text-[#000839] font-semibold tracking-wide');
      
    // Text changes
    code = code.replace(/font-black/g, 'font-bold');

    // Remove harsh borders on mobile header
    code = code.replace(/border-b border-slate-200\/50 dark:border-white\/10\/50/g, 'border-b border-slate-100 dark:border-zinc-800/50');
    
    fs.writeFileSync(file, code);
    console.log("Upgraded", file);
}

upgradeCards('src/components/AdminDashboard.tsx');
upgradeCards('src/components/WorkerDashboard.tsx');


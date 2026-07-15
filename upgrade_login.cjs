const fs = require('fs');

let code = fs.readFileSync('src/components/SmartLogin.tsx', 'utf8');

// Change amber-500 to #76BC21
code = code.replace(/amber-500/g, '[#76BC21]');

// Clean up background
code = code.replace(/bg-white\/80 dark:bg-zinc-900\/80  py-6 px-4 sm:px-6 shadow-sm rounded-2xl border border-slate-200\/50 dark:border-zinc-800\/50/g, 'bg-white dark:bg-zinc-900 py-8 px-6 sm:px-8 shadow-sm rounded-3xl border border-slate-200/80 dark:border-zinc-800/80');

// Make input fields look amazing
code = code.replace(/focus:ring-2 focus:ring-amber-500\/20 focus:border-amber-500/g, 'focus:ring-4 focus:ring-[#76BC21]/10 focus:border-[#76BC21]');
code = code.replace(/focus:ring-2 focus:ring-\[\#76BC21\]\/20 focus:border-\[\#76BC21\]/g, 'focus:ring-4 focus:ring-[#76BC21]/10 focus:border-[#76BC21]');

fs.writeFileSync('src/components/SmartLogin.tsx', code);
console.log("Upgraded SmartLogin");

const fs = require('fs');

function fix(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');

    code = code.replace(/bg-gradient-to-l from-\[\#050E46\] to-\[\#0a186b\] p-5 shadow-sm text-right">\s*<div className="flex items-start justify-between gap-3">\s*<div>\s*<p className="text-\[10px\] font-bold uppercase tracking-\[0.2em\] text-\[\#76BC21\]">\s*ملخص الشهر الحالي\s*<\/p>\s*<h2 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">/g, 
      'bg-zinc-900 dark:bg-zinc-950 p-5 shadow-sm text-right">\n                <div className="flex items-start justify-between gap-3">\n                  <div>\n                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#76BC21]">\n                      ملخص الشهر الحالي\n                    </p>\n                    <h2 className="mt-2 text-lg font-bold text-white">');

    // And fix the numbers color in the same card
    code = code.replace(/<span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 font-mono">/g, '<span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 font-mono">');

    // Actually, maybe I should just make the card light in light mode and dark in dark mode?
    // Let's replace the bg-gradient entirely.
    code = code.replace(/bg-gradient-to-l from-\[\#050E46\] to-\[\#0a186b\]/g, 'bg-white dark:bg-zinc-900/40');
    
    // There was a button with text-slate-200. Let's fix that.
    code = code.replace(/text-slate-200 transition-all hover:border-slate-300 dark:hover:border-white\/10"/g, 'text-zinc-900 dark:text-white transition-all hover:border-slate-300 dark:hover:border-zinc-700"');

    // Let's also make sure the user's login page is super nice.
    
    fs.writeFileSync(file, code);
    console.log("Fixed colors in", file);
}

fix('src/components/AdminDashboard.tsx');


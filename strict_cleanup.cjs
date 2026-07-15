const fs = require('fs');

function cleanup(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');

    code = code.replace(/border-slate-200\/60\/80/g, 'border-slate-200');
    code = code.replace(/border-slate-200\/60/g, 'border-slate-200');
    code = code.replace(/border-slate-200\/80/g, 'border-slate-200');
    
    code = code.replace(/dark:border-white\/10\/80/g, 'dark:border-white/5');
    code = code.replace(/dark:border-white\/10\/85/g, 'dark:border-white/5');
    code = code.replace(/dark:border-white\/5/g, 'dark:border-zinc-800');
    code = code.replace(/dark:border-white\/10/g, 'dark:border-zinc-800');
    
    code = code.replace(/dark:bg-zinc-900\/60/g, 'dark:bg-zinc-900');
    code = code.replace(/dark:bg-zinc-900\/50/g, 'dark:bg-zinc-900');
    code = code.replace(/dark:bg-zinc-900\/40/g, 'dark:bg-zinc-900');
    
    code = code.replace(/dark:backdrop-blur-xl/g, '');
    code = code.replace(/dark:backdrop-blur-3xl/g, '');
    code = code.replace(/backdrop-blur-3xl/g, '');
    code = code.replace(/backdrop-blur-2xl/g, '');
    code = code.replace(/backdrop-blur-xl/g, '');

    // Refine font
    code = code.replace(/text-slate-600/g, 'text-slate-500');

    fs.writeFileSync(file, code);
    console.log("Strict cleaned", file);
}

cleanup('src/components/AdminDashboard.tsx');
cleanup('src/components/WorkerDashboard.tsx');
cleanup('src/components/SmartLogin.tsx');

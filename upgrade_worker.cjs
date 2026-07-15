const fs = require('fs');

const upgradeWorkerDashboard = () => {
  let code = fs.readFileSync('src/components/WorkerDashboard.tsx', 'utf8');

  code = code.replace(
    /className="min-h-screen bg-\[\#f8fafc\] dark:bg-\[\#000839\] text-slate-900 dark:text-white flex flex-col pb-16 select-none"/,
    'className="min-h-screen bg-slate-50 dark:bg-[#00041D] text-slate-900 dark:text-white flex flex-col pb-16 select-none font-sans transition-colors duration-300 relative overflow-hidden"'
  );

  code = code.replace(
    /return \(\n    <div className="min-h-screen[^"]*">\n/,
    `return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#00041D] text-slate-900 dark:text-white flex flex-col pb-16 select-none font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Ambient glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#76BC21]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
`
  );

  code = code.replace(
    /<div className="bg-white dark:bg-\[\#050E46\] border-b border-slate-200 dark:border-slate-800 p-4 md:p-6 sticky top-0 z-30">/,
    `<div className="bg-white/80 dark:bg-[#020B2D]/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 p-4 md:p-6 sticky top-0 z-40 shadow-sm">`
  );
  
  code = code.replace(
    /<nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-\[\#050E46\] border-t border-slate-200 dark:border-slate-800 z-40 px-2 pb-safe pt-2 flex items-center justify-around shadow-\[0_-4px_20px_rgba\(0,0,0,0\.05\)\]">/g,
    `<nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#020B2D]/90 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 z-50 px-2 pb-safe pt-2 flex items-center justify-around shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">`
  );

  code = code.replace(/bg-white dark:bg-\[\#050E46\]/g, 'bg-white dark:bg-[#07113A]/50 dark:backdrop-blur-xl');
  
  fs.writeFileSync('src/components/WorkerDashboard.tsx', code);
  console.log("Upgraded WorkerDashboard");
}

upgradeWorkerDashboard();

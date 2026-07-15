const fs = require('fs');

const upgradeAdminDashboard = () => {
  let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

  // 1. Upgrade the Root wrapper background
  code = code.replace(
    /className="min-h-screen bg-\[\#f8fafc\] dark:bg-\[\#000839\] text-slate-900 dark:text-white flex flex-col md:flex-row pb-24 md:pb-0"/,
    'className="min-h-screen bg-slate-50 dark:bg-[#00041D] text-slate-900 dark:text-white flex flex-col md:flex-row pb-24 md:pb-0 font-sans transition-colors duration-300 relative overflow-hidden"'
  );

  // 2. Add an ambient background glow to the root (inject right after the root div)
  code = code.replace(
    /return \(\n    <div className="min-h-screen[^"]*">\n/,
    `return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#00041D] text-slate-900 dark:text-white flex flex-col md:flex-row pb-24 md:pb-0 font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Ambient glowing orbs for premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#76BC21]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
`
  );

  // 3. Upgrade Mobile Top Header
  code = code.replace(
    /<div className="md:hidden bg-\[\#f8fafc\] dark:bg-\[\#000839\] border-b border-slate-200\/50 dark:border-slate-800\/50 px-4 pt-6 pb-4 flex flex-col z-40 relative">/,
    `<div className="md:hidden bg-white/80 dark:bg-[#020B2D]/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 px-5 pt-8 pb-5 flex flex-col z-40 sticky top-0 shadow-sm">`
  );

  // 4. Upgrade Desktop Sidebar
  code = code.replace(
    /<div className="hidden md:flex w-64 bg-white dark:bg-\[\#050E46\] border-l border-slate-200 dark:border-slate-800 shrink-0 p-5 flex-col justify-between overflow-y-auto">/,
    `<div className="hidden md:flex w-[280px] bg-white/60 dark:bg-[#020B2D]/60 backdrop-blur-3xl border-l border-slate-200/50 dark:border-slate-800/50 shrink-0 p-6 flex-col justify-between overflow-y-auto z-40 shadow-xl shadow-slate-200/20 dark:shadow-none">`
  );

  // 5. Upgrade Sidebar Buttons (Make them look like Mac OS / Vercel)
  // We need to replace the className of the sidebar buttons.
  code = code.replace(
    /className=\{\`w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all \$\{\n                activeTab === '[^']+'\n                  \? 'bg-\[\#76BC21\]\/10 text-\[\#76BC21\] font-bold border border-\[\#76BC21\]\/30 shadow-sm'\n                  \: 'text-slate-500 dark:text-slate-400 hover:bg-\[\#f8fafc\] dark:hover:bg-\[\#000839\] hover:text-slate-900 dark:hover:text-white border border-transparent'\n              \}\`\}/g,
    (match) => {
      return match
        .replace("'bg-[#76BC21]/10 text-[#76BC21] font-bold border border-[#76BC21]/30 shadow-sm'", "'bg-gradient-to-r from-[#76BC21]/10 to-transparent text-[#76BC21] font-black border-r-4 border-r-[#76BC21] shadow-sm'")
        .replace("'text-slate-500 dark:text-slate-400 hover:bg-[#f8fafc] dark:hover:bg-[#000839] hover:text-slate-900 dark:hover:text-white border border-transparent'", "'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border-r-4 border-transparent'");
    }
  );

  // 6. Fix Mobile Bottom Nav
  code = code.replace(
    /<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-\[\#050E46\] border-t border-slate-200 dark:border-slate-800 z-50 px-2 pb-safe pt-2 flex items-center justify-around shadow-\[0_-4px_20px_rgba\(0,0,0,0\.05\)\]">/g,
    `<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#020B2D]/90 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 z-50 px-2 pb-safe pt-2 flex items-center justify-around shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">`
  );
  
  // Mobile Nav Buttons
  code = code.replace(
    /className=\{\`flex flex-col items-center gap-1 p-2 transition-all \$\{\n              activeTab === '[^']+' \? 'text-\[\#76BC21\] font-bold scale-110' : 'text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'\n            \}\`\}/g,
    (match) => {
      return match
        .replace("'text-[#76BC21] font-bold scale-110'", "'text-[#76BC21] font-black -translate-y-1 drop-shadow-md'")
        .replace("'text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'", "'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:-translate-y-0.5'");
    }
  );

  // 7. Enhance Cards and Panels
  code = code.replace(/bg-white dark:bg-\[\#050E46\]/g, 'bg-white dark:bg-[#07113A]/50 dark:backdrop-blur-xl');
  
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("Upgraded AdminDashboard");
}

upgradeAdminDashboard();

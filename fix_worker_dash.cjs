const fs = require('fs');

const fix = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Same premium header
  code = code.replace(
    /<div className="bg-white dark:bg-fbm-blue-card border-b border-slate-200 dark:border-fbm-blue-border px-5 pt-10 pb-6 flex flex-col z-40 sticky top-0 shadow-sm">[\s\S]*?<div className="mt-4 text-right">/g,
    `
      <div className="bg-white/90 dark:bg-fbm-blue-card/90 backdrop-blur-xl border-b border-slate-200 dark:border-fbm-blue-border px-5 pt-8 pb-5 flex flex-col z-40 sticky top-0 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-fbm-blue-border flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-fbm-blue transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="relative w-10 h-10 rounded-full border border-fbm-green bg-fbm-green/10 flex items-center justify-center font-bold text-sm text-fbm-green font-sans">
              {currentUser.fullName.charAt(0)}
              <span className="absolute bottom-0 -right-0 w-2.5 h-2.5 bg-fbm-green text-white rounded-full border-2 border-white dark:border-fbm-blue-card"></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <FBMLogo size="sm" />
          </div>
        </div>
        <div className="mt-2 text-right">
    `
  );

  fs.writeFileSync(filePath, code);
  console.log("Updated WorkerDashboard layout");
};

fix('src/components/WorkerDashboard.tsx');

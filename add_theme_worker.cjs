const fs = require('fs');

const filePath = 'src/components/WorkerDashboard.tsx';
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes('Sun className')) {
  code = code.replace(
    /\{\/\* Logo brand and quick logout \*\/\}\n          <div className="flex items-center gap-3">/,
    `{/* Logo brand and quick logout */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="تغيير المظهر"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>`
  );
  
  // also add log out button near it? Wait, Worker dashboard already has a logout button in the header? Let's check where `onLogout` is used.
  fs.writeFileSync(filePath, code);
  console.log("Added theme toggle to WorkerDashboard");
}

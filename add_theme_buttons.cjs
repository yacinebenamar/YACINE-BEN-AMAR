const fs = require('fs');

const fixComponent = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Add Moon/Sun to imports if not there
  if (!code.includes('Moon, Sun')) {
    code = code.replace(/import \{([^}]+)\}\s*from\s*['"]lucide-react['"];/, (match, p1) => {
      if (!p1.includes('Moon')) p1 += ', Moon';
      if (!p1.includes('Sun')) p1 += ', Sun';
      return `import { ${p1} } from "lucide-react";`;
    });
  }

  // Inject into AdminDashboard Sidebar
  code = code.replace(
    /<\/nav>\n        <\/div>\n      <\/div>/,
    `</nav>
        </div>
        
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:bg-[#f8fafc] dark:hover:bg-[#000839] hover:text-slate-900 dark:hover:text-white"
          >
            <span>{isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-500/10 hover:text-red-600 mt-2"
          >
            <span>تسجيل الخروج</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>`
  );

  // Inject into AdminDashboard Mobile Header
  code = code.replace(
    /<NotificationPopover\n              notifications=\{notifications\}\n              onUpdateNotifications=\{onUpdateNotifications\}\n              onUpdateNotification=\{onUpdateNotification\}\n              currentUser=\{currentUser\}\n              align="left"\n            \/>/,
    `<NotificationPopover
              notifications={notifications}
              onUpdateNotifications={onUpdateNotifications}
              onUpdateNotification={onUpdateNotification}
              currentUser={currentUser}
              align="left"
            />
            <button
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>`
  );

  fs.writeFileSync(filePath, code);
  console.log("Added theme buttons to", filePath);
}

fixComponent('src/components/AdminDashboard.tsx');
fixComponent('src/components/WorkerDashboard.tsx');

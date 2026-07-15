const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "onToggleViewMode={() => setAdminViewMode((prev) => (prev === 'admin' ? 'worker' : 'admin'))}\\n          onToggleTheme={toggleTheme}\\n          isDarkMode={isDarkMode}\\n          onToggleTheme={toggleTheme}\\n          isDarkMode={isDarkMode}",
  "onToggleViewMode={() => setAdminViewMode((prev) => (prev === 'admin' ? 'worker' : 'admin'))}\\n          onToggleTheme={toggleTheme}\\n          isDarkMode={isDarkMode}"
);

code = code.replace(
  /onToggleViewMode=\{\(\) => setAdminViewMode\(\(prev\) => \(prev === 'admin' \? 'worker' : 'admin'\)\)\}\n          onToggleTheme=\{toggleTheme\}\n          isDarkMode=\{isDarkMode\}\n          onToggleTheme=\{toggleTheme\}\n          isDarkMode=\{isDarkMode\}/,
  "onToggleViewMode={() => setAdminViewMode((prev) => (prev === 'admin' ? 'worker' : 'admin'))}\n          onToggleTheme={toggleTheme}\n          isDarkMode={isDarkMode}"
);

// We need to inject into AdminDashboard which also has onToggleViewMode
code = code.replace(
  /onToggleViewMode=\{\(\) => setAdminViewMode\(\(prev\) => \(prev === 'admin' \? 'worker' : 'admin'\)\)\}\n        \/>/g,
  "onToggleViewMode={() => setAdminViewMode((prev) => (prev === 'admin' ? 'worker' : 'admin'))}\n          onToggleTheme={toggleTheme}\n          isDarkMode={isDarkMode}\n        />"
);


fs.writeFileSync('src/App.tsx', code);

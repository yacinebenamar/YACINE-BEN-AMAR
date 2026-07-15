const fs = require('fs');

const fixComponent = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Add to Interface
  code = code.replace(
    /adminViewMode: 'admin' | 'worker';\n  onToggleViewMode: \(\) => void;/g,
    "adminViewMode: 'admin' | 'worker';\n  onToggleViewMode: () => void;\n  isDarkMode?: boolean;\n  onToggleTheme?: () => void;"
  );

  // Fallback if not matching exactly above
  if (!code.includes('isDarkMode?: boolean;')) {
    code = code.replace(
      /adminViewMode: 'admin' \| 'worker';\n  onToggleViewMode: \(\) => void;/g,
      "adminViewMode: 'admin' | 'worker';\n  onToggleViewMode: () => void;\n  isDarkMode?: boolean;\n  onToggleTheme?: () => void;"
    );
  }

  // Add to destructuring
  code = code.replace(
    /adminViewMode,\n  onToggleViewMode,\n/g,
    "adminViewMode,\n  onToggleViewMode,\n  isDarkMode,\n  onToggleTheme,\n"
  );
  
  fs.writeFileSync(filePath, code);
  console.log("Fixed props in", filePath);
}

fixComponent('src/components/AdminDashboard.tsx');
fixComponent('src/components/WorkerDashboard.tsx');

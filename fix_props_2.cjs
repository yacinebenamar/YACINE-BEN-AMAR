const fs = require('fs');

const fixComponent = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // interface
  code = code.replace(
    /onToggleViewMode\?\: \(\) => void;\n\}/g,
    "onToggleViewMode?: () => void;\n  isDarkMode?: boolean;\n  onToggleTheme?: () => void;\n}"
  );
  
  // WorkerDashboard might not have ? for adminViewMode
  code = code.replace(
    /onToggleViewMode: \(\) => void;\n\}/g,
    "onToggleViewMode: () => void;\n  isDarkMode?: boolean;\n  onToggleTheme?: () => void;\n}"
  );

  // destructuring
  code = code.replace(
    /onToggleViewMode,\n\}: /g,
    "onToggleViewMode,\n  isDarkMode,\n  onToggleTheme,\n}: "
  );
  
  fs.writeFileSync(filePath, code);
  console.log("Fixed props in", filePath);
}

fixComponent('src/components/AdminDashboard.tsx');
fixComponent('src/components/WorkerDashboard.tsx');

const fs = require('fs');

const fixComponent = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // interface
  code = code.replace(
    /onDeleteExpense\?\: \(id: string\) => Promise<void>;\n\}/g,
    "onDeleteExpense?: (id: string) => Promise<void>;\n  isDarkMode?: boolean;\n  onToggleTheme?: () => void;\n}"
  );

  // destructuring
  code = code.replace(
    /onToggleViewMode,\n  onDeleteExpense,\n\}:/g,
    "onToggleViewMode,\n  onDeleteExpense,\n  isDarkMode,\n  onToggleTheme,\n}:"
  );
  
  fs.writeFileSync(filePath, code);
  console.log("Fixed props in", filePath);
}

fixComponent('src/components/WorkerDashboard.tsx');

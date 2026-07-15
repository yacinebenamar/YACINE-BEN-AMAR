const fs = require('fs');

const fix = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  code = code.replace(/onClick=\{\(\) => setIsDarkMode\(!isDarkMode\)\}/g, 'onClick={onToggleTheme}');

  fs.writeFileSync(filePath, code);
  console.log("Updated", filePath);
};

fix('src/components/AdminDashboard.tsx');
fix('src/components/WorkerDashboard.tsx');

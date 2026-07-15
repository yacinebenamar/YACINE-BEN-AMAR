const fs = require('fs');

const fixComponent = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/,, Moon/g, ', Moon');
  code = code.replace(/,, Sun/g, ', Sun');
  fs.writeFileSync(filePath, code);
}

fixComponent('src/components/AdminDashboard.tsx');
fixComponent('src/components/WorkerDashboard.tsx');

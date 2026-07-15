const fs = require('fs');

const check = (file) => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  console.log(`\n--- ${file} ---`);
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('fixed bottom-0')) {
      console.log(`Line ${i+1}: ${line.trim()}`);
    }
  });
};

check('src/components/AdminDashboard.tsx');
check('src/components/WorkerDashboard.tsx');
check('src/App.tsx');

const fs = require('fs');

const fix = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Find all instances of this long messy string and replace with clean tailwind classes
  code = code.replace(/bg-fbm-green hover:bg-fbm-green-hover text-white dark:text-fbm-blue(\/[0-9]+)?( hover:bg-\[#[0-9a-fA-F]+\] text-\[[0-9a-fA-F#]+\]| hover:bg-\[#[0-9a-fA-F]+\] text-zinc-950| hover:bg-\[#[0-9a-fA-F]+\]| text-zinc-950| text-\[#[0-9a-fA-F]+\])*/g, 
    'bg-fbm-green hover:bg-fbm-green-hover text-white');

  code = code.replace(/text-white text-zinc-950/g, 'text-white');
  code = code.replace(/text-white font-semibold/g, 'text-white font-bold');

  fs.writeFileSync(filePath, code);
  console.log("Fixed mess in", filePath);
};

fix('src/components/AdminDashboard.tsx');
fix('src/components/WorkerDashboard.tsx');
fix('src/components/SmartLogin.tsx');

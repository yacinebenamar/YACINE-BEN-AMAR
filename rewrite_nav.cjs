const fs = require('fs');

const fixWorker = () => {
  let file = 'src/components/WorkerDashboard.tsx';
  let code = fs.readFileSync(file, 'utf8');

  // Let's remove the horizontal scroll navigation.
  // It usually looks like <nav className="flex space-x-...
  const horizontalNavRegex = /<div className="flex md:hidden overflow-x-auto gap-2 pb-2 scrollbar-hide px-2">[\s\S]*?<\/div>/;
  code = code.replace(horizontalNavRegex, '');

  fs.writeFileSync(file, code);
  console.log("Fixed horizontal nav in worker");
};

const fixAdmin = () => {
  let file = 'src/components/AdminDashboard.tsx';
  let code = fs.readFileSync(file, 'utf8');

  // Let's check for horizontal scroll navs
  const horizontalNavRegex = /<div className="flex md:hidden overflow-x-auto gap-2 pb-2 scrollbar-hide px-2">[\s\S]*?<\/div>/;
  code = code.replace(horizontalNavRegex, '');

  fs.writeFileSync(file, code);
  console.log("Fixed horizontal nav in admin");
}

fixWorker();
fixAdmin();

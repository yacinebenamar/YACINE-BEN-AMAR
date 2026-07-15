const fs = require('fs');

const fix = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace text FBM ERP with Logo
  code = code.replace(/<h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">\s*FBM <span className="text-fbm-green">ERP<\/span>\s*<\/h2>\s*<p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">\s*نظام الإدارة المتكامل LES FRÈRES BENAMAR — v1\.1\s*<\/p>/g, 
    '<FBMLogo size="xl" showText={true} />\n          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium">\n            نظام الإدارة المتكامل — الإصدار الأول\n          </p>');

  fs.writeFileSync(filePath, code);
  console.log("Updated logo in", filePath);
};

fix('src/components/SmartLogin.tsx');

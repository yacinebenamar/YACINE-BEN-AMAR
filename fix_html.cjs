const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
code = code.replace(/<body class="bg-fbm-light dark:bg-fbm-blue bg-fbm-light dark:bg-fbm-blue text-slate-900 dark:text-white font-sans antialiased selection:bg-fbm-green\/30"> >/g, '<body class="bg-fbm-light dark:bg-fbm-blue text-slate-900 dark:text-white font-sans antialiased selection:bg-fbm-green/30">');
fs.writeFileSync('index.html', code);

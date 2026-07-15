const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
// add a fix for body to prevent white flash in dark mode
code = code.replace(/<body class="/, '<body class="bg-fbm-light dark:bg-fbm-blue ');
fs.writeFileSync('index.html', code);

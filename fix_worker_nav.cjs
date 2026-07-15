const fs = require('fs');
let file = 'src/components/WorkerDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* Navigation bottom bar for Mobile-feel[\s\S]*?<\/div>\s*<\/div>\s*\);\s*}/;
const match = code.match(regex);
if (match) {
  console.log("Matched!", match[0].length);
} else {
  console.log("Did not match regex in WorkerDashboard.tsx");
}

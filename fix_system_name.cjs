const fs = require('fs');
const execSync = require('child_process').execSync;

const files = execSync('grep -rl "نظام بن عمر" src/').toString().split('\n').filter(Boolean);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/نظام بن عمر ERP/g, 'FBM ERP');
  content = content.replace(/نظام بن عمر/g, 'FBM ERP');
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});

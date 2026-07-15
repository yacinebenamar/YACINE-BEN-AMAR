const fs = require('fs');
const code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /\{\/\*\s*Account & Staff Management Tab\s*\*\/\}.*?\{activeTab === 'overview' && \(/s;
const match = code.match(regex);
if (match) {
  const index = code.indexOf(match[0]);
  console.log("Found overview at index", index);
}

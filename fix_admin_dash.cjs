const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
const lines = code.split('\n');

// Find the line with {/* Main Content Area */}
const idx = lines.findIndex(l => l.includes('{/* Main Content Area */}'));
if (idx !== -1) {
  // replace the next two lines
  lines[idx+1] = '      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar relative">';
  lines[idx+2] = '        {activeTab === "overview" && (';
  // Insert the missing wrapper div
  lines.splice(idx+3, 0, '          <div className="p-4 md:p-6 space-y-6 md:space-y-8 pb-32 md:pb-6">');
  fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
}

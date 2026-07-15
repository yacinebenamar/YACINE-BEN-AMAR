const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(/record\.type === 'in'/g, "true");
code = code.replace(/\{record\.timestamp\}/g, "{record.clockInTime || 'غير متوفر'}");

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("Attendance fixed");

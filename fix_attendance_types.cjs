const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Fix 'متواجدون بالخدمة الآن'
code = code.replace(/attendance\.filter\(a => a\.type === 'check_in' && new Date\(a\.timestamp\)\.toDateString\(\) === new Date\(\)\.toDateString\(\)\)\.length - attendance\.filter\(a => a\.type === 'check_out' && new Date\(a\.timestamp\)\.toDateString\(\) === new Date\(\)\.toDateString\(\)\)\.length/, "attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && !a.clockOutTime).length");

// Fix 'أنهوا العمل اليوم'
code = code.replace(/attendance\.filter\(a => a\.type === 'check_out' && new Date\(a\.timestamp\)\.toDateString\(\) === new Date\(\)\.toDateString\(\)\)\.length/g, "attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.clockOutTime).length");

// Fix 'لم يسجلوا حضور اليوم بعد'
code = code.replace(/attendance\.filter\(a => a\.type === 'check_in' && new Date\(a\.timestamp\)\.toDateString\(\) === new Date\(\)\.toDateString\(\)\)\.length/g, "attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.clockInTime).length");

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("Types fixed in AdminDashboard");

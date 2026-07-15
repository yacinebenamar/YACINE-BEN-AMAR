const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetRegex = /\{\/\*\s*Account & Staff Management Tab\s*\*\/\}.*?\{activeTab === 'overview' && \([^]*?<\/motion\.div>\s*\)\s*\}\s*\{activeTab === 'users' && \(/s;

const replacement = `{/* Account & Staff Management Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 px-2"
            >
              {/* Main GPS/Biometric Card */}
              <div className="bg-[#000839] border border-slate-700/80 rounded-[2rem] p-6 relative overflow-hidden shadow-2xl mt-4">
                <div 
                  className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(#76BC21 1px, transparent 1px), linear-gradient(90deg, #76BC21 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                    backgroundPosition: 'center center'
                  }}
                />
                
                <div className="relative z-10 text-right">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-full border border-[#76BC21]/30 bg-[#76BC21]/10 flex items-center justify-center text-[#76BC21]">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black text-white leading-tight max-w-[80%]">تتبع حضور وانصراف عمال الميدان بالـ GPS والبيومتري</h2>
                  </div>
                  <p className="text-xs text-slate-400 mb-6 font-medium leading-relaxed max-w-[90%] mx-auto text-right w-full">
                    كشف ذكي لحظي يسجل مواقع تفعيل الخدمة وصور التحقق لضمان الدقة التشغيلية
                  </p>
                  <button className="flex items-center justify-center gap-2 bg-[#000839] border border-[#76BC21]/50 hover:bg-[#76BC21]/10 text-[#76BC21] font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(118,188,33,0.15)] w-full">
                    <span>طباعة تقرير الحضور والوردية</span>
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total Workers */}
                <div className="bg-[#000839]/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between text-right relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <Users className="w-5 h-5 text-slate-500" />
                    <span className="text-xs font-bold text-slate-300">إجمالي عمال الميدان</span>
                  </div>
                  <span className="text-3xl font-black text-white font-mono">{users.filter(u => u.role === 'worker' || u.subRole === 'worker').length}</span>
                </div>
                
                {/* In Service Now */}
                <div className="bg-[#000839]/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between text-right relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#76BC21] shadow-[0_0_5px_#76BC21]" />
                    <span className="text-xs font-bold text-[#76BC21]">متواجدون بالخدمة الآن</span>
                  </div>
                  <span className="text-3xl font-black text-[#76BC21] font-mono">
                    {attendance.filter(a => a.type === 'check_in' && new Date(a.timestamp).toDateString() === new Date().toDateString()).length - attendance.filter(a => a.type === 'check_out' && new Date(a.timestamp).toDateString() === new Date().toDateString()).length}
                  </span>
                </div>

                {/* Finished Work */}
                <div className="bg-[#000839]/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between text-right relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                      <span className="text-xs font-bold text-blue-400">أنهوا العمل اليوم</span>
                    </div>
                  </div>
                  <span className="text-3xl font-black text-blue-400 font-mono">
                    {attendance.filter(a => a.type === 'check_out' && new Date(a.timestamp).toDateString() === new Date().toDateString()).length}
                  </span>
                </div>

                {/* Did Not Login */}
                <div className="bg-[#000839]/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between text-right relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-xs font-bold text-amber-500">لم يسجلوا حضور اليوم بعد</span>
                    </div>
                  </div>
                  <span className="text-3xl font-black text-amber-500 font-mono">
                    {Math.max(0, users.filter(u => u.role === 'worker' || u.subRole === 'worker').length - attendance.filter(a => a.type === 'check_in' && new Date(a.timestamp).toDateString() === new Date().toDateString()).length)}
                  </span>
                </div>
              </div>

              {/* Title before list */}
              <div className="mt-6 mb-2 text-right">
                <h3 className="text-sm font-black text-white flex items-center justify-end gap-2">
                  <span className="bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">3</span>
                  الحركات البيومترية والميدانية الموثقة
                </h3>
              </div>
              
              {/* Dummy spacing for bottom navigation */}
              <div className="h-24"></div>
            </motion.div>
          )}

          {activeTab === 'users' && (`;

if (targetRegex.test(code)) {
  code = code.replace(targetRegex, replacement);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("Overview tab replaced.");
} else {
  console.log("Regex for Overview tab did not match.");
}

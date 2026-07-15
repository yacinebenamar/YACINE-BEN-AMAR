const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `{/* Mobile Top Header (Sleek and Compact) */}
      <div className="md:hidden bg-[#050E46] border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <FBMLogo size="sm" />
          <div className="text-right">
            <span className="block text-xs font-black text-white">نظام FBM ERP</span>
            <span className="block text-[8px] text-[#76BC21] font-bold tracking-wider">LES FRÈRES BENAMAR</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Active status indicator badge */}
          <div className="relative w-8 h-8 rounded-full bg-[#76BC21]/15 border border-[#76BC21]/30 flex items-center justify-center font-bold text-xs text-[#76BC21] shrink-0 font-sans">
            {currentUser.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#050E46] animate-pulse"></span>
          </div>
          <NotificationPopover
            notifications={notifications}
            onUpdateNotifications={onUpdateNotifications}
            onUpdateNotification={onUpdateNotification}
            currentUser={currentUser}
            align="left"
          />
        </div>
      </div>`;

const replacement = `{/* Mobile Top Header (Sleek and Compact) */}
      <div className="md:hidden bg-[#000839] border-b border-slate-800/50 px-4 pt-6 pb-4 flex flex-col z-40 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <NotificationPopover
              notifications={notifications}
              onUpdateNotifications={onUpdateNotifications}
              onUpdateNotification={onUpdateNotification}
              currentUser={currentUser}
              align="left"
            />
            <div className="relative w-10 h-10 rounded-full border border-[#76BC21] bg-[#76BC21]/10 flex items-center justify-center font-bold text-sm text-[#76BC21] font-sans">
              {currentUser.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
              <span className="absolute bottom-0 -right-0 w-2.5 h-2.5 bg-[#76BC21] rounded-full border-2 border-[#000839]"></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right flex flex-col justify-center">
              <span className="text-sm font-black text-white uppercase tracking-wider">نظام بن عمر ERP</span>
              <span className="text-[10px] text-[#76BC21] font-bold tracking-widest uppercase mt-0.5">ALGERIA ENTERPRISE</span>
            </div>
            <FBMLogo size="sm" />
          </div>
        </div>

        {/* Dashboard Title & Server Status Pill */}
        <div className="mt-4 text-right">
          <h1 className="text-2xl font-black text-white">لوحة تحكم المدير المتكاملة</h1>
          <p className="text-xs text-slate-400 mt-1.5">نظام بن عمر ERP · تجميع الفواتير والمهام التشغيلية</p>
        </div>
        
        <div className="mt-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl py-2 px-3 flex items-center justify-between shadow-inner">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800/80">
            <Bell className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="block text-[9px] text-slate-400 font-bold mb-0.5">رابط الخادم النشط</span>
              <span className="text-[#76BC21] text-xs font-mono font-bold tracking-wider">DZ-REGIONAL-PORT:3000</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#76BC21] shadow-[0_0_8px_#76BC21]" />
          </div>
        </div>
      </div>`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("Header replaced.");
} else {
  console.log("Target string not found in AdminDashboard.tsx");
}

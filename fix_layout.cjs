const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `        </div>
        {/* Tab 1: Expenses Control */}`;

const replacement = `      {/* Desktop Workspace Sidebar - Styled like Slack / Discord */}
      <div className="hidden md:flex w-64 bg-[#050E46] border-l border-slate-800 shrink-0 p-5 flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <FBMLogo size="md" />
            <div>
              <h2 className="text-sm font-black text-white">نظام بن عمر ERP</h2>
              <p className="text-[10px] text-[#76BC21] font-bold">إدارة العمليات المركزية</p>
            </div>
          </div>
          
          <nav className="space-y-1.5 mt-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={\`w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all \${
                activeTab === 'overview'
                  ? 'bg-[#76BC21]/10 text-[#76BC21] font-bold border border-[#76BC21]/30 shadow-sm'
                  : 'text-slate-400 hover:bg-[#000839] hover:text-white border border-transparent'
              }\`}
            >
              <span>نظرة عامة والعمليات</span>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={\`w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all \${
                activeTab === 'attendance'
                  ? 'bg-[#76BC21]/10 text-[#76BC21] font-bold border border-[#76BC21]/30 shadow-sm'
                  : 'text-slate-400 hover:bg-[#000839] hover:text-white border border-transparent'
              }\`}
            >
              <span>الحضور والانصراف</span>
              <UserCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={\`w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all \${
                activeTab === 'tasks'
                  ? 'bg-[#76BC21]/10 text-[#76BC21] font-bold border border-[#76BC21]/30 shadow-sm'
                  : 'text-slate-400 hover:bg-[#000839] hover:text-white border border-transparent'
              }\`}
            >
              <span>المهام التشغيلية</span>
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={\`w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all \${
                activeTab === 'expenses'
                  ? 'bg-[#76BC21]/10 text-[#76BC21] font-bold border border-[#76BC21]/30 shadow-sm'
                  : 'text-slate-400 hover:bg-[#000839] hover:text-white border border-transparent'
              }\`}
            >
              <span>المالية والمصاريف</span>
              <TrendingUp className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile Glassmorphic Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#000839]/90 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 flex items-center justify-around z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <button
          onClick={() => setActiveTab('overview')}
          className={\`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all relative cursor-pointer \${
            activeTab === 'overview' ? 'text-[#76BC21] bg-[#76BC21]/10 border border-[#76BC21]/20' : 'text-slate-400 hover:text-white'
          }\`}
        >
          <LayoutGrid className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold">العمليات</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={\`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all relative cursor-pointer \${
            activeTab === 'expenses' ? 'text-[#76BC21] bg-[#76BC21]/10 border border-[#76BC21]/20' : 'text-slate-400 hover:text-white'
          }\`}
        >
          <TrendingUp className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold">المصاريف</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={\`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all relative cursor-pointer \${
            activeTab === 'tasks' ? 'text-[#76BC21] bg-[#76BC21]/10 border border-[#76BC21]/20' : 'text-slate-400 hover:text-white'
          }\`}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold">المهام</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={\`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all relative cursor-pointer \${
            activeTab === 'attendance' ? 'text-[#76BC21] bg-[#76BC21]/10 border border-[#76BC21]/20' : 'text-slate-400 hover:text-white'
          }\`}
        >
          <UserCheck className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold">الحضور</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-2 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-6">
        {/* Tab 1: Expenses Control */}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("Layout fixed.");
} else {
  console.log("Could not find targetStr to fix layout.");
}

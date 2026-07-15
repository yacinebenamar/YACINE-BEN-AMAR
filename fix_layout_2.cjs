const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `        {/* Tab 1: Expenses Control */}`;

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

      {/* Chat FAB */}
      <button 
        onClick={() => setActiveTab('chat')}
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-[#76BC21] hover:bg-[#62a118] text-[#000839] rounded-full shadow-[0_0_20px_rgba(118,188,33,0.4)] flex items-center justify-center z-50 transition-transform active:scale-95"
      >
        <MessageSquare className="w-7 h-7" />
        <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md border-2 border-[#000839]">
          3
        </span>
      </button>

      {/* Mobile Glassmorphic Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#000839]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-3 flex items-center justify-around z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <button
          onClick={() => setActiveTab('overview')}
          className={\`flex flex-col items-center gap-1.5 py-1 px-4 rounded-xl transition-all relative cursor-pointer \${
            activeTab === 'overview' ? 'text-[#76BC21] font-bold scale-110' : 'text-slate-500 hover:text-slate-300'
          }\`}
        >
          <LayoutGrid className="w-6 h-6 shrink-0" />
          <span className="text-[9px] font-black">العمليات</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={\`flex flex-col items-center gap-1.5 py-1 px-4 rounded-xl transition-all relative cursor-pointer \${
            activeTab === 'expenses' ? 'text-[#76BC21] font-bold scale-110' : 'text-slate-500 hover:text-slate-300'
          }\`}
        >
          <TrendingUp className="w-6 h-6 shrink-0" />
          <span className="text-[9px] font-black">المصاريف</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={\`flex flex-col items-center gap-1.5 py-1 px-4 rounded-xl transition-all relative cursor-pointer \${
            activeTab === 'tasks' ? 'text-[#76BC21] font-bold scale-110' : 'text-slate-500 hover:text-slate-300'
          }\`}
        >
          <LayoutDashboard className="w-6 h-6 shrink-0" />
          <span className="text-[9px] font-black">المهام</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={\`flex flex-col items-center gap-1.5 py-1 px-4 rounded-xl transition-all relative cursor-pointer \${
            activeTab === 'attendance' ? 'text-[#76BC21] font-bold scale-110' : 'text-slate-500 hover:text-slate-300'
          }\`}
        >
          <UserCheck className="w-6 h-6 shrink-0" />
          <span className="text-[9px] font-black">الحضور</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-2 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-6">
        {/* Tab 1: Expenses Control */}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("Layout fixed 2.");
} else {
  console.log("Could not find targetStr to fix layout 2.");
}

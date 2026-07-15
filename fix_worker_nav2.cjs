const fs = require('fs');
let file = 'src/components/WorkerDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* Navigation bottom bar for Mobile-feel[\s\S]*$/;
const match = code.match(regex);
if (match) {
  console.log("Matched end!", match[0].substring(0, 100));
  
  const tabs = [
    { id: 'overview', label: 'العمليات', icon: 'LayoutGrid' },
    { id: 'expenses', label: 'المصاريف', icon: 'TrendingUp' },
    { id: 'tasks', label: 'المهام', icon: 'Clock' },
    { id: 'orders', label: 'الطلبيات', icon: 'Calendar' },
    { id: 'camion', label: 'الكاميو', icon: 'Truck' },
    { id: 'transfers', label: 'السلع', icon: 'Package' },
    { id: 'attendance', label: 'الحضور', icon: 'UserCheck' },
    { id: 'chat', label: 'الدردشة', icon: 'MessageSquare' }
  ];

  let buttons = '';
  tabs.forEach(tab => {
    if (tab.id === 'overview') return;
    const permMap = {
      'expenses': 'canViewAllExpenses',
      'tasks': 'canManageTasks',
      'transfers': 'canManageTransfers',
      'camion': 'canManageCamion',
      'attendance': 'canManageAttendance',
      'orders': 'canManageOrders',
      'chat': null
    };
    const perm = permMap[tab.id];
    let btn = `
        <button
          onClick={() => setActiveTab('${tab.id}')}
          className={\`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all relative cursor-pointer \${
            activeTab === '${tab.id}' ? 'text-fbm-green font-bold scale-110' : 'text-slate-500 hover:text-slate-500 dark:hover:text-slate-300'
          }\`}
        >
          <${tab.icon} className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-bold whitespace-nowrap">${tab.label}</span>
        </button>
    `;
    if (perm) {
      buttons += `\n        {isAllowed('${perm}') && (${btn}\n        )}`;
    } else {
      buttons += btn;
    }
  });

  const replacement = `
      {/* Unified Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-fbm-blue/95 backdrop-blur-md border-t border-slate-200 dark:border-fbm-blue-border px-2 py-3 flex items-center justify-around z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-x-auto scrollbar-none gap-2">
        ${buttons}
      </div>
    </div>
  );
}
  `;
  
  code = code.replace(regex, replacement);
  fs.writeFileSync(file, code);
  console.log("Replaced end of WorkerDashboard.tsx");
} else {
  console.log("Could not match the end of WorkerDashboard");
}

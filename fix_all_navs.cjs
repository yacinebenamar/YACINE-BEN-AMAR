const fs = require('fs');

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

const generateBottomNav = (isWorker) => {
  let buttons = '';
  tabs.forEach(tab => {
    // Wrap in permission check if needed. In worker we can just use isAllowed. In admin it's not needed for all, but let's just use it conditionally if it exists.
    if (isWorker) {
      if (tab.id === 'overview') return; // Workers don't have overview
      
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
        buttons += `
        {isAllowed('${perm}') && (
          ${btn}
        )}
        `;
      } else {
        buttons += btn;
      }
    } else {
      // Admin
      const adminTabs = ['overview', 'expenses', 'tasks', 'users', 'chat'];
      if (adminTabs.includes(tab.id)) {
        buttons += `
        <button
          onClick={() => setActiveTab('${tab.id}')}
          className={\`flex flex-col items-center gap-1.5 py-1 px-4 rounded-xl transition-all relative cursor-pointer \${
            activeTab === '${tab.id}' ? 'text-fbm-green font-bold scale-110' : 'text-slate-500 hover:text-slate-500 dark:hover:text-slate-300'
          }\`}
        >
          <${tab.icon} className="w-6 h-6 shrink-0" />
          <span className="text-[9px] font-bold whitespace-nowrap">${tab.id === 'overview' ? 'الرئيسية' : tab.label}</span>
        </button>
        `;
      }
    }
  });

  return `
      {/* Unified Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-fbm-blue/95 backdrop-blur-md border-t border-slate-200 dark:border-fbm-blue-border px-2 py-3 flex items-center justify-around z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-x-auto scrollbar-none gap-2">
        ${buttons}
      </div>
  `;
};

// 1. WorkerDashboard.tsx
let workerFile = 'src/components/WorkerDashboard.tsx';
let workerCode = fs.readFileSync(workerFile, 'utf8');
const workerNavRegex = /\{\/\* Navigation bottom bar for Mobile-feel[\s\S]*?<\/div>\s*<\/div>\s*\);\s*}/;
workerCode = workerCode.replace(workerNavRegex, generateBottomNav(true) + '\n    </div>\n  );\n}');
fs.writeFileSync(workerFile, workerCode);

// 2. AdminDashboard.tsx
let adminFile = 'src/components/AdminDashboard.tsx';
let adminCode = fs.readFileSync(adminFile, 'utf8');
const adminNavRegex = /\{\/\* Mobile Glassmorphic Bottom Navigation \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\);\s*}/;
adminCode = adminCode.replace(adminNavRegex, generateBottomNav(false) + '\n    </div>\n  );\n}');
fs.writeFileSync(adminFile, adminCode);

console.log("Replaced bottom navs!");

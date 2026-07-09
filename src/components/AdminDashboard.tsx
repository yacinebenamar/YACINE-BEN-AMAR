import React, { useState } from 'react';
import { AppUser, CompanyCategory, CompanyTask, CompanyExpense, CompanyNotification } from '../types';
import { 
  FileSpreadsheet, Plus, Trash2, Bell, CheckCircle2, XCircle, Clock, 
  Search, Filter, ListCollapse, Layers, Megaphone, Check, X, LogOut,
  TrendingUp, Wallet, Users, LayoutDashboard, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import NotificationPopover from './NotificationPopover';

interface AdminDashboardProps {
  currentUser: AppUser;
  users: AppUser[];
  categories: CompanyCategory[];
  tasks: CompanyTask[];
  expenses: CompanyExpense[];
  notifications: CompanyNotification[];
  onLogout: () => void;
  onUpdateExpenses: (newExpenses: CompanyExpense[]) => void;
  onUpdateTasks: (newTasks: CompanyTask[]) => void;
  onUpdateCategories: (newCategories: CompanyCategory[]) => void;
  onAddNotification: (notif: CompanyNotification) => void;
  onUpdateNotifications: (newNotifications: CompanyNotification[]) => void;
  onUpdateUsers: (newUsers: AppUser[]) => void;
}

export default function AdminDashboard({
  currentUser,
  users,
  categories,
  tasks,
  expenses,
  notifications,
  onLogout,
  onUpdateExpenses,
  onUpdateTasks,
  onUpdateCategories,
  onAddNotification,
  onUpdateNotifications,
  onUpdateUsers
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'tasks' | 'categories' | 'broadcast' | 'users'>('expenses');
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selectedExpenseForReview, setSelectedExpenseForReview] = useState<CompanyExpense | null>(null);

  // New task form state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskWorkerUid, setNewTaskWorkerUid] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'task'>('expense');

  // Broadcast form state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'specific'>('all');
  const [broadcastTargetUid, setBroadcastTargetUid] = useState('');

  // New user registration state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmailPrefix, setNewUserEmailPrefix] = useState('');
  const [newUserRole, setNewUserRole] = useState<'worker' | 'admin'>('worker');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [userSearchText, setUserSearchText] = useState('');

  // Expandable tasks tracking
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Register new employee
  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmailPrefix.trim()) return;

    const cleanEmailPrefix = newUserEmailPrefix.trim().toLowerCase().replace(/\s+/g, '');
    const userEmail = `${cleanEmailPrefix}@benamar.local`;

    // Check if user already exists
    if (users.some(u => u.email.toLowerCase() === userEmail.toLowerCase())) {
      alert('⚠️ اسم المستخدم هذا مسجل بالفعل لموظف آخر!');
      return;
    }

    const newUser: AppUser = {
      uid: `user_${Date.now()}`,
      email: userEmail,
      fullName: newUserName.trim(),
      role: newUserRole,
      isActive: true,
      password: newUserPassword
    };

    onUpdateUsers([...users, newUser]);

    // Send a notification broadcast about the new team member
    onAddNotification({
      id: `notif_sys_user_${Date.now()}`,
      title: '🎉 ترحيب بزميل عمل جديد في طاقم العمل',
      body: `يسر الإدارة الترحيب بـ "${newUserName.trim()}" في طاقم عمل الإخوة بن عمر وتفعيل حسابه الرسمي بالمؤسسة.`,
      targetType: 'all',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    setNewUserName('');
    setNewUserEmailPrefix('');
    setNewUserRole('worker');
    setNewUserPassword('123456');
    alert('✅ تم تسجيل الحساب الجديد وإضافته لقاعدة البيانات وتفعيل الدخول بنجاح!');
  };

  // Toggle user activation status
  const handleToggleUserActive = (uid: string) => {
    const updated = users.map(u => {
      if (u.uid === uid) {
        return { ...u, isActive: !u.isActive };
      }
      return u;
    });
    onUpdateUsers(updated);
  };

  // Delete user from base
  const handleDeleteUser = (uid: string) => {
    if (uid === currentUser.uid) {
      alert('❌ لا يمكنك حذف حسابك الحالي الذي تسجل الدخول به!');
      return;
    }
    if (confirm('⚠️ هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً من النظام التشغيلي؟')) {
      const updated = users.filter(u => u.uid !== uid);
      onUpdateUsers(updated);
    }
  };

  // Stats calculation
  const totalExpensesAmount = expenses
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingExpensesCount = expenses.filter(e => e.status === 'pending').length;
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasksCount = tasks.filter(t => t.status === 'in_progress').length;
  const activeWorkersCount = users.filter(u => u.role === 'worker' && u.isActive).length;

  // Handle expense approval/rejection
  const handleReviewExpense = (expenseId: string, status: 'approved' | 'rejected') => {
    const updated = expenses.map(e => {
      if (e.id === expenseId) {
        return { ...e, status };
      }
      return e;
    });
    onUpdateExpenses(updated);
    setSelectedExpenseForReview(null);

    // Notify the worker
    const targetExp = expenses.find(e => e.id === expenseId);
    if (targetExp) {
      const statusText = status === 'approved' ? 'قبول واعتماد الفاتورة' : 'رفض الفاتورة';
      onAddNotification({
        id: `notif_exp_${Date.now()}`,
        title: `تحديث طلب مصروف: ${statusText}`,
        body: `تم اتخاذ قرار الإدارة بشأن المصروف: "${targetExp.description.slice(0, 30)}..." بقيمة ${targetExp.amount} د.ج.`,
        targetType: 'specific',
        targetUid: targetExp.workerUid,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  };

  // Add Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskWorkerUid || !newTaskCategory) return;

    const assignedWorker = users.find(u => u.uid === newTaskWorkerUid);
    if (!assignedWorker) return;

    const newTask: CompanyTask = {
      id: `task_${Date.now()}`,
      title: newTaskTitle,
      description: newTaskDesc,
      categoryName: newTaskCategory,
      assignedToUid: newTaskWorkerUid,
      assignedToName: assignedWorker.fullName,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    onUpdateTasks([newTask, ...tasks]);
    setShowTaskModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskWorkerUid('');
    setNewTaskCategory('');

    // Send automatic targeted notification
    onAddNotification({
      id: `notif_task_${Date.now()}`,
      title: 'مهمة ميدانية جديدة موكلة إليك 📋',
      body: `المدير ${currentUser.fullName.split(' ')[0]} كلفك بمهمة: "${newTaskTitle}"، يرجى مراجعة المهام الميدانية.`,
      targetType: 'specific',
      targetUid: newTaskWorkerUid,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  };

  // Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: CompanyCategory = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      type: newCatType
    };

    onUpdateCategories([...categories, newCat]);
    setNewCatName('');
  };

  // Delete Category
  const handleDeleteCategory = (catId: string) => {
    const updated = categories.filter(c => c.id !== catId);
    onUpdateCategories(updated);
  };

  // Broadcast Alert
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;

    onAddNotification({
      id: `notif_b_${Date.now()}`,
      title: broadcastTitle,
      body: broadcastBody,
      targetType: broadcastTarget,
      targetUid: broadcastTarget === 'specific' ? broadcastTargetUid : null,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    setBroadcastTitle('');
    setBroadcastBody('');
    setBroadcastTarget('all');
    setBroadcastTargetUid('');
    alert('🔔 تم بث التنبيه السحابي لطاقم العمل المعني بنجاح!');
  };

  // Excel/CSV Export
  const handleExportCSV = () => {
    // Generate CSV contents
    const filteredExpenses = expenses.filter(e => {
      const matchSearch = e.workerName.includes(expenseSearch) || e.description.includes(expenseSearch);
      const matchFilter = expenseFilter === 'all' || e.status === expenseFilter;
      return matchSearch && matchFilter;
    });

    let csvContent = "\ufeff"; // BOM for UTF-8 in Excel
    csvContent += "الاسم,المبلغ (د.ج),التصنيف,البيان والتفصيل,الحالة,تاريخ التسجيل\n";

    filteredExpenses.forEach(e => {
      const statusText = e.status === 'approved' ? 'معتمد' : e.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار';
      const cleanDesc = e.description.replace(/,/g, ' ');
      csvContent += `"${e.workerName}",${e.amount},"${e.category}","${cleanDesc}","${statusText}","${new Date(e.createdAt).toLocaleDateString('ar-DZ')}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_مصاريف_شركة_بن_عمر_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered expenses list
  const filteredExpenses = expenses.filter(e => {
    const matchSearch = e.workerName.toLowerCase().includes(expenseSearch.toLowerCase()) || 
                        e.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                        e.category.toLowerCase().includes(expenseSearch.toLowerCase());
    const matchFilter = expenseFilter === 'all' || e.status === expenseFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-[#000839] text-white flex flex-col md:flex-row pb-12 md:pb-0">
      
      {/* Sidebar for desktop / top nav for mobile */}
      <div className="w-full md:w-64 bg-[#050E46] border-b md:border-b-0 md:border-l border-slate-800 shrink-0 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Logo with Algerian Flag decorative colors */}
          <div className="flex items-center gap-3 justify-end md:justify-center border-b border-slate-800 pb-5">
            <div className="text-right">
              <span className="block text-sm font-bold text-white">مجموعة الإخوة بن عمر</span>
              <span className="block text-[10px] text-[#76BC21] font-semibold">LES FRÈRES BEN AMAR (FBM)</span>
            </div>
            <div className="w-3 h-10 bg-emerald-600 rounded-sm"></div>
            <div className="w-3 h-10 bg-[#76BC21] rounded-sm"></div>
          </div>

          {/* User badge */}
          <div className="bg-[#000839] p-3.5 rounded-2xl border border-slate-800 text-right">
            <span className="block text-[10px] text-[#76BC21] font-bold">حساب المدير النشط</span>
            <span className="block text-xs font-bold text-white mt-0.5">{currentUser.fullName}</span>
            <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{currentUser.email}</span>
          </div>

          {/* Nav menu */}
          <nav className="space-y-1.5" dir="rtl">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'expenses' 
                  ? 'bg-[#76BC21] text-[#000839] shadow-lg shadow-[#76BC21]/15' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4" />
                <span>إدارة وحركة المصاريف</span>
              </div>
              {pendingExpensesCount > 0 && (
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${activeTab === 'expenses' ? 'bg-[#000839] text-white' : 'bg-[#76BC21] text-[#000839]'}`}>
                  {pendingExpensesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'tasks' 
                  ? 'bg-[#76BC21] text-[#000839] shadow-lg shadow-[#76BC21]/15' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>توزيع المهام ومراقبتها</span>
              </div>
              {(pendingTasksCount + inProgressTasksCount) > 0 && (
                <span className="px-2 py-0.5 bg-sky-500 text-white text-[10px] rounded-full font-bold">
                  {pendingTasksCount + inProgressTasksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'categories' 
                  ? 'bg-[#76BC21] text-[#000839] shadow-lg shadow-[#76BC21]/15' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>إدارة الفئات والمستودعات</span>
            </button>

            <button
              onClick={() => setActiveTab('broadcast')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'broadcast' 
                  ? 'bg-[#76BC21] text-[#000839] shadow-lg shadow-[#76BC21]/15' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>بث الإشعارات والتنبيهات</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'users' 
                  ? 'bg-[#76BC21] text-[#000839] shadow-lg shadow-[#76BC21]/15' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>إدارة الحسابات وطاقم العمل</span>
            </button>
          </nav>
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="w-full mt-8 md:mt-0 flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-red-950/40 border border-slate-800 hover:border-red-900/60 text-slate-400 hover:text-red-300 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>خروج آمن من النظام</span>
        </button>
      </div>

      {/* Main Work Area */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto" dir="rtl">
        
        {/* Title / Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white">لوحة تحكم المدير المتكاملة</h1>
            <p className="text-xs text-slate-400 mt-1">نظام بن عمر ERP · تجميع الفواتير والمهام التشغيلية</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <NotificationPopover
              notifications={notifications}
              onUpdateNotifications={onUpdateNotifications}
              currentUser={currentUser}
              align="left"
            />
            
            <div className="flex items-center gap-2.5 bg-[#050E46] border border-slate-800 px-4 py-2.5 rounded-2xl">
              <div className="text-right">
                <span className="block text-[10px] text-slate-500 font-bold">رابط الخادم النشط</span>
                <span className="block text-xs font-mono text-[#76BC21] font-semibold">DZ-REGIONAL-PORT:3000</span>
              </div>
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
            </div>
          </div>
        </div>

        {/* Bento Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-[#050E46] border border-slate-800/80 p-4 rounded-2xl text-right">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-[#76BC21]/10 rounded-xl text-[#76BC21]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500">السيولة المعتمدة</span>
            </div>
            <h3 className="text-xl font-black text-white font-mono">{totalExpensesAmount.toLocaleString()} <span className="text-[10px] font-sans">د.ج</span></h3>
            <p className="text-[10px] text-slate-400 mt-1">إجمالي الفواتير والمشتريات المعتمدة</p>
          </div>

          <div className="bg-[#050E46] border border-slate-800/80 p-4 rounded-2xl text-right">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500">طلبات معلقة</span>
            </div>
            <h3 className="text-xl font-black text-amber-500 font-mono">{pendingExpensesCount} <span className="text-xs font-sans text-slate-500">فواتير</span></h3>
            <p className="text-[10px] text-slate-400 mt-1">بانتظار مراجعتك واعتمادها المالي</p>
          </div>

          <div className="bg-[#050E46] border border-slate-800/80 p-4 rounded-2xl text-right">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-sky-500/10 rounded-xl text-sky-500">
                <ListCollapse className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500">مهام نشطة</span>
            </div>
            <h3 className="text-xl font-black text-sky-500 font-mono">{pendingTasksCount + inProgressTasksCount} <span className="text-xs font-sans text-slate-500">عملية</span></h3>
            <p className="text-[10px] text-slate-400 mt-1">{inProgressTasksCount} قيد التنفيذ و {pendingTasksCount} معلقة</p>
          </div>

          <div className="bg-[#050E46] border border-slate-800/80 p-4 rounded-2xl text-right">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500">الفروع والعمال</span>
            </div>
            <h3 className="text-xl font-black text-emerald-400 font-mono">{activeWorkersCount} <span className="text-xs font-sans text-slate-500">موظفين</span></h3>
            <p className="text-[10px] text-slate-400 mt-1">طاقم ميداني مفعّل ومخوّل بالعمل</p>
          </div>

        </div>

        {/* Tab 1: Expenses Control */}
        {activeTab === 'expenses' && (
          <div className="bg-[#050E46] border border-slate-800 rounded-3xl p-4 md:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-5 border-b border-slate-800/80">
              <div>
                <h2 className="text-lg font-bold text-white">إدارة واعتماد مصاريف طاقم العمل الميداني</h2>
                <p className="text-xs text-slate-400 mt-0.5">مراجعة الفواتير المرفوعة والوقود وتكاليف النقل واعتمادها</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md self-start md:self-auto"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير Excel (ملف الحسابات)</span>
              </button>
            </div>

            {/* Filters and search row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="ابحث باسم الموظف أو البيان أو الفئة..."
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl pr-10 pl-4 py-2.5 text-xs text-right focus:outline-none placeholder-slate-500 transition-all"
                />
              </div>

              {/* Status selectors filter */}
              <div className="flex gap-1 bg-[#000839] p-1 rounded-xl border border-slate-800 overflow-x-auto shrink-0">
                <button
                  onClick={() => setExpenseFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    expenseFilter === 'all' ? 'bg-[#76BC21] text-[#000839]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل ({expenses.length})
                </button>
                <button
                  onClick={() => setExpenseFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    expenseFilter === 'pending' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  معلق ({expenses.filter(e => e.status === 'pending').length})
                </button>
                <button
                  onClick={() => setExpenseFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    expenseFilter === 'approved' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  معتمد ({expenses.filter(e => e.status === 'approved').length})
                </button>
                <button
                  onClick={() => setExpenseFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    expenseFilter === 'rejected' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  مرفوض ({expenses.filter(e => e.status === 'rejected').length})
                </button>
              </div>
            </div>

            {/* Expenses List */}
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12 bg-[#000839]/40 rounded-2xl border border-dashed border-slate-800">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">لا توجد مصاريف مسجلة مطابقة للبحث أو الفلترة</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredExpenses.map((expense) => (
                  <div 
                    key={expense.id}
                    className="bg-[#000839] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold bg-[#76BC21]/10 text-[#76BC21] px-2.5 py-0.5 rounded-full">
                          {expense.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(expense.createdAt).toLocaleDateString('ar-DZ')} {new Date(expense.createdAt).toLocaleTimeString('ar-DZ', {hour: '2-digit', minute: '2-digit'})}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-relaxed">{expense.description}</h4>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                        <span>الموظف المكلف:</span>
                        <span className="text-slate-200 font-semibold">{expense.workerName}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/60">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-500 font-medium">القيمة المالية</span>
                        <span className="text-lg font-black text-white font-mono">{expense.amount.toLocaleString()} <span className="text-xs font-sans">د.ج</span></span>
                      </div>

                      {/* Status badge and actions */}
                      <div className="flex items-center gap-2">
                        {expense.status === 'approved' && (
                          <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تم الاعتماد</span>
                          </span>
                        )}
                        {expense.status === 'rejected' && (
                          <span className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-xl text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>مرفوض</span>
                          </span>
                        )}
                        {expense.status === 'pending' && (
                          <button
                            onClick={() => setSelectedExpenseForReview(expense)}
                            className="bg-amber-500 hover:bg-amber-600 text-[#000839] font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                          >
                            مراجعة واعتماد
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Tasks Manager */}
        {activeTab === 'tasks' && (
          <div className="bg-[#050E46] border border-slate-800 rounded-3xl p-4 md:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-800/80">
              <div>
                <h2 className="text-lg font-bold text-white">توزيع ومتابعة العمليات اليومية للعمال</h2>
                <p className="text-xs text-slate-400 mt-0.5">إرسال المهام وساعات بدء العمل وإتمام العمل الفعلي</p>
              </div>
              <button
                onClick={() => setShowTaskModal(true)}
                className="bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4 font-black" />
                <span>إسناد مهمة جديدة</span>
              </button>
            </div>

            {/* Task list with expandable logs */}
            {tasks.length === 0 ? (
              <div className="text-center py-12 bg-[#000839]/40 rounded-2xl border border-dashed border-slate-800">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">لا توجد مهام موزعة حالياً</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const isExpanded = expandedTaskId === task.id;
                  return (
                    <div 
                      key={task.id}
                      className="bg-[#000839] border border-slate-800 rounded-2xl hover:border-slate-700 transition-all overflow-hidden"
                    >
                      <div 
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                              {task.categoryName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(task.createdAt).toLocaleDateString('ar-DZ')}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{task.title}</h4>
                          <p className="text-xs text-slate-400">
                            المكلف: <span className="text-[#76BC21] font-semibold">{task.assignedToName}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-800/60">
                          {/* Status indicators */}
                          <div>
                            {task.status === 'done' && (
                              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>مكتملة</span>
                              </span>
                            )}
                            {task.status === 'in_progress' && (
                              <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 animate-pulse">
                                <Clock className="w-3.5 h-3.5" />
                                <span>قيد التنفيذ</span>
                              </span>
                            )}
                            {task.status === 'pending' && (
                              <span className="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>بانتظار البدء</span>
                              </span>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </div>
                      </div>

                      {/* Expanded Details / Lifecycle Log */}
                      {isExpanded && (
                        <div className="bg-[#050E46]/60 border-t border-slate-800/60 p-4 space-y-4 text-xs leading-relaxed text-slate-300">
                          <div className="bg-[#000839]/60 p-3.5 rounded-xl border border-slate-800">
                            <h5 className="font-extrabold text-white mb-1.5 text-xs">تفصيل المهمة والتعليمات المرفقة:</h5>
                            <p className="text-xs text-slate-300 whitespace-pre-wrap">{task.description || 'لم يتم إدراج وصف مفصل.'}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                            <div className="bg-[#000839]/30 p-2.5 rounded-xl border border-slate-800/80 text-right">
                              <span className="block text-slate-500 text-[10px] font-bold">توقيت إسناد المهمة</span>
                              <span className="font-mono text-slate-300 mt-1 block">
                                {new Date(task.createdAt).toLocaleString('ar-DZ')}
                              </span>
                            </div>

                            <div className="bg-[#000839]/30 p-2.5 rounded-xl border border-slate-800/80 text-right">
                              <span className="block text-slate-500 text-[10px] font-bold">بدء العمل الفعلي (تسجيل الموظف)</span>
                              <span className={`font-mono mt-1 block ${task.startedAt ? 'text-amber-400' : 'text-slate-600'}`}>
                                {task.startedAt ? new Date(task.startedAt).toLocaleString('ar-DZ') : 'لم يبدأ بعد'}
                              </span>
                            </div>

                            <div className="bg-[#000839]/30 p-2.5 rounded-xl border border-slate-800/80 text-right">
                              <span className="block text-slate-500 text-[10px] font-bold">إتمام العمل الفعلي وتسجيل التسليم</span>
                              <span className={`font-mono mt-1 block ${task.completedAt ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                                {task.completedAt ? new Date(task.completedAt).toLocaleString('ar-DZ') : 'لم يتم الإنجاز بعد'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Categories CRUD */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form */}
            <div className="bg-[#050E46] border border-slate-800 rounded-3xl p-5 shadow-xl h-fit">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#76BC21]" />
                <span>إدراج تصنيف جديد للنظام</span>
              </h2>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-300 block">اسم التصنيف الجديد</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="مثال: وقود الشاحنات الكبيرة"
                    className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-300 block">نوع التصنيف</label>
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as 'expense' | 'task')}
                    className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none text-white"
                  >
                    <option value="expense">فئة مصاريف وفواتير</option>
                    <option value="task">فئة عمليات ومهام ميدانية</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow transition-all"
                >
                  حفظ الفئة في النظام
                </button>
              </form>
            </div>

            {/* Lists */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Expenses Categories */}
              <div className="bg-[#050E46] border border-slate-800 rounded-3xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-3 text-right">فئات وتصنيفات المصاريف ({categories.filter(c => c.type === 'expense').length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.filter(c => c.type === 'expense').map(cat => (
                    <div key={cat.id} className="bg-[#000839] border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-slate-500 hover:text-red-400 transition-all p-1 hover:bg-slate-900 rounded-lg cursor-pointer"
                        title="حذف الفئة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-slate-200">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks Categories */}
              <div className="bg-[#050E46] border border-slate-800 rounded-3xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-3 text-right">فئات وتصنيفات العمليات الميدانية ({categories.filter(c => c.type === 'task').length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.filter(c => c.type === 'task').map(cat => (
                    <div key={cat.id} className="bg-[#000839] border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-slate-500 hover:text-red-400 transition-all p-1 hover:bg-slate-900 rounded-lg cursor-pointer"
                        title="حذف الفئة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-slate-200">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: Broadcaster */}
        {activeTab === 'broadcast' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Broadcaster form */}
            <div className="bg-[#050E46] border border-slate-800 rounded-3xl p-5 shadow-xl h-fit">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#76BC21]" />
                <span>إنشاء وبث تنبيه فوري</span>
              </h2>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-300 block">عنوان الإشعار</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="مثال: إشعار ببدء جرد مخازن العاصمة"
                    className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-300 block">محتوى التنبيه والقرارات المرفقة</label>
                  <textarea
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder="اكتب تفاصيل التنبيه الموجه للعمال..."
                    rows={4}
                    className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none resize-none"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-300 block">المستهدف بالإشعار</label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value as 'all' | 'specific')}
                    className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none text-white"
                  >
                    <option value="all">بث عام (جميع الموظفين)</option>
                    <option value="specific">توجيه موظف محدد فقط</option>
                  </select>
                </div>

                {broadcastTarget === 'specific' && (
                  <div className="space-y-1.5 text-right animate-fadeIn">
                    <label className="text-xs font-semibold text-slate-300 block">اختر الموظف المستهدف</label>
                    <select
                      value={broadcastTargetUid}
                      onChange={(e) => setBroadcastTargetUid(e.target.value)}
                      className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none text-white"
                      required
                    >
                      <option value="">-- اختر موظف نشط --</option>
                      {users.filter(u => u.role === 'worker' && u.isActive).map(w => (
                        <option key={w.uid} value={w.uid}>{w.fullName}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow transition-all"
                >
                  بث الإشعار الآن
                </button>
              </form>
            </div>

            {/* Sent notifications history */}
            <div className="lg:col-span-2 bg-[#050E46] border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4 text-right flex items-center justify-between">
                <span>سجل الإشعارات الموجهة للعمال</span>
                <span className="text-xs font-normal text-slate-400">إجمالي المرسل: {notifications.length}</span>
              </h3>

              {notifications.length === 0 ? (
                <p className="text-center py-12 text-xs text-slate-500">لا توجد إشعارات سابقة مرسلة</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="bg-[#000839] border border-slate-800/80 p-4 rounded-2xl text-right">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          notif.targetType === 'all' ? 'bg-[#76BC21]/15 text-[#76BC21]' : 'bg-blue-900/40 text-blue-300'
                        }`}>
                          {notif.targetType === 'all' ? 'بث عام للجميع' : 'موجه لموظف محدد'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(notif.createdAt).toLocaleDateString('ar-DZ')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">{notif.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{notif.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Account & Staff Management Tab */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Single Col: Add New Employee Account */}
            <div className="bg-[#050E46] border border-slate-800 rounded-3xl p-5 shadow-xl h-fit">
              <h3 className="text-sm font-bold text-white mb-4 text-right flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#76BC21]" />
                <span>تسجيل حساب موظف جديد</span>
              </h3>

              <form onSubmit={handleRegisterUser} className="space-y-4 text-right">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">الاسم الكامل للموظف</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="مثال: عبد القادر الجزائري"
                    className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">اسم المستخدم لتسجيل الدخول (لاتيني)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono select-none" dir="ltr">@benamar.local</span>
                    <input
                      type="text"
                      value={newUserEmailPrefix}
                      onChange={(e) => setNewUserEmailPrefix(e.target.value)}
                      placeholder="مثال: kader"
                      dir="ltr"
                      className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl pl-32 pr-4 py-2.5 text-xs text-left focus:outline-none text-white font-mono"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">اسم مبسط يكتبه الموظف لتسجيل الدخول بسرعة وسرية.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">صلاحيات الحساب في النظام</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'worker' | 'admin')}
                    className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-3 py-2.5 text-xs text-right focus:outline-none text-white"
                    required
                  >
                    <option value="worker">موظف ميداني (وصول محدود للعمليات والمهام)</option>
                    <option value="admin">مدير نظام (وصول كامل للاعتمادات والمصاريف والتقارير)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">كلمة المرور الافتراضية</label>
                  <input
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="123456"
                    dir="ltr"
                    className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-2.5 text-xs text-left focus:outline-none text-white font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow transition-all mt-2"
                >
                  إنشاء الحساب وتفعيله فوراً
                </button>
              </form>
            </div>

            {/* Right/Double Col: Registered Staff Directory */}
            <div className="lg:col-span-2 bg-[#050E46] border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h3 className="text-sm font-bold text-white text-right">
                  <span>سجل طاقم العمل وموظفي المؤسسة</span>
                  <span className="text-xs font-normal text-slate-400 block mt-0.5">إجمالي المسجلين: {users.length} موظف</span>
                </h3>

                {/* Search bar inside Directory */}
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    placeholder="ابحث باسم الموظف..."
                    className="bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl pr-9 pl-3 py-1.5 text-xs text-right text-white focus:outline-none w-full sm:w-48 placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {users
                  .filter(u => u.fullName.toLowerCase().includes(userSearchText.toLowerCase()) || u.email.toLowerCase().includes(userSearchText.toLowerCase()))
                  .map((user) => {
                    const isSelf = user.uid === currentUser.uid;
                    const defaultUserPass = user.password || (user.role === 'admin' ? 'admin123' : '123456');

                    return (
                      <div 
                        key={user.uid} 
                        className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 transition-all text-right ${
                          user.isActive 
                            ? 'bg-[#000839] border-slate-800/80' 
                            : 'bg-red-950/5 border-red-950/25 opacity-70'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Circular Avatar Graphic with First Letter */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            user.role === 'admin' ? 'bg-[#76BC21]/15 text-[#76BC21]' : 'bg-blue-900/40 text-blue-300'
                          }`}>
                            {user.fullName.trim().charAt(0)}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-white">{user.fullName}</h4>
                              {isSelf && (
                                <span className="bg-[#76BC21]/10 text-[#76BC21] text-[8px] font-black px-1.5 py-0.5 rounded-full">أنت</span>
                              )}
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                                user.role === 'admin' ? 'bg-[#76BC21]/15 text-[#76BC21]' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {user.role === 'admin' ? 'إدارة عليا' : 'موظف ميداني'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                              <span dir="ltr">📧 {user.email}</span>
                              <span>•</span>
                              <span dir="ltr" className="text-slate-400">🔑 {defaultUserPass}</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Row Controls */}
                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                          {/* Status Badge */}
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            user.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {user.isActive ? 'نشط في الفروع' : 'موقف ومحجوب'}
                          </span>

                          {/* Toggle status */}
                          <button
                            onClick={() => handleToggleUserActive(user.uid)}
                            disabled={isSelf}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all border ${
                              isSelf 
                                ? 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed' 
                                : user.isActive 
                                  ? 'bg-red-950/20 hover:bg-red-950/40 text-red-400 border-red-950/40 hover:border-red-900/40' 
                                  : 'bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border-emerald-950/40 hover:border-emerald-900/40'
                            }`}
                          >
                            {user.isActive ? 'حظر الدخول' : 'تفعيل الحساب'}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteUser(user.uid)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-xl cursor-pointer transition-all border ${
                              isSelf 
                                ? 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed' 
                                : 'bg-slate-900 hover:bg-red-950 hover:text-red-400 border-slate-800 hover:border-red-900/60 text-slate-400'
                            }`}
                            title="حذف نهائي"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Review & Approve Expense Dialog */}
      {selectedExpenseForReview && (
        <div className="fixed inset-0 bg-[#00021c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#050E46] border border-slate-800 rounded-3xl p-6 shadow-2xl relative" dir="rtl">
            <button 
              onClick={() => setSelectedExpenseForReview(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-white mb-5 text-right border-b border-slate-800 pb-3">مراجعة وتدقيق الفاتورة</h3>

            <div className="space-y-4 text-right text-xs leading-relaxed">
              <div className="bg-[#000839] p-4 rounded-2xl space-y-2 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">الموظف المشتري:</span>
                  <span className="font-bold text-white">{selectedExpenseForReview.workerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">التصنيف المحاسبي:</span>
                  <span className="font-extrabold text-[#76BC21]">{selectedExpenseForReview.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">قيمة المصروف:</span>
                  <span className="font-black text-white text-base font-mono">{selectedExpenseForReview.amount.toLocaleString()} د.ج</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">توقيت الطلب:</span>
                  <span className="font-mono text-slate-400">{new Date(selectedExpenseForReview.createdAt).toLocaleString('ar-DZ')}</span>
                </div>
              </div>

              <div>
                <span className="block text-slate-400 font-bold mb-1">البيان والسبب:</span>
                <p className="bg-[#000839] p-3 rounded-xl border border-slate-800 text-slate-200">{selectedExpenseForReview.description}</p>
              </div>

              {/* Receipt Image simulation */}
              <div>
                <span className="block text-slate-400 font-bold mb-1.5">نسخة الفاتورة الموثقة (صورة حقيقية):</span>
                {selectedExpenseForReview.receiptImage ? (
                  <div className="rounded-2xl border border-slate-800 overflow-hidden relative">
                    <img 
                      src={selectedExpenseForReview.receiptImage} 
                      alt="Receipt Document" 
                      className="w-full max-h-56 object-contain bg-slate-950" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="h-44 bg-slate-950 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-center p-4">
                    <AlertCircle className="w-8 h-8 text-amber-500/70 mb-2" />
                    <span className="text-xs font-bold text-slate-400">تم إرسال الفاتورة عبر محاكاة الميدان الرقمي</span>
                    <span className="text-[10px] text-slate-600 mt-1">رقم مرجعي: FBM-BILL-{selectedExpenseForReview.id.toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/60">
                <button
                  onClick={() => handleReviewExpense(selectedExpenseForReview.id, 'rejected')}
                  className="bg-red-950/40 hover:bg-red-900/30 border border-red-900/60 text-red-300 font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>رفض الطلب</span>
                </button>
                <button
                  onClick={() => handleReviewExpense(selectedExpenseForReview.id, 'approved')}
                  className="bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد وقبول مالي</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-[#00021c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#050E46] border border-slate-800 rounded-3xl p-6 shadow-2xl relative" dir="rtl">
            <button 
              onClick={() => setShowTaskModal(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-white mb-5 text-right border-b border-slate-800 pb-3">إسناد وتكليف مهمة ميدانية جديدة</h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">عنوان العملية</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="مثال: توصيل دفعة الشوكولاتة لمستودع وهران"
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">تفصيل التعليمات التشغيلية</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="اكتب التوجيهات الدقيقة، الأوقات، وأرقام مستلمي الحاويات..."
                  rows={4}
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-300 block">تعيين للموظف الميداني</label>
                  <select
                    value={newTaskWorkerUid}
                    onChange={(e) => setNewTaskWorkerUid(e.target.value)}
                    className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-3 py-2.5 text-xs text-right focus:outline-none text-white"
                    required
                  >
                    <option value="">-- اختر موظف نشط --</option>
                    {users.filter(u => u.role === 'worker' && u.isActive).map(w => (
                      <option key={w.uid} value={w.uid}>{w.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-300 block">فئة وتصنيف العملية</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-3 py-2.5 text-xs text-right focus:outline-none text-white"
                    required
                  >
                    <option value="">-- اختر الفئة المعتمدة --</option>
                    {categories.filter(c => c.type === 'task').map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-bold py-3 rounded-xl text-xs cursor-pointer shadow transition-all mt-4"
              >
                تثبيت التكليف وإبلاغ الموظف فوراً
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

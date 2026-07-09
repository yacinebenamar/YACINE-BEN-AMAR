import React, { useState, useRef, useEffect } from 'react';
import { AppUser, CompanyCategory, CompanyTask, CompanyExpense, CompanyNotification } from '../types';
import { 
  Plus, Camera, Check, Clock, Bell, LogOut, X, AlertCircle, 
  Sparkles, CheckCircle2, ChevronRight, HelpCircle, RefreshCw, Send
} from 'lucide-react';
import NotificationPopover from './NotificationPopover';

interface WorkerDashboardProps {
  currentUser: AppUser;
  users: AppUser[];
  categories: CompanyCategory[];
  tasks: CompanyTask[];
  expenses: CompanyExpense[];
  notifications: CompanyNotification[];
  onLogout: () => void;
  onAddExpense: (expense: CompanyExpense) => void;
  onUpdateTaskStatus: (taskId: string, status: 'in_progress' | 'done', timestamp: string) => void;
  onUpdateNotifications: (newNotifications: CompanyNotification[]) => void;
}

export default function WorkerDashboard({
  currentUser,
  users,
  categories,
  tasks,
  expenses,
  notifications,
  onLogout,
  onAddExpense,
  onUpdateTaskStatus,
  onUpdateNotifications
}: WorkerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'tasks'>('expenses');
  
  const triggerNotificationPopover = () => {
    const bellBtn = document.getElementById('notification-bell-btn');
    if (bellBtn) {
      bellBtn.click();
    }
  };
  
  // New expense form state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  
  // Camera simulation state
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'real' | 'simulated'>('simulated');
  const [simulatedBillType, setSimulatedBillType] = useState('وقود وتعبئة مازوت');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter lists specifically for current worker
  const myExpenses = expenses.filter(e => e.workerUid === currentUser.uid);
  const myTasks = tasks.filter(t => t.assignedToUid === currentUser.uid);
  const myNotifications = notifications.filter(n => n.targetType === 'all' || n.targetUid === currentUser.uid);
  const unreadNotifsCount = myNotifications.filter(n => !n.isRead).length;

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraMode('real');
    } catch (err) {
      console.warn('Real camera not available or permission denied, fallback to simulated receipt scanner.', err);
      setCameraMode('simulated');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (cameraMode === 'real' && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    } else {
      // Simulate highly realistic Algerian Invoice Snapshot!
      generateSimulatedInvoice();
    }
  };

  const generateSimulatedInvoice = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background paper texture
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 600, 800);

    // Vignette/Shadows to look like a photographed paper
    const gradient = ctx.createRadialGradient(300, 400, 100, 300, 400, 500);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 800);

    // Decorative receipt border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 560, 760);

    // Arabic Header
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Cairo", sans-serif';
    ctx.fillText('الجمهورية الجزائرية الديمقراطية الشعبية', 300, 60);
    ctx.font = 'bold 16px "Cairo", sans-serif';
    ctx.fillText('وزارة التجارة وترقية الصادرات', 300, 90);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 105);
    ctx.lineTo(500, 105);
    ctx.stroke();

    // Bill Details
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px "Cairo", sans-serif';
    ctx.fillText('فاتورة شراء وتوريد', 300, 145);

    ctx.textAlign = 'right';
    ctx.font = '14px "Cairo", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`الرقم التسلسلي: FBM-B-${Math.floor(100000 + Math.random() * 900000)}`, 540, 200);
    ctx.fillText(`التاريخ: ${new Date().toLocaleDateString('ar-DZ')}`, 540, 225);
    ctx.fillText('الجهة المصدرة: محطة خدمات ونقل الإخوة بن عمر ش.ذ.م.م', 540, 250);
    ctx.fillText(`اسم المقتني: ${currentUser.fullName}`, 540, 275);

    // Table of items
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 310, 520, 200);
    ctx.beginPath();
    ctx.moveTo(40, 350); ctx.lineTo(560, 350);
    ctx.moveTo(180, 310); ctx.lineTo(180, 510); // amount col
    ctx.moveTo(350, 310); ctx.lineTo(350, 510); // qty col
    ctx.stroke();

    // Table Headers
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px "Cairo", sans-serif';
    ctx.fillText('المجموع د.ج', 170, 335);
    ctx.fillText('الكمية / التفصيل', 340, 335);
    ctx.fillText('بيان المواد المشتراة', 540, 335);

    // Row 1
    ctx.font = '14px "Cairo", sans-serif';
    ctx.fillText(`${expenseAmount || '0'} د.ج`, 170, 385);
    ctx.fillText('وحدة كاملة / ميداني', 340, 385);
    ctx.fillText(expenseDesc || simulatedBillType, 540, 385);

    // Stamp Circle Simulation (Algerian administration style)
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.65)'; // red stamp
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(420, 620, 65, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = 'rgba(220, 38, 38, 0.65)';
    ctx.font = 'bold 11px "Cairo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('مجموعة الإخوة بن عمر', 420, 600);
    ctx.fillText('FBM الجزائر', 420, 620);
    ctx.fillText('مقبول وصالح', 420, 640);

    // Signature
    ctx.font = 'italic 12px "Courier New"';
    ctx.fillStyle = '#1e3a8a'; // blue ink signature
    ctx.fillText('BenAmar_Sign', 420, 690);

    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseCategory) return;

    const newExpense: CompanyExpense = {
      id: `exp_${Date.now()}`,
      workerUid: currentUser.uid,
      workerName: currentUser.fullName,
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      description: expenseDesc || `طلب مصروف لفئة ${expenseCategory}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      receiptImage: capturedImage
    };

    onAddExpense(newExpense);
    setShowExpenseModal(false);
    setExpenseAmount('');
    setExpenseDesc('');
    setExpenseCategory('');
    setCapturedImage(null);
  };

  return (
    <div className="min-h-screen bg-[#000839] text-white flex flex-col pb-16 select-none">
      
      {/* Header and greeting */}
      <div className="bg-[#050E46] border-b border-slate-800 p-4 md:p-6 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4" dir="rtl">
          
          {/* Worker Profile Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#76BC21]/15 rounded-xl border border-[#76BC21]/30 flex items-center justify-center text-[#76BC21] font-bold">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-[#76BC21] font-extrabold">مرحباً بك في الخدمة</span>
              <h2 className="text-sm font-bold text-white leading-tight">{currentUser.fullName}</h2>
            </div>
          </div>

          {/* Logo brand and quick logout */}
          <div className="flex items-center gap-3">
            <NotificationPopover
              notifications={notifications}
              onUpdateNotifications={onUpdateNotifications}
              currentUser={currentUser}
              align="right"
            />
            
            <button
              onClick={onLogout}
              className="p-2.5 bg-[#000839] border border-slate-800 hover:border-red-900/60 rounded-xl hover:text-red-400 transition-all cursor-pointer"
              title="خروج آمن"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <div className="bg-[#76BC21] text-white px-3 py-2 rounded-xl text-[10px] font-black tracking-wider">
              FBM ERP
            </div>
          </div>

        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4 overflow-y-auto" dir="rtl">
        
        {/* Responsive layout guides */}
        <div className="bg-[#050E46] border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between text-xs text-right">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#76BC21] w-4 h-4 shrink-0 animate-pulse" />
            <span className="text-slate-300 font-medium">مستوى الإرسال والربط الميداني: <strong className="text-emerald-400">ممتاز</strong></span>
          </div>
          <span className="text-[10px] bg-[#000839] px-2.5 py-1 rounded-lg border border-slate-800 text-slate-500 font-mono">3000-CLIENT-ONLINE</span>
        </div>

        {/* Tab content area */}
        
        {/* Expenses List */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">سجل المصاريف والفواتير المرفوعة</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">تتبع الفواتير وقبولها المالي من الإدارة</p>
              </div>
              <button
                onClick={() => {
                  setShowExpenseModal(true);
                  startCamera();
                }}
                className="bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-[#76BC21]/15"
              >
                <Plus className="w-4 h-4 font-black" />
                <span>إضافة طلب مصروف</span>
              </button>
            </div>

            {myExpenses.length === 0 ? (
              <div className="bg-[#050E46]/40 border border-dashed border-slate-800 p-12 rounded-3xl text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs font-bold text-slate-400">لا توجد مصاريف أو عهد مسجلة باسمك بعد</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  عند شراء وقود، قطع غيار، أو تكاليف تفريغ، انقر على زر الإضافة لتصوير الفاتورة ورفعها فوراً.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myExpenses.map((expense) => (
                  <div 
                    key={expense.id}
                    className="bg-[#050E46] border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-[#76BC21]/10 text-[#76BC21] px-2.5 py-0.5 rounded-full">
                          {expense.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(expense.createdAt).toLocaleDateString('ar-DZ')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-relaxed">{expense.description}</h4>
                      
                      {expense.receiptImage && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1">
                          <Check className="w-3 h-3" />
                          <span>تم إرفاق الفاتورة المصورة</span>
                        </div>
                      )}
                    </div>

                    <div className="text-left shrink-0 space-y-2">
                      <span className="block text-sm font-black text-white font-mono">{expense.amount.toLocaleString()} د.ج</span>
                      
                      <div>
                        {expense.status === 'approved' && (
                          <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                            معتمدة ومقبولة
                          </span>
                        )}
                        {expense.status === 'rejected' && (
                          <span className="bg-red-500/15 border border-red-500/30 text-red-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                            مرفوضة
                          </span>
                        )}
                        {expense.status === 'pending' && (
                          <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold animate-pulse">
                            قيد المراجعة الإدارية
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tasks List */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">المهام الميدانية والعمليات الموكلة إليك</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">سجل تقدّمك الفعلي ليتمكن المديرون من مراقبة الفروع</p>
            </div>

            {myTasks.length === 0 ? (
              <div className="bg-[#050E46]/40 border border-dashed border-slate-800 p-12 rounded-3xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#76BC21] mx-auto" />
                <h4 className="text-xs font-bold text-slate-400">ممتاز! لا توجد مهام ميدانية نشطة حالياً</h4>
                <p className="text-[10px] text-slate-500">استمتع بيومك الميداني، وسيصلك إشعار فوري عند تكليفك بأي عملية.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="bg-[#050E46] border border-slate-800 rounded-2xl p-4 space-y-3.5 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 pb-3">
                      <div className="space-y-0.5 text-right">
                        <span className="text-[9px] font-extrabold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                          {task.categoryName}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-1">{task.title}</h4>
                      </div>

                      {/* Status indicator badge */}
                      <div>
                        {task.status === 'done' && (
                          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                            عملية منجزة
                          </span>
                        )}
                        {task.status === 'in_progress' && (
                          <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold animate-pulse">
                            جاري التنفيذ
                          </span>
                        )}
                        {task.status === 'pending' && (
                          <span className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                            بانتظار البدء
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desc */}
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{task.description}</p>

                    {/* Timestamps log if any */}
                    {(task.startedAt || task.completedAt) && (
                      <div className="bg-[#000839]/40 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1">
                        {task.startedAt && (
                          <div className="flex justify-between items-center">
                            <span>توقيت بدء العمل:</span>
                            <span className="font-mono text-slate-300">{new Date(task.startedAt).toLocaleString('ar-DZ')}</span>
                          </div>
                        )}
                        {task.completedAt && (
                          <div className="flex justify-between items-center text-emerald-400">
                            <span>توقيت إتمام الإنجاز:</span>
                            <span className="font-mono">{new Date(task.completedAt).toLocaleString('ar-DZ')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lifecycle Action Buttons */}
                    <div className="flex gap-2 justify-end border-t border-slate-800/40 pt-3">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => onUpdateTaskStatus(task.id, 'in_progress', new Date().toISOString())}
                          className="bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                        >
                          تأكيد وبدء العمل الآن
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => onUpdateTaskStatus(task.id, 'done', new Date().toISOString())}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                        >
                          تم إنجاز وتأدية المهمة بنجاح
                        </button>
                      )}
                      {task.status === 'done' && (
                        <span className="text-emerald-400 font-extrabold text-xs flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>شكرًا لك! تم تسجيل الإنجاز لدى الإدارة</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



      </div>

      {/* Navigation bottom bar for Mobile-feel, aligned dynamically */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#050E46] border-t border-slate-800 p-2 flex justify-around items-center z-40 max-w-4xl mx-auto rounded-t-2xl shadow-2xl">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'expenses' ? 'text-[#76BC21]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span className="text-[9px] font-bold">مصاريفي</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'tasks' ? 'text-[#76BC21]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[9px] font-bold">مهامي الميدانية</span>
        </button>

        <button
          onClick={triggerNotificationPopover}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative text-slate-400 hover:text-white"
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -left-1 bg-red-500 w-2.5 h-2.5 rounded-full animate-ping"></span>
            )}
          </div>
          <span className="text-[9px] font-bold">الإشعارات</span>
        </button>
      </div>

      {/* Add Expense Form Sheet Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-[#00021c]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#050E46] border border-slate-800 rounded-3xl p-6 shadow-2xl relative" dir="rtl">
            <button 
              onClick={() => {
                setShowExpenseModal(false);
                stopCamera();
                setShowCamera(false);
              }}
              className="absolute left-4 top-4 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-white mb-5 text-right border-b border-slate-800 pb-3">تسجيل ورفع طلب مصروفات ميداني</h3>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">المبلغ المالي المشتري به (دينار جزائري - د.ج)</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="مثال: 4500"
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-3 text-xs text-right focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">البيان وتفصيل وجه الصرف ورقم الشاحنة/المستودع</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="مثال: شراء مبرد مياه للمستودع"
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-3 text-xs text-right focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">التصنيف والتبويب المحاسبي</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-3 py-3 text-xs text-right focus:outline-none text-white"
                  required
                >
                  <option value="">-- اختر التصنيف الأساسي --</option>
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Receipt Image / Camera Upload block */}
              <div className="space-y-2 text-right">
                <label className="text-xs font-semibold text-slate-300 block">توثيق صورة الفاتورة أو الإيصال المالي</label>
                
                {capturedImage ? (
                  <div className="rounded-2xl border border-slate-800 overflow-hidden relative bg-slate-950 p-2 flex flex-col items-center">
                    <img src={capturedImage} alt="Receipt Preview" className="max-h-44 object-contain rounded-xl" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedImage(null);
                        startCamera();
                        setShowCamera(true);
                      }}
                      className="mt-2 text-xs text-[#76BC21] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة تصوير المستند</span>
                    </button>
                  </div>
                ) : showCamera ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden relative p-4 flex flex-col items-center justify-center">
                    
                    {cameraMode === 'real' ? (
                      <div className="w-full flex flex-col items-center">
                        <video ref={videoRef} className="w-full max-h-44 bg-black object-cover rounded-xl" playsInline />
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                    ) : (
                      <div className="text-center p-4 space-y-3 w-full">
                        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2">
                          <span className="block text-[10px] text-slate-500 font-bold">محاكاة الفاتورة الرقمية الجزائرية الفورية</span>
                          
                          <div className="space-y-1">
                            <label className="block text-[9px] text-slate-400">اختر نوع الإيصال المحاكي:</label>
                            <select
                              value={simulatedBillType}
                              onChange={(e) => setSimulatedBillType(e.target.value)}
                              className="w-full bg-[#000839] border border-slate-800 rounded-lg p-1.5 text-[11px] text-white"
                            >
                              <option value="وقود وتعبئة مازوت شاحنة فوسو">وقود وتعبئة مازوت شاحنة فوسو</option>
                              <option value="قطع غيار رافعة المستودع الرئيسي">قطع غيار رافعة المستودع الرئيسي</option>
                              <option value="شراء قرطاسية وأختام ومستلزمات">شراء قرطاسية وأختام ومستلزمات</option>
                              <option value="شراء غداء لعمال الشحن والتفريغ">شراء غداء لعمال الشحن والتفريغ</option>
                            </select>
                          </div>
                        </div>
                        <p className="text-[10px] text-[#76BC21]">🤖 يقوم النظام بنمذجة الإيصال بالختم الرسمي الفوري</p>
                      </div>
                    )}

                    <div className="flex gap-2 w-full mt-3">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>التقاط وحفظ الصورة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          setShowCamera(false);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-xs text-slate-300 cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>

                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCamera(true);
                      startCamera();
                    }}
                    className="w-full bg-[#000839] border border-dashed border-slate-800 hover:border-[#76BC21] p-6 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <Camera className="w-7 h-7 text-[#76BC21] mb-2" />
                    <span className="text-xs font-bold">اضغط هنا لفتح آلة تصوير الفاتورة</span>
                    <span className="text-[10px] text-slate-500 mt-1">تأكد من وضوح السعر والختم لضمان الاعتماد المالي السريع</span>
                  </button>
                )}

              </div>

              <button
                type="submit"
                className="w-full bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all mt-4"
              >
                إرسال طلب المصروف للاعتماد الفوري
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

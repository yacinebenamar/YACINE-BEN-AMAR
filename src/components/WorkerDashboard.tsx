import React, { useState, useRef, useEffect } from 'react';
import { AppUser, CompanyCategory, CompanyTask, CompanyExpense, CompanyNotification, AttendanceRecord, ChatMessage, StockTransfer, ClientOrder, CamionRoute } from '../types';
import { 
  Plus, Camera, Check, Clock, Bell, LogOut, X, AlertCircle, 
  Sparkles, CheckCircle2, ChevronRight, HelpCircle, RefreshCw, Send,
  Smartphone, Download, Globe, MapPin, ShieldCheck, Calendar, UserCheck, MessageSquare, Briefcase,
  Truck, FileText, Package, Search, Trash2, List
} from 'lucide-react';
import { playNotificationChime } from '../utils/audio';
import NotificationPopover from './NotificationPopover';
import TaskSignatureModal from './TaskSignatureModal';

interface WorkerDashboardProps {
  currentUser: AppUser;
  users: AppUser[];
  categories: CompanyCategory[];
  tasks: CompanyTask[];
  expenses: CompanyExpense[];
  notifications: CompanyNotification[];
  attendance: AttendanceRecord[];
  chatMessages: ChatMessage[];
  onLogout: () => void;
  onAddExpense: (expense: CompanyExpense) => void;
  onUpdateTaskStatus: (
    taskId: string, 
    status: 'in_progress' | 'done', 
    timestamp: string,
    signatureImage?: string | null,
    locationGPS?: { lat: number; lng: number } | null
  ) => void;
  onUpdateNotifications: (newNotifications: CompanyNotification[]) => void;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onAddChatMessage: (msg: ChatMessage) => void;
  transfers?: StockTransfer[];
  clientOrders?: ClientOrder[];
  clientDebts?: any[];
  camionRoutes?: CamionRoute[];
  supplierAlerts?: any[];
  onAddTransfer?: (t: StockTransfer) => Promise<void>;
  onUpdateTransfer?: (t: StockTransfer) => Promise<void>;
  onDeleteTransfer?: (id: string) => Promise<void>;
  onAddClientOrder?: (o: ClientOrder) => Promise<void>;
  onUpdateClientOrder?: (o: ClientOrder) => Promise<void>;
  onDeleteClientOrder?: (id: string) => Promise<void>;
  onAddClientDebt?: any;
  onUpdateClientDebt?: any;
  onDeleteClientDebt?: any;
  onAddCamionRoute?: any;
  onUpdateCamionRoute?: any;
  onDeleteCamionRoute?: any;
  onAddSupplierAlert?: any;
  onUpdateSupplierAlert?: any;
  onDeleteSupplierAlert?: any;
  
  // View switcher and privileged operations props
  isPrivileged?: boolean;
  adminViewMode?: 'admin' | 'worker';
  onToggleViewMode?: () => void;
  onDeleteExpense?: (id: string) => Promise<void>;
}

export default function WorkerDashboard({
  currentUser,
  users,
  categories,
  tasks,
  expenses,
  notifications,
  attendance,
  chatMessages,
  onLogout,
  onAddExpense,
  onUpdateTaskStatus,
  onUpdateNotifications,
  onUpdateAttendance,
  onAddChatMessage,
  transfers = [],
  clientOrders = [],
  clientDebts = [],
  camionRoutes = [],
  supplierAlerts = [],
  onAddTransfer,
  onUpdateTransfer,
  onDeleteTransfer,
  onAddClientOrder,
  onUpdateClientOrder,
  onDeleteClientOrder,
  onAddClientDebt,
  onUpdateClientDebt,
  onDeleteClientDebt,
  onAddCamionRoute,
  onUpdateCamionRoute,
  onDeleteCamionRoute,
  onAddSupplierAlert,
  onUpdateSupplierAlert,
  onDeleteSupplierAlert,
  
  // Extracted switcher and privileged props
  isPrivileged = false,
  adminViewMode = 'worker',
  onToggleViewMode,
  onDeleteExpense
}: WorkerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'tasks' | 'attendance' | 'chat' | 'transfers' | 'orders' | 'camion'>('expenses');

  // Stock transfers local states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferPartName, setTransferPartName] = useState('');
  const [transferQuantity, setTransferQuantity] = useState('');
  const [transferFrom, setTransferFrom] = useState('ديبو / المستودع الرئيسي 🏢');
  const [transferTo, setTransferTo] = useState('محل البيع والتجزئة 🏪');
  const [transferSearch, setTransferSearch] = useState('');

  // Client orders local states
  const [showClientOrderModal, setShowClientOrderModal] = useState(false);
  const [orderClientName, setOrderClientName] = useState('');
  const [orderPartNames, setOrderPartNames] = useState('');
  const [orderDeliveryDate, setOrderDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderBonNo, setOrderBonNo] = useState('');
  
  // Real-time task assignment states and tracking
  const [newlyAssignedTask, setNewlyAssignedTask] = useState<CompanyTask | null>(null);
  const seenTaskIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);
  
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unknown'
  );

  const handleTestNotificationSettings = async () => {
    // 1. Play soft chime immediately
    playNotificationChime();
    
    // 2. Request Notification Permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermissionGranted(permission);
      
      if (permission === 'granted') {
        // Trigger a native test notification
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('مجموعة بن عمر - اختبار الاتصال 🔔', {
              body: 'تنبيهات الصوت والنظام تعمل بشكل ممتاز الآن على جوالك!',
              icon: 'https://img.icons8.com/color/192/delivery.png',
              vibrate: [100, 50, 100]
            } as any);
          }).catch(() => {
            new Notification('مجموعة بن عمر - اختبار الاتصال 🔔', {
              body: 'تنبيهات الصوت والنظام تعمل بشكل ممتاز الآن على جوالك!',
              icon: 'https://img.icons8.com/color/192/delivery.png'
            });
          });
        } else {
          new Notification('مجموعة بن عمر - اختبار الاتصال 🔔', {
            body: 'تنبيهات الصوت والنظام تعمل بشكل ممتاز الآن على جوالك!',
            icon: 'https://img.icons8.com/color/192/delivery.png'
          });
        }
      }
    }
  };
  
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
  const [submitMode, setSubmitMode] = useState<'approved' | 'pending'>('pending');
  
  // Signature capture state
  const [taskToSign, setTaskToSign] = useState<CompanyTask | null>(null);
  
  // Chat input state
  const [chatInput, setChatInput] = useState('');
  
  // Attendance biometric scan simulated state
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [attendanceGps, setAttendanceGps] = useState<{ lat: number; lng: number } | null>(null);
  const [attendanceGpsError, setAttendanceGpsError] = useState<string | null>(null);
  
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

  const approvedWorkerExpensesSum = myExpenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
  const pendingWorkerExpensesSum = myExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const completedWorkerTasksCount = myTasks.filter(t => t.status === 'done').length;
  const activeWorkerTasksCount = myTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Monitor real-time task assignments and alert immediately
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const myCurrentTasks = tasks.filter(t => t.assignedToUid === currentUser.uid);

    if (isFirstLoadRef.current) {
      // First load: just populate seen tasks so we don't alert old ones
      myCurrentTasks.forEach(t => seenTaskIdsRef.current.add(t.id));
      isFirstLoadRef.current = false;
      return;
    }

    // Check if there are any new tasks assigned to the worker
    const newTasks = myCurrentTasks.filter(t => !seenTaskIdsRef.current.has(t.id));

    if (newTasks.length > 0) {
      const latestNewTask = newTasks[0]; // notify about the most recent one
      setNewlyAssignedTask(latestNewTask);
      playNotificationChime();
      
      // Attempt browser native notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('📋 مهمة ميدانية جديدة موكلة إليك!', {
            body: `مهمة: ${latestNewTask.title}\nالتصنيف: ${latestNewTask.categoryName}`,
            icon: 'https://img.icons8.com/color/192/delivery.png'
          });
        } catch (e) {
          console.warn('Native notification failed', e);
        }
      }

      // Add all new tasks to the seen set so we don't notify repeatedly
      newTasks.forEach(t => seenTaskIdsRef.current.add(t.id));
    }
  }, [tasks, currentUser.uid]);

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

  const handleSignatureConfirm = (signatureImage: string, locationGPS: { lat: number; lng: number } | null) => {
    if (taskToSign) {
      onUpdateTaskStatus(taskToSign.id, 'done', new Date().toISOString(), signatureImage, locationGPS);
      setTaskToSign(null);
    }
  };

  const handleClockIn = async () => {
    setIsBiometricScanning(true);
    setAttendanceGpsError(null);
    
    let gpsCoordsToUse: { lat: number; lng: number } | null = null;
    
    // Request GPS
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<any>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        });
        gpsCoordsToUse = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setAttendanceGps(gpsCoordsToUse);
      } catch (err) {
        console.warn('GPS failed for attendance, using defaults:', err);
        setAttendanceGpsError('تعذر الحصول على إحداثيات الجي بي اس');
        gpsCoordsToUse = { lat: 36.7538, lng: 3.0588 };
        setAttendanceGps(gpsCoordsToUse);
      }
    } else {
      setAttendanceGpsError('نظام الجي بي اس غير مدعوم');
      gpsCoordsToUse = { lat: 36.7538, lng: 3.0588 };
      setAttendanceGps(gpsCoordsToUse);
    }

    // Simulate biometric scan & camera selfie capturing
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000839';
        ctx.fillRect(0, 0, 180, 180);
        
        ctx.fillStyle = '#76BC21';
        ctx.beginPath();
        ctx.arc(90, 70, 35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(90, 160, 60, Math.PI, 0);
        ctx.fill();
        
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, 90);
        ctx.lineTo(170, 90);
        ctx.stroke();
        
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('FACE RECOGNITION OK', 40, 110);
      }
      
      const selfieUrl = canvas.toDataURL('image/png');
      const todayStr = new Date().toISOString().split('T')[0];
      
      const record: AttendanceRecord = {
        id: `att_${currentUser.uid}_${todayStr}`,
        workerUid: currentUser.uid,
        workerName: currentUser.fullName,
        clockInTime: new Date().toISOString(),
        clockOutTime: null,
        clockInGPS: gpsCoordsToUse || { lat: 36.7538, lng: 3.0588 },
        clockOutGPS: null,
        selfieImage: selfieUrl,
        date: todayStr
      };

      onUpdateAttendance(record);
      setIsBiometricScanning(false);
      
      const pTime = new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
      onAddChatMessage({
        id: `chat_att_${Date.now()}`,
        senderUid: 'system',
        senderName: 'نظام الحضور الميداني 🟢',
        senderRole: 'admin',
        text: `الموظف ${currentUser.fullName} قام بـ تسجيل حضور وبدء يوم العمل الميداني في الساعة ${pTime}`,
        createdAt: new Date().toISOString()
      });
    }, 1500);
  };

  const handleClockOut = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const activeRec = attendance.find(r => r.workerUid === currentUser.uid && r.date === todayStr && !r.clockOutTime);
    if (!activeRec) return;

    setIsBiometricScanning(true);
    let gpsCoordsToUse: { lat: number; lng: number } | null = null;
    
    // Request GPS
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<any>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        });
        gpsCoordsToUse = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      } catch (err) {
        gpsCoordsToUse = { lat: 36.7538, lng: 3.0588 };
      }
    } else {
      gpsCoordsToUse = { lat: 36.7538, lng: 3.0588 };
    }

    const updated: AttendanceRecord = {
      ...activeRec,
      clockOutTime: new Date().toISOString(),
      clockOutGPS: gpsCoordsToUse
    };
    onUpdateAttendance(updated);
    setIsBiometricScanning(false);
    
    const pTime = new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
    onAddChatMessage({
      id: `chat_att_${Date.now()}`,
      senderUid: 'system',
      senderName: 'نظام الحضور الميداني 🔴',
      senderRole: 'admin',
      text: `الموظف ${currentUser.fullName} قام بـ تسجيل انصراف ونهاية ساعات العمل الميدانية في الساعة ${pTime}`,
      createdAt: new Date().toISOString()
    });
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderUid: currentUser.uid,
      senderName: currentUser.fullName,
      senderRole: 'worker',
      text: chatInput.trim(),
      createdAt: new Date().toISOString()
    };
    onAddChatMessage(msg);
    setChatInput('');
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseCategory) return;

    const finalStatus = isPrivileged ? submitMode : 'pending';

    const newExpense: CompanyExpense = {
      id: `exp_${Date.now()}`,
      workerUid: currentUser.uid,
      workerName: currentUser.fullName,
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      description: expenseDesc || `${isPrivileged ? 'تسجيل مصروف' : 'طلب مصروف'} لفئة ${expenseCategory}`,
      status: finalStatus,
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

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferPartName || !transferQuantity) return;

    const newTransfer: StockTransfer = {
      id: `tr_${Date.now()}`,
      itemName: transferPartName.trim(),
      partName: transferPartName.trim(),
      quantity: parseFloat(transferQuantity),
      fromLocation: transferFrom,
      toLocation: transferTo,
      movedByUid: currentUser.uid,
      movedByName: currentUser.fullName,
      createdAt: new Date().toISOString(),
      status: 'pending',
      isEnteredInSalesSystem: false
    };

    if (onAddTransfer) {
      await onAddTransfer(newTransfer);
    }
    setShowTransferModal(false);
    setTransferPartName('');
    setTransferQuantity('');
    alert('✅ تم تسجيل طلب إحضار السلعة من الديبو إلى المحل بنجاح! بانتظار تأكيد النقل والمطابقة.');
  };

  const handleCreateClientOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderClientName || !orderPartNames) return;

    const partsList = orderPartNames.split(',').map(s => s.trim()).filter(Boolean);

    const newOrder: ClientOrder = {
      id: `ord_${Date.now()}`,
      clientName: orderClientName.trim(),
      bonNo: orderBonNo.trim() || `BON-${Math.floor(1000 + Math.random() * 9000)}`,
      deliveryDate: orderDeliveryDate,
      status: 'pending',
      items: partsList,
      createdAt: new Date().toISOString(),
      notes: orderNotes.trim()
    };

    if (onAddClientOrder) {
      await onAddClientOrder(newOrder);
    }
    setShowClientOrderModal(false);
    setOrderClientName('');
    setOrderPartNames('');
    setOrderBonNo('');
    setOrderNotes('');
    alert('✅ تم ملء وتسجيل البون غير المنجز بنجاح! سيظهر قيد التحضير والتوصيل.');
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
            {isPrivileged && onToggleViewMode && (
              <button
                onClick={onToggleViewMode}
                className="bg-emerald-600 hover:bg-emerald-500 text-[#000839] font-black px-3 py-2 rounded-xl text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-md active:scale-95 border border-emerald-500/20"
                title="التبديل إلى لوحة التحكم الإدارية"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#000839]" />
                <span>لوحة التحكم ⚙️</span>
              </button>
            )}

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
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 pb-28 space-y-4 overflow-y-auto" dir="rtl">
        
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

            {/* Contextual Stats for Worker Expenses */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#050E46] border border-slate-800/80 p-4 rounded-2xl text-right">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">المصاريف المعتمدة</span>
                <h3 className="text-sm font-black text-[#76BC21] font-mono">{approvedWorkerExpensesSum.toLocaleString()} د.ج</h3>
              </div>
              <div className="bg-[#050E46] border border-slate-800/80 p-4 rounded-2xl text-right">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">قيد المراجعة</span>
                <h3 className="text-sm font-black text-amber-500 font-mono">{pendingWorkerExpensesSum.toLocaleString()} د.ج</h3>
              </div>
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

                    <div className="text-left shrink-0 space-y-2 flex flex-col items-end">
                      <span className="block text-sm font-black text-white font-mono">{expense.amount.toLocaleString()} د.ج</span>
                      
                      <div className="flex items-center gap-2">
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

                        {isPrivileged && onDeleteExpense && (
                          <button
                            onClick={async () => {
                              if (confirm(`⚠️ هل أنت متأكد من رغبتك في حذف هذا المصروف نهائياً من النظام؟\nالبيان: "${expense.description}"`)) {
                                await onDeleteExpense(expense.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 transition-all cursor-pointer flex items-center justify-center shrink-0"
                            title="حذف هذا المصروف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Tasks List */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">المهام الميدانية والعمليات الموكلة إليك</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">سجل تقدّمك الفعلي ليتمكن المديرون من مراقبة الفروع</p>
            </div>

            {/* Contextual Stats for Worker Tasks */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#050E46] border border-slate-800/80 p-4 rounded-2xl text-right">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">مهام نشطة</span>
                <h3 className="text-sm font-black text-sky-400 font-mono">{activeWorkerTasksCount} مهمة</h3>
              </div>
              <div className="bg-[#050E46] border border-slate-800/80 p-4 rounded-2xl text-right">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">مهام منجزة</span>
                <h3 className="text-sm font-black text-[#76BC21] font-mono">{completedWorkerTasksCount} مهمة</h3>
              </div>
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
                      <div className="space-y-1.5 text-right">
                        <div className="flex flex-wrap gap-1.5 items-center justify-start">
                          <span className="text-[9px] font-extrabold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                            {task.categoryName}
                          </span>
                          {task.dueDate && (
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                              task.status === 'done' 
                                ? 'bg-slate-800/60 text-slate-400' 
                                : (new Date(task.dueDate).getTime() - Date.now() < 0) 
                                  ? 'bg-red-500/15 border border-red-500/30 text-red-400 animate-pulse'
                                  : (new Date(task.dueDate).getTime() - Date.now() <= 24 * 60 * 60 * 1000)
                                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse'
                                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            }`}>
                              <Clock className="w-2.5 h-2.5" />
                              <span>الموعد: {new Date(task.dueDate).toLocaleString('ar-DZ', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </span>
                          )}
                        </div>
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
                          onClick={() => setTaskToSign(task)}
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

        {/* Tab: Attendance System */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="bg-[#050E46] border border-slate-800 rounded-2xl p-5 space-y-4 text-right">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <UserCheck className="w-5 h-5 text-[#76BC21] shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white">إثبات الحضور الميداني والجي بي اس</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">تسجيل الدخول والخروج من العمل بالبصمة البيومترية والموقع</p>
                </div>
              </div>

              {/* Digital Time & Date Algiers Widget */}
              <div className="bg-[#000839] p-4 rounded-xl text-center space-y-1 border border-slate-800 relative overflow-hidden">
                <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>الجزائر (الجرينيتش +1)</span>
                </div>
                <h4 className="text-xl font-black font-mono text-white tracking-widest">
                  {new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </h4>
                <p className="text-[10px] text-[#76BC21] font-bold">
                  {new Date().toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {/* Active attendance control box */}
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const activeRecord = attendance.find(r => r.workerUid === currentUser.uid && r.date === todayStr && !r.clockOutTime);
                const alreadyFinishedToday = attendance.find(r => r.workerUid === currentUser.uid && r.date === todayStr && r.clockOutTime);

                if (isBiometricScanning) {
                  return (
                    <div className="bg-slate-950 p-8 border border-[#76BC21]/40 rounded-xl text-center space-y-4">
                      <div className="w-16 h-16 border-4 border-[#76BC21] border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-[#76BC21] animate-pulse">جاري فحص بصمة الوجه ومطابقة موقع GPS...</h4>
                        <p className="text-[10px] text-slate-500">نظام التحقق الذاتي فائق الدقة FBM</p>
                      </div>
                    </div>
                  );
                }

                if (activeRecord) {
                  const hoursActive = Math.round((Date.now() - new Date(activeRecord.clockInTime).getTime()) / 360000) / 10;
                  return (
                    <div className="bg-gradient-to-br from-[#050E46] to-emerald-950/20 p-5 border border-emerald-500/20 rounded-xl space-y-4 text-center">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black tracking-wide inline-block">
                          أنت مسجل كحاضر بالخدمة الآن ✅
                        </span>
                        <h4 className="text-xs font-black text-white pt-2">بداية العمل: {new Date(activeRecord.clockInTime).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</h4>
                        <p className="text-[10px] text-slate-400">مدة تواجدك الميداني المستمر تقريباً: <strong className="text-[#76BC21] font-mono">{hoursActive} ساعة</strong></p>
                      </div>

                      <button
                        onClick={handleClockOut}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all"
                      >
                        تسجيل الانصراف ونهاية الوردية 🔴
                      </button>
                    </div>
                  );
                }

                if (alreadyFinishedToday) {
                  return (
                    <div className="bg-slate-900/60 p-6 border border-slate-800 rounded-xl text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                      <h4 className="text-xs font-black text-white">تم إتمام وإثبات حضور اليوم بنجاح!</h4>
                      <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                        قمنا بحفظ إحداثيات موقعك الجي بي اس وصورة بصمة المطابقة الذاتية لكلا الفترتين الصباحية والمسائية. شكرًا لجهودك اليوم المتميزة!
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="bg-[#000839] p-5 border border-slate-800 rounded-xl space-y-4 text-center">
                    <div className="w-12 h-12 bg-[#76BC21]/10 text-[#76BC21] rounded-full flex items-center justify-center mx-auto">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-xs mx-auto">
                      <h4 className="text-xs font-black text-white">لم تقم بتسجيل الحضور الميداني لليوم</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        يتطلب النظام التحقق الذاتي ببصمة الوجه المباشرة وموقعك الميداني لبدء العمل واستقبال طلبات المصاريف.
                      </p>
                    </div>

                    <button
                      onClick={handleClockIn}
                      className="w-full bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black py-3 rounded-xl text-xs cursor-pointer shadow-lg shadow-[#76BC21]/10 transition-all"
                    >
                      إثبات الحضور وبدء وردية العمل 🟢
                    </button>
                  </div>
                );
              })()}

              {/* Attendance Log History */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-white border-r-2 border-[#76BC21] pr-2">سجلك الميداني الأخير للحضور</h4>
                
                {attendance.filter(r => r.workerUid === currentUser.uid).length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-4 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                    لا يوجد سجلات حضور سابقة مسجلة هذا الشهر
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {attendance.filter(r => r.workerUid === currentUser.uid).map(rec => (
                      <div key={rec.id} className="bg-[#000839] border border-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-3 text-right">
                        <div className="flex items-center gap-2">
                          {rec.selfieImage && (
                            <img src={rec.selfieImage} alt="Selfie" className="w-8 h-8 rounded-lg object-cover border border-slate-800 shrink-0" referrerPolicy="no-referrer" />
                          )}
                          <div>
                            <h5 className="text-[11px] font-bold text-white">{new Date(rec.clockInTime).toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' })}</h5>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(rec.clockInTime).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                              {rec.clockOutTime ? ` - ${new Date(rec.clockOutTime).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}` : ' (مستمر)'}
                            </span>
                          </div>
                        </div>

                        {rec.clockInGPS && (
                          <a
                            href={`https://www.google.com/maps?q=${rec.clockInGPS.lat},${rec.clockInGPS.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-bold px-2 py-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>موقع الـ GPS</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Team Chat & Communications */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="bg-[#050E46] border border-slate-800 rounded-2xl p-5 space-y-4 text-right flex flex-col h-[500px]">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 shrink-0">
                <MessageSquare className="w-5 h-5 text-[#76BC21] shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white">الدردشة والمسائل الميدانية (FBM Team Chat)</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">تواصل وتنسيق تشغيلي لحظي مع الإدارة والزملاء بموقع العمل</p>
                </div>
              </div>

              {/* Chat messages viewport */}
              <div className="flex-1 overflow-y-auto space-y-3 p-1 select-text">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-50">
                    <MessageSquare className="w-8 h-8 text-slate-600" />
                    <p className="text-[10px] text-slate-400">لا توجد محادثات أو مسائل تشغيلية مطروحة اليوم</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.senderUid === currentUser.uid;
                    const isSystem = msg.senderUid === 'system';
                    
                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2 shrink-0">
                          <span className="bg-[#000839] border border-slate-800 text-[9px] text-slate-400 font-bold px-3 py-1 rounded-full text-center">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] ${isMe ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                      >
                        <span className="text-[9px] text-slate-400 font-bold mb-0.5 px-1">
                          {msg.senderName} {msg.senderRole === 'admin' && '⭐ الإدارة'}
                        </span>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed break-words text-right ${
                            isMe
                              ? 'bg-[#76BC21] text-[#000839] rounded-tr-none font-bold'
                              : 'bg-[#000839] text-white border border-slate-800 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[8px] text-slate-500 font-mono mt-0.5 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChatMessage} className="flex gap-2 shrink-0 pt-3 border-t border-slate-800">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="اكتب رسالة ميدانية أو استفسار عاجل للإدارة..."
                  className="flex-1 bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-3 py-2.5 text-xs text-right focus:outline-none placeholder-slate-500"
                  maxLength={300}
                />
                <button
                  type="submit"
                  className="bg-[#76BC21] hover:bg-[#62a118] text-[#000839] p-2.5 rounded-xl cursor-pointer transition-all shrink-0 shadow-md active:scale-95"
                >
                  <Send className="w-4 h-4 transform rotate-180" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab: Stock Transfers */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">إحضار ونقل السلع من الديبو 📦</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">سجل وتابع تحويل قطع الغيار من المستودعات إلى المحل</p>
              </div>
              <button
                onClick={() => setShowTransferModal(true)}
                className="bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4 font-black" />
                <span>طلب إحضار سلعة</span>
              </button>
            </div>

            {/* Quick search */}
            <div className="relative w-full">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={transferSearch}
                onChange={(e) => setTransferSearch(e.target.value)}
                placeholder="ابحث باسم قطعة الغيار..."
                className="w-full bg-[#050E46] border border-slate-800 focus:border-[#76BC21] rounded-xl pr-9 pl-4 py-2 text-xs text-right text-white focus:outline-none"
              />
            </div>

            {transfers.length === 0 ? (
              <div className="bg-[#050E46]/40 border border-dashed border-slate-800 p-12 rounded-3xl text-center space-y-2">
                <Package className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs font-bold text-slate-400">لا توجد تحويلات أو طلبات نقل حالياً</h4>
                <p className="text-[10px] text-slate-500">انقر على الزر أعلاه لتسجيل طلب جديد لإحضار قطع الغيار.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transfers
                  .filter(t => (t.partName || '').toLowerCase().includes(transferSearch.toLowerCase()))
                  .map((tr) => (
                    <div key={tr.id} className="bg-[#050E46] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{tr.partName}</span>
                          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                            {tr.quantity} وحدات
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          من: <span className="text-slate-300 font-bold">{tr.fromLocation}</span> | إلى: <span className="text-slate-300 font-bold">{tr.toLocation}</span>
                        </div>
                        <div className="text-[9px] text-slate-500">
                          بواسطة: {tr.movedByName} | {new Date(tr.createdAt).toLocaleDateString('ar-DZ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                          tr.status === 'entered' 
                            ? 'bg-[#76BC21]/15 text-[#76BC21]' 
                            : tr.status === 'verified'
                            ? 'bg-blue-500/15 text-blue-300'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {tr.status === 'entered' ? '✓ تم تسجيلها بالحاسوب' : tr.status === 'verified' ? '✓ تم توصيلها للمحل' : '⏳ قيد التحويل / النقل'}
                        </span>

                        {tr.status === 'pending' && onUpdateTransfer && (
                          <button
                            onClick={() => onUpdateTransfer({ ...tr, status: 'verified' })}
                            className="bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-bold py-1 px-2 rounded-lg text-[10px] transition-all cursor-pointer"
                          >
                            تأكيد الاستلام ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Client Orders (البونات) */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">الطلبيات وبونات الزبائن 📋</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">ملء وتتبع الفواتير والبونات غير المنجزة للزبائن</p>
              </div>
              <button
                onClick={() => setShowClientOrderModal(true)}
                className="bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4 font-black" />
                <span>ملء بون غير منجز</span>
              </button>
            </div>

            {/* Quick search */}
            <div className="relative w-full">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="ابحث باسم الزبون..."
                className="w-full bg-[#050E46] border border-slate-800 focus:border-[#76BC21] rounded-xl pr-9 pl-4 py-2 text-xs text-right text-white focus:outline-none"
              />
            </div>

            {/* Client orders list */}
            {clientOrders.length === 0 ? (
              <div className="bg-[#050E46]/40 border border-dashed border-slate-800 p-12 rounded-3xl text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs font-bold text-slate-400">لا توجد بونات أو طلبيات مسجلة حالياً</h4>
                <p className="text-[10px] text-slate-500">سجل أول بون غير منجز بالنقر على الزر أعلاه.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientOrders
                  .filter(o => (o.clientName || '').toLowerCase().includes(orderSearch.toLowerCase()))
                  .map((order) => (
                    <div key={order.id} className="bg-[#050E46] border border-slate-800 rounded-2xl p-4 text-right space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === 'delivered' 
                              ? 'bg-emerald-500/15 text-emerald-400' 
                              : order.status === 'prepared'
                              ? 'bg-blue-500/15 text-blue-300'
                              : 'bg-amber-500/15 text-amber-400 animate-pulse'
                          }`}>
                            {order.status === 'delivered' ? '✓ بون منجز ومسلّم' : order.status === 'prepared' ? '📦 جاهز للشحن' : '⏳ بون غير منجز (قيد التحضير)'}
                          </span>
                          <h4 className="text-xs font-black text-white mt-1.5">{order.clientName}</h4>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg">
                          {order.bonNo || 'بدون رقم'}
                        </span>
                      </div>

                      <div className="bg-[#000839] p-3 rounded-xl border border-slate-900 text-right">
                        <span className="text-[9px] text-slate-500 block mb-1">المحتويات المطلوبة:</span>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                          {(Array.isArray(order.items)
                            ? order.items
                            : typeof order.items === 'string'
                              ? (order.items as string).split(',').map(s => s.trim()).filter(Boolean)
                              : []
                          ).map((item, idx) => (
                            <li key={idx} className="truncate">{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                        <span>مطلوب تلبية بحلول: <strong className="text-white font-mono">{order.deliveryDate}</strong></span>
                        
                        <div className="flex gap-2">
                          {order.status === 'pending' && onUpdateClientOrder && (
                            <button
                              onClick={() => onUpdateClientOrder({ ...order, status: 'prepared' })}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-2 rounded-lg text-[9px] transition-all cursor-pointer"
                            >
                              جاهز للتوصيل ✓
                            </button>
                          )}
                          {order.status === 'prepared' && onUpdateClientOrder && (
                            <button
                              onClick={() => onUpdateClientOrder({ ...order, status: 'delivered' })}
                              className="bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black py-1 px-2 rounded-lg text-[9px] transition-all cursor-pointer"
                            >
                              تم التسليم ✓
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

        {/* Tab: Camion Route (مسار الكاميو) */}
        {activeTab === 'camion' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">مسارات التوزيع والكاميو 🚚</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">تتبع خط سير الشاحنات والمحلات المطلوب زيارتها وتسليمها البونات</p>
            </div>

            {camionRoutes.length === 0 ? (
              <div className="bg-[#050E46]/40 border border-dashed border-slate-800 p-12 rounded-3xl text-center space-y-2">
                <Truck className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs font-bold text-slate-400">لا توجد مسارات شاحنات مجدولة</h4>
                <p className="text-[10px] text-slate-500">سيقوم المدير بتخطيط المسارات لتظهر لك هنا في الوقت الفعلي.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {camionRoutes.map((route) => (
                  <div key={route.id} className="bg-[#050E46] border border-slate-800 rounded-3xl p-5 space-y-3 text-right">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          route.status === 'completed' 
                            ? 'bg-[#76BC21]/15 text-[#76BC21]' 
                            : route.status === 'in_progress'
                            ? 'bg-blue-500/15 text-blue-300 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {route.status === 'completed' ? '✓ تم التوزيع بنجاح' : route.status === 'in_progress' ? '🚚 الشاحنة في الطريق' : '⏳ مسار مجدول'}
                        </span>
                        <h4 className="text-xs font-black text-white mt-1.5">{route.camionName || 'شاحنة التوزيع'}</h4>
                      </div>
                      <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg">
                        {route.date}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 bg-[#000839]/60 p-3 rounded-2xl border border-slate-850">
                      <div>
                        الخط: <strong className="text-white">{route.routePath}</strong>
                      </div>
                      <div>
                        👤 السائق: <strong className="text-white">{route.driverName}</strong>
                      </div>
                    </div>

                    {/* Sequential clients checklist */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#76BC21] font-bold block">📞 قائمة الزبائن والمحلات بالترتيب الميداني:</span>
                      
                      {route.clientsToCall && route.clientsToCall.length > 0 ? (
                        <div className="space-y-1.5">
                          {route.clientsToCall.map((cl, idx) => (
                            <div key={idx} className="text-xs text-slate-300 flex items-center justify-between bg-[#000839] border border-slate-850/60 px-3 py-2 rounded-xl">
                              <span className="font-bold">{idx + 1}. {cl}</span>
                              <span className="text-[9px] text-slate-500">جاهز للتوصيل والتحصيل</span>
                            </div>
                          ))}
                        </div>
                      ) : route.clients && route.clients.length > 0 ? (
                        <div className="space-y-2">
                          {route.clients.map((cl, idx) => (
                            <div key={cl.id || idx} className="bg-[#000839] border border-slate-850 p-3 rounded-xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-white">{idx + 1}. {cl.name} ({cl.location})</span>
                                <select
                                  value={cl.calledStatus || 'not_called'}
                                  onChange={(e) => {
                                    if (onUpdateCamionRoute) {
                                      const updatedClients = [...route.clients];
                                      updatedClients[idx] = {
                                        ...cl,
                                        calledStatus: e.target.value as any
                                      };
                                      onUpdateCamionRoute({
                                        ...route,
                                        clients: updatedClients
                                      });
                                    }
                                  }}
                                  className="bg-[#050E46] border border-slate-800 rounded-lg text-[9px] text-white py-1 px-1.5 focus:outline-none"
                                >
                                  <option value="not_called">⏳ لم يتم المرور/الاتصال</option>
                                  <option value="called_no_answer">📞 لا يرد / غائب</option>
                                  <option value="order_taken">✓ تم التسليم والتحصيل</option>
                                  <option value="no_order">❌ لا توجد طلبية</option>
                                </select>
                              </div>
                              {cl.phone && <div className="text-[10px] text-slate-400 font-mono">الهاتف: {cl.phone}</div>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">لا توجد محلات زبائن مجدولة لهذا خط.</span>
                      )}
                    </div>

                    {/* Driver route controls */}
                    {route.driverName === currentUser.fullName && (
                      <div className="pt-2 border-t border-slate-900 flex gap-2">
                        {route.status === 'planned' && onUpdateCamionRoute && (
                          <button
                            onClick={() => onUpdateCamionRoute({ ...route, status: 'in_progress' })}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                          >
                            🚀 إطلاق مسار الشاحنة الآن
                          </button>
                        )}
                        {route.status === 'in_progress' && onUpdateCamionRoute && (
                          <button
                            onClick={() => onUpdateCamionRoute({ ...route, status: 'completed' })}
                            className="flex-1 bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                          >
                            ✓ تأكيد تسليم كل المحلات والعودة
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Navigation bottom bar for Mobile-feel, aligned dynamically with horizontal scroll - Beautiful Floating Glassmorphic Bar */}
      <div className="fixed bottom-4 left-4 right-4 bg-[#050E46]/95 backdrop-blur-lg border border-slate-800/80 p-2.5 flex overflow-x-auto flex-nowrap scrollbar-none gap-2 items-center justify-between z-45 max-w-4xl mx-auto rounded-2xl shadow-2xl" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer shrink-0 relative ${
            activeTab === 'chat' ? 'text-[#76BC21] bg-[#76BC21]/10 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span className="text-[9px] font-bold">الدردشة</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'expenses' ? 'text-[#76BC21] bg-[#76BC21]/10 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="text-[9px] font-bold">مصاريفي</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer shrink-0 relative ${
            activeTab === 'tasks' ? 'text-[#76BC21] bg-[#76BC21]/10 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span className="text-[9px] font-bold">مهامي</span>
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer shrink-0 relative ${
            activeTab === 'transfers' ? 'text-[#76BC21] bg-[#76BC21]/10 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span className="text-[9px] font-bold">إحضار سلعة</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer shrink-0 relative ${
            activeTab === 'orders' ? 'text-[#76BC21] bg-[#76BC21]/10 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="text-[9px] font-bold">البونات</span>
        </button>

        <button
          onClick={() => setActiveTab('camion')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer shrink-0 relative ${
            activeTab === 'camion' ? 'text-[#76BC21] bg-[#76BC21]/10 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4 shrink-0" />
          <span className="text-[9px] font-bold">الكاميو</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer shrink-0 relative ${
            activeTab === 'attendance' ? 'text-[#76BC21] bg-[#76BC21]/10 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span className="text-[9px] font-bold">الحضور</span>
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

            <h3 className="text-sm font-black text-white mb-5 text-right border-b border-slate-800 pb-3">
              {isPrivileged ? 'تسجيل وإضافة مصروف فوري مباشر (صلاحيات الإدارة)' : 'تسجيل ورفع طلب مصروفات ميداني'}
            </h3>

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

              {isPrivileged ? (
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    type="submit"
                    onClick={() => setSubmitMode('approved')}
                    className="w-full bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#000839]" />
                    <span>اعتماد وصرف فوري مباشر ✅</span>
                  </button>
                  <button
                    type="submit"
                    onClick={() => setSubmitMode('pending')}
                    className="w-full bg-amber-500/10 hover:bg-amber-500 hover:text-[#000839] text-amber-400 border border-amber-500/25 font-black py-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>إرسال للتدقيق والمراجعة اللاحقة ⏳</span>
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  onClick={() => setSubmitMode('pending')}
                  className="w-full bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all mt-4 flex items-center justify-center gap-1.5"
                >
                  <span>إرسال طلب المصروف للاعتماد الفوري 🚀</span>
                </button>
              )}

            </form>
          </div>
        </div>
      )}

      {/* Task Signature & GPS Capture Modal */}
      {taskToSign && (
        <TaskSignatureModal
          task={taskToSign}
          isOpen={!!taskToSign}
          onClose={() => setTaskToSign(null)}
          onConfirm={handleSignatureConfirm}
        />
      )}

      {/* Modal: Add Stock Transfer Request */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-[#00021c]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#050E46] border border-slate-800 rounded-3xl p-6 shadow-2xl relative" dir="rtl">
            <button 
              onClick={() => setShowTransferModal(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-white mb-5 text-right border-b border-slate-800 pb-3">إضافة طلب إحضار سلعة من الديبو 📦</h3>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">اسم قطعة الغيار المطلوبة</label>
                <input
                  type="text"
                  value={transferPartName}
                  onChange={(e) => setTransferPartName(e.target.value)}
                  placeholder="مثال: مبرد مياه / فلتر زيت تويوتا"
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-3 text-xs text-right focus:outline-none text-white"
                  required
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">الكمية المطلوبة</label>
                <input
                  type="number"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  placeholder="مثال: 5"
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-3 text-xs text-right focus:outline-none text-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">من موقع (الديبو / المستودع)</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-3 py-3 text-xs text-right focus:outline-none text-white font-bold"
                >
                  <option value="ديبو / المستودع الرئيسي 🏢">ديبو / المستودع الرئيسي 🏢</option>
                  <option value="مستودع الكليّة الفرعي 🏬">مستودع الكليّة الفرعي 🏬</option>
                  <option value="مستودع الشاحنات 🚚">مستودع الشاحنات 🚚</option>
                </select>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">إلى موقع (المحل / نقطة التوزيع)</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-3 py-3 text-xs text-right focus:outline-none text-white font-bold"
                >
                  <option value="محل البيع والتجزئة 🏪">محل البيع والتجزئة 🏪</option>
                  <option value="فرع البليدة 🏪">فرع البليدة 🏪</option>
                  <option value="نقطة توزيع المدية 🏪">نقطة توزيع المدية 🏪</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all mt-4"
              >
                تأكيد وإرسال طلب إحضار السلعة 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Client Order / بون غير منجز */}
      {showClientOrderModal && (
        <div className="fixed inset-0 bg-[#00021c]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#050E46] border border-slate-800 rounded-3xl p-6 shadow-2xl relative" dir="rtl">
            <button 
              onClick={() => setShowClientOrderModal(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-white mb-5 text-right border-b border-slate-800 pb-3">ملء بون طلبيّة جديد لزبون (بون غير منجز) 📋</h3>

            <form onSubmit={handleCreateClientOrder} className="space-y-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">اسم الزبون / المحل المستلم</label>
                <input
                  type="text"
                  value={orderClientName}
                  onChange={(e) => setOrderClientName(e.target.value)}
                  placeholder="مثال: مؤسسة بلال لقطع الغيار"
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-3 text-xs text-right focus:outline-none text-white"
                  required
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">رقم البون (اختياري)</label>
                <input
                  type="text"
                  value={orderBonNo}
                  onChange={(e) => setOrderBonNo(e.target.value)}
                  placeholder="مثال: BON-2026-089"
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-3 text-xs text-right focus:outline-none text-white font-mono"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">قطع الغيار المطلوبة (افصل بينها بفاصلة ,)</label>
                <textarea
                  value={orderPartNames}
                  onChange={(e) => setOrderPartNames(e.target.value)}
                  placeholder="مثال: فلتر زيت هينو, مكابح خلفية فوسو, مروحة تبريد"
                  rows={3}
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-3 text-xs text-right focus:outline-none text-white"
                  required
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">تاريخ التسليم المطلوب</label>
                <input
                  type="date"
                  value={orderDeliveryDate}
                  onChange={(e) => setOrderDeliveryDate(e.target.value)}
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-3 text-xs text-right focus:outline-none text-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300 block">ملاحظات إضافية</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="مثال: تسليم عاجل قبل الزوال"
                  className="w-full bg-[#000839] border border-slate-800 focus:border-[#76BC21] rounded-xl px-4 py-3 text-xs text-right focus:outline-none text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all mt-4"
              >
                تأكيد وتسجيل البون غير المنجز 📋
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Task Assignment Alert Modal */}
      {newlyAssignedTask && (
        <div className="fixed inset-0 bg-[#00021c]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#050E46] border-2 border-[#76BC21] rounded-3xl p-6 shadow-[0_0_40px_rgba(118,188,33,0.25)] relative text-right" dir="rtl">
            <div className="absolute left-4 top-4 bg-[#76BC21]/10 text-[#76BC21] p-1 rounded-full">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>

            <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3">
              <span className="p-2.5 bg-[#76BC21]/15 rounded-2xl text-[#76BC21] block">
                <Bell className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <h3 className="text-sm font-black text-white">🔔 تنبيه: مهمة جديدة موكلة إليك!</h3>
                <p className="text-[10px] text-[#76BC21] font-bold">تم إسناد مهمة ميدانية جديدة لك من قبل الإدارة</p>
              </div>
            </div>

            <div className="space-y-3 my-4">
              <div className="bg-[#000839] p-4 rounded-2xl border border-slate-850 space-y-2">
                <span className="text-[9px] font-bold bg-[#76BC21]/10 text-[#76BC21] px-2.5 py-0.5 rounded-full inline-block">
                  {newlyAssignedTask.categoryName}
                </span>
                <h4 className="text-xs font-black text-white leading-relaxed">{newlyAssignedTask.title}</h4>
                {newlyAssignedTask.description && (
                  <p className="text-[11px] text-slate-400 bg-[#050E46]/60 p-2.5 rounded-xl border border-slate-900 leading-relaxed font-medium">
                    {newlyAssignedTask.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setActiveTab('tasks');
                  setNewlyAssignedTask(null);
                }}
                className="flex-1 bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all text-center animate-pulse"
              >
                الذهاب لتنفيذ المهمة 🚀
              </button>
              <button
                onClick={() => setNewlyAssignedTask(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-3 rounded-xl text-xs cursor-pointer transition-all"
              >
                إغلاق التنبيه
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

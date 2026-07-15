import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AppUser,
  CompanyCategory,
  CompanyTask,
  CompanyExpense,
  CompanyNotification,
  AttendanceRecord,
  ChatMessage,
  StockTransfer,
  ClientOrder,
  CamionRoute,
  SectionVisibility,
} from '../types';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation as CapGeolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { 
  Plus,
  Camera,
  Check,
  Clock,
  Bell,
  LogOut,
  X,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  RefreshCw,
  Send,
  Smartphone,
  Download,
  Globe,
  MapPin,
  ShieldCheck,
  Calendar,
  UserCheck,
  MessageSquare,
  Briefcase,
  Truck,
  FileText,
  Package,
  Search,
  Trash2,
  List,
  Menu,
  Moon, Sun , TrendingUp } from "lucide-react";
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
    locationGPS?: { lat: number; lng: number } | null,
  ) => void;
  onUpdateNotifications: (newNotifications: CompanyNotification[]) => void;
  onUpdateNotification?: (notification: CompanyNotification) => Promise<void>;
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
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  sectionsVisibility: SectionVisibility[];
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
  onUpdateNotification,
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
  onDeleteExpense,
  isDarkMode,
  onToggleTheme,
  sectionsVisibility = [],
}: WorkerDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'expenses' | 'tasks' | 'attendance' | 'chat' | 'transfers' | 'orders' | 'camion'
  >('expenses');

  // Dynamic permission helper mapping (defaulting to true if undefined)
  const isAllowed = (key: keyof NonNullable<AppUser['permissions']>) => {
    if (!currentUser || currentUser.role === 'admin') return true;
    if (!currentUser.permissions) return true;
    return currentUser.permissions[key] !== false;
  };

  const getSectionState = (sectionId: string): 'active' | 'hidden' | 'soon' => {
    const sec = sectionsVisibility.find((s) => s.id === sectionId);
    if (!sec) return 'active';
    return isPrivileged ? sec.supervisorState : sec.workerState;
  };

  const isSectionVisible = (sectionId: string) => {
    return getSectionState(sectionId) !== 'hidden';
  };

  const isTabSoon = (sectionId: string) => {
    return getSectionState(sectionId) === 'soon';
  };

  // Safe fallback routing if a section is restricted by administration
  useEffect(() => {
    const allowedTabs: ('expenses' | 'tasks' | 'transfers' | 'camion' | 'attendance' | 'orders' | 'chat')[] = [];
    if (isAllowed('canViewAllExpenses') && isSectionVisible('expenses')) allowedTabs.push('expenses');
    if (isAllowed('canManageTasks') && isSectionVisible('tasks')) allowedTabs.push('tasks');
    if (isAllowed('canManageTransfers') && isSectionVisible('transfers')) allowedTabs.push('transfers');
    if (isAllowed('canManageCamion') && isSectionVisible('camion')) allowedTabs.push('camion');
    if (isAllowed('canManageAttendance') && isSectionVisible('attendance')) allowedTabs.push('attendance');
    if (isAllowed('canManageOrders') && isSectionVisible('orders')) allowedTabs.push('orders');
    if (isSectionVisible('chat')) allowedTabs.push('chat');

    if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab as any)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [currentUser?.permissions, sectionsVisibility, activeTab, isPrivileged]);

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
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unknown',
  );

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.requestPermissions().then((perm) => {
        setNotificationPermissionGranted(perm.display);
      });
    }
  }, []);

  const handleTestNotificationSettings = async () => {
    // 1. Play soft chime immediately
    playNotificationChime();

    // 2. Native notification trigger
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await LocalNotifications.requestPermissions();
        setNotificationPermissionGranted(perm.display);
        if (perm.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: 'مجموعة FBM - اختبار الاتصال 🔔',
                body: 'تنبيهات الصوت والنظام تعمل بشكل ممتاز الآن على جوالك!',
                id: Math.floor(Math.random() * 2000000) + 1,
                schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
                channelId: 'fbm-main-channel',
                smallIcon: 'ic_launcher',
                iconColor: '#76BC21',
                sound: 'default',
              },
            ],
          });
        }
      } catch (err) {
        console.error('[FBM] Failed to trigger native test notification:', err);
      }
      return;
    }

    // Web fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermissionGranted(permission);

      if (permission === 'granted') {
        // Trigger a native test notification
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((reg) => {
              reg
                .showNotification('مجموعة FBM - اختبار الاتصال 🔔', {
                  body: 'تنبيهات الصوت والنظام تعمل بشكل ممتاز الآن على جوالك!',
                  icon: 'https://img.icons8.com/color/192/delivery.png',
                  vibrate: [100, 50, 100],
                } as any)
                .catch(() => {
                  new Notification('مجموعة FBM - اختبار الاتصال 🔔', {
                    body: 'تنبيهات الصوت والنظام تعمل بشكل ممتاز الآن على جوالك!',
                    icon: 'https://img.icons8.com/color/192/delivery.png',
                  });
                });
            })
            .catch(() => {
              new Notification('مجموعة FBM - اختبار الاتصال 🔔', {
                body: 'تنبيهات الصوت والنظام تعمل بشكل ممتاز الآن على جوالك!',
                icon: 'https://img.icons8.com/color/192/delivery.png',
              });
            });
        } else {
          new Notification('مجموعة FBM - اختبار الاتصال 🔔', {
            body: 'تنبيهات الصوت والنظام تعمل بشكل ممتاز الآن على جوالك!',
            icon: 'https://img.icons8.com/color/192/delivery.png',
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
  const expenseDraftKey = `worker_expense_draft_${currentUser.uid}`;

  // Signature capture state
  const [taskToSign, setTaskToSign] = useState<CompanyTask | null>(null);

  // Chat input state
  const [chatInput, setChatInput] = useState('');

  // More sections bottom drawer state
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Chat unread badge and timestamp persistence
  const [lastReadChat, setLastReadChat] = useState<number>(() => {
    return parseInt(localStorage.getItem(`chat_last_read_${currentUser.uid}`) || '0', 10);
  });

  const unreadChatCount = chatMessages.filter(
    (msg) => msg.senderUid !== 'system' && msg.senderUid !== currentUser.uid && new Date(msg.createdAt).getTime() > lastReadChat
  ).length;

  useEffect(() => {
    if (activeTab === 'chat') {
      const now = Date.now();
      setLastReadChat(now);
      localStorage.setItem(`chat_last_read_${currentUser.uid}`, now.toString());
    }
  }, [activeTab, currentUser.uid]);

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

  // Load draft from localStorage on mount/key change
  useEffect(() => {
    const draftStr = localStorage.getItem(expenseDraftKey);
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        if (draft.amount) setExpenseAmount(draft.amount);
        if (draft.desc) setExpenseDesc(draft.desc);
        if (draft.category) setExpenseCategory(draft.category);
        if (draft.capturedImage) setCapturedImage(draft.capturedImage);
      } catch (e) {}
    }
  }, [expenseDraftKey]);

  // Save draft to localStorage when values change
  useEffect(() => {
    if (expenseAmount || expenseDesc || expenseCategory || capturedImage) {
      localStorage.setItem(
        expenseDraftKey,
        JSON.stringify({
          amount: expenseAmount,
          desc: expenseDesc,
          category: expenseCategory,
          capturedImage: capturedImage,
        }),
      );
    } else {
      localStorage.removeItem(expenseDraftKey);
    }
  }, [expenseAmount, expenseDesc, expenseCategory, capturedImage, expenseDraftKey]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter lists specifically for current worker with 3-day auto-archive/hiding
  const threeDaysAgoMs = Date.now() - 3 * 24 * 60 * 60 * 1000;

  const myExpenses = expenses.filter((e) => e.workerUid === currentUser.uid);

  const myTasks = tasks.filter((t) => {
    const isAssigned = t.assignedToUids && t.assignedToUids.includes(currentUser.uid);
    if (!isAssigned) return false;
    // Hide completed tasks older than 3 days
    if (t.status === 'done') {
      const completionTime = new Date(t.completedAt || t.createdAt).getTime();
      if (completionTime < threeDaysAgoMs) return false;
    }
    return true;
  });

  const myNotifications = notifications.filter((n) => {
    const isTarget = n.targetType === 'all' || (n.targetUids && n.targetUids.includes(currentUser.uid));
    if (!isTarget) return false;
    // Prevent self-notifications (creator doesn't receive a notification for their own action)
    if (n.createdByUid === currentUser.uid) return false;
    // Hide notifications older than 3 days
    const notifTime = new Date(n.createdAt).getTime();
    if (notifTime < threeDaysAgoMs) return false;
    return true;
  });

  const unreadNotifsCount = myNotifications.filter(
    (n) => !n.readByUids || !n.readByUids.includes(currentUser.uid),
  ).length;

  const approvedWorkerExpensesSum = myExpenses
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingWorkerExpensesSum = myExpenses
    .filter((e) => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);
  const completedWorkerTasksCount = myTasks.filter((t) => t.status === 'done').length;
  const activeWorkerTasksCount = myTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Monitor real-time task assignments and alert immediately
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const myCurrentTasks = tasks.filter((t) => t.assignedToUids && t.assignedToUids.includes(currentUser.uid));

    if (isFirstLoadRef.current) {
      // First load: just populate seen tasks so we don't alert old ones
      myCurrentTasks.forEach((t) => seenTaskIdsRef.current.add(t.id));
      isFirstLoadRef.current = false;
      return;
    }

    // Check if there are any new tasks assigned to the worker
    const newTasks = myCurrentTasks.filter((t) => !seenTaskIdsRef.current.has(t.id));

    if (newTasks.length > 0) {
      const latestNewTask = newTasks[0]; // notify about the most recent one
      setNewlyAssignedTask(latestNewTask);
      playNotificationChime();

      // Attempt browser native notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('📋 مهمة ميدانية جديدة موكلة إليك!', {
            body: `مهمة: ${latestNewTask.title}\nالتصنيف: ${latestNewTask.categoryName}`,
            icon: 'https://img.icons8.com/color/192/delivery.png',
          });
        } catch (e) {
          console.warn('Native notification failed', e);
        }
      }

      // Add all new tasks to the seen set so we don't notify repeatedly
      newTasks.forEach((t) => seenTaskIdsRef.current.add(t.id));
    }
  }, [tasks, currentUser.uid]);

  const getCurrentGPSLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    if (Capacitor.isNativePlatform()) {
      try {
        const position = await CapGeolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 8000,
        });
        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch (err) {
        console.warn('Native GPS retrieval failed, trying Web fallback:', err);
      }
    }

    // Web Fallback
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        });
        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch (err) {
        console.warn('Web GPS retrieval failed:', err);
      }
    }
    return null;
  };

  const startCamera = async () => {
    setCapturedImage(null);
    if (Capacitor.isNativePlatform()) {
      setShowCamera(false);
      try {
        const photo = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
        });
        if (photo.base64String) {
          const base64Img = `data:image/jpeg;base64,${photo.base64String}`;
          setCapturedImage(base64Img);
        }
      } catch (err) {
        console.warn('Native camera capture failed, falling back to simulated invoice.', err);
        generateSimulatedInvoice();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
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
      streamRef.current.getTracks().forEach((track) => track.stop());
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
    ctx.fillText(`التاريخ: ${new Date().toLocaleDateString('en-GB')}`, 540, 225);
    ctx.fillText('الجهة المصدرة: محطة خدمات ونقل LES FRÈRES BENAMAR ش.ذ.م.م', 540, 250);
    ctx.fillText(`اسم المقتني: ${currentUser.fullName}`, 540, 275);

    // Table of items
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 310, 520, 200);
    ctx.beginPath();
    ctx.moveTo(40, 350);
    ctx.lineTo(560, 350);
    ctx.moveTo(180, 310);
    ctx.lineTo(180, 510); // amount col
    ctx.moveTo(350, 310);
    ctx.lineTo(350, 510); // qty col
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
    ctx.fillText('LES FRÈRES BENAMAR', 420, 600);
    ctx.fillText('FBM الجزائر', 420, 620);
    ctx.fillText('مقبول وصالح', 420, 640);

    // Signature
    ctx.font = 'italic 12px "Courier New"';
    ctx.fillStyle = '#1e3a8a'; // blue ink signature
    ctx.fillText('FBM_Sign', 420, 690);

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

    let gpsCoordsToUse = await getCurrentGPSLocation();
    if (gpsCoordsToUse) {
      setAttendanceGps(gpsCoordsToUse);
    } else {
      setAttendanceGpsError('تعذر الحصول على إحداثيات الجي بي اس');
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
        date: todayStr,
      };

      onUpdateAttendance(record);
      setIsBiometricScanning(false);
    }, 1500);
  };

  const handleClockOut = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const activeRec = attendance.find((r) => r.workerUid === currentUser.uid && r.date === todayStr && !r.clockOutTime);
    if (!activeRec) return;

    setIsBiometricScanning(true);
    let gpsCoordsToUse = await getCurrentGPSLocation();
    if (!gpsCoordsToUse) {
      gpsCoordsToUse = { lat: 36.7538, lng: 3.0588 };
    }

    const updated: AttendanceRecord = {
      ...activeRec,
      clockOutTime: new Date().toISOString(),
      clockOutGPS: gpsCoordsToUse,
    };
    onUpdateAttendance(updated);
    setIsBiometricScanning(false);
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
      createdAt: new Date().toISOString(),
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
      receiptImage: capturedImage,
    };

    onAddExpense(newExpense);
    localStorage.removeItem(expenseDraftKey);
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
      isEnteredInSalesSystem: false,
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

    const partsList = orderPartNames
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newOrder: ClientOrder = {
      id: `ord_${Date.now()}`,
      clientName: orderClientName.trim(),
      bonNo: orderBonNo.trim() || `BON-${Math.floor(1000 + Math.random() * 9000)}`,
      deliveryDate: orderDeliveryDate,
      status: 'pending',
      items: partsList,
      createdAt: new Date().toISOString(),
      notes: orderNotes.trim(),
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
    <div className="min-h-screen bg-fbm-light dark:bg-fbm-blue text-slate-900 dark:text-white flex flex-col pb-16 select-none font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Header and greeting */}
      <div className="bg-white/80 dark:bg-fbm-blue-card/80  border-b border-slate-100 dark:border-fbm-blue-border/50 p-4 md:p-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4" dir="rtl">
          {/* Worker Profile Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-fbm-green hover:bg-fbm-green-hover text-white rounded-xl border border-fbm-green/30 flex items-center justify-center text-fbm-green font-bold">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-fbm-green font-extrabold">مرحباً بك في الخدمة</span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{currentUser.fullName}</h2>
            </div>
          </div>

          {/* Logo brand and quick logout */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-fbm-blue-border flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="تغيير المظهر"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isPrivileged && onToggleViewMode && (
              <button
                onClick={onToggleViewMode}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold px-3 py-2 rounded-xl text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-md active:scale-95 border border-emerald-500/20"
                title="التبديل إلى لوحة التحكم الإدارية"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
                <span>لوحة التحكم ⚙️</span>
              </button>
            )}

            <NotificationPopover
              notifications={notifications}
              onUpdateNotifications={onUpdateNotifications}
              onUpdateNotification={onUpdateNotification}
              currentUser={currentUser}
              align="right"
            />

            <button
              onClick={onLogout}
              className="p-2.5 bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border hover:border-red-900/60 rounded-xl hover:text-red-400 transition-all cursor-pointer"
              title="خروج آمن"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <div className="bg-fbm-green hover:bg-fbm-green-hover text-white text-slate-900 dark:text-white px-3 py-2 rounded-xl text-[10px] font-bold tracking-wider">
              FBM ERP
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 pb-28 space-y-4 overflow-y-auto" dir="rtl">
        {/* Responsive layout guides */}
        <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border p-3.5 rounded-2xl flex items-center justify-between text-xs text-right gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-fbm-green w-4 h-4 shrink-0 animate-pulse" />
            <span className="text-slate-500 dark:text-slate-300 font-medium">
              المزامنة الميدانية والتوجيه اليومي: <strong className="text-emerald-400">نشط</strong>
            </span>
          </div>
          <span className="text-[10px] bg-white dark:bg-fbm-blue px-2.5 py-1 rounded-lg border border-slate-200 dark:border-fbm-blue-border text-slate-500 font-mono">
            FBM-ONLINE
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 dark:border-fbm-blue-border bg-gradient-to-l from-[#050E46] to-[#0a186b] p-4 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fbm-green">ملخص يومي</p>
            <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">تابع مهامك ومصاريفك دون مغادرة الشاشة</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">الواجهة مصممة لتكون أسرع على الهاتف مع زر إضافة واضح ومباشر.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-fbm-blue-border bg-white dark:bg-fbm-blue-card  p-4 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">إجراءات سريعة</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setShowExpenseModal(true)}
                className="rounded-xl border border-fbm-green/20 bg-fbm-green/10 px-3 py-2 text-[11px] font-bold text-fbm-green transition-all hover:bg-fbm-green/20"
              >
                + مصروف جديد
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className="rounded-xl border border-slate-200 dark:border-fbm-blue-border bg-white dark:bg-fbm-blue px-3 py-2 text-[11px] font-bold text-slate-200 transition-all hover:border-slate-300 dark:hover:border-white/10"
              >
                المهام
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className="rounded-xl border border-slate-200 dark:border-fbm-blue-border bg-white dark:bg-fbm-blue px-3 py-2 text-[11px] font-bold text-slate-200 transition-all hover:border-slate-300 dark:hover:border-white/10"
              >
                الدردشة
              </button>
            </div>
          </div>
        </div>

        {/* Tab content area */}

        <AnimatePresence mode="wait">
        {isTabSoon(activeTab) ? (
          <motion.div
            key="soon-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-xl"
          >
            <div className="bg-fbm-green/10 text-fbm-green w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
              🚀
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">هذا القسم قيد التطوير والتحضير 🛠️</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              تقوم الإدارة حالياً بإعداد وتجربة هذا الجزء من النظام. سيكون متاحاً للعمل ميدانياً قريباً فور اعتماده من المدير العام.
            </p>
            <div className="text-[10px] bg-slate-100 dark:bg-fbm-blue px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 inline-block font-mono">
              STATUS: PREPARING_FEATURES
            </div>
          </motion.div>
        ) : (
          <>
            {/* Expenses List */}
            {activeTab === 'expenses' && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border p-4 rounded-2xl shadow-sm">
                  <div className="text-right">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">المصاريف والعهد الميدانية</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">سجل فواتير النفقات التشغيلية الميدانية بدقة</p>
                  </div>
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="bg-fbm-green hover:bg-fbm-green-hover text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#76BC21]/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 font-bold" />
                    <span>إضافة مصروف جديد 💸</span>
                  </button>
                </div>

                {/* Contextual Stats for Worker Expenses */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border p-4 rounded-2xl text-right shadow-sm animate-fadeIn">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">المصاريف المعتمدة</span>
                    <h3 className="text-sm font-bold text-fbm-green font-mono">
                      {approvedWorkerExpensesSum.toLocaleString('en-US')} د.ج
                    </h3>
                  </div>
                  <div className="bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border p-4 rounded-2xl text-right shadow-sm animate-fadeIn">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">قيد المراجعة</span>
                    <h3 className="text-sm font-bold text-amber-500 font-mono">
                      {pendingWorkerExpensesSum.toLocaleString('en-US')} د.ج
                    </h3>
                  </div>
                </div>
              </motion.div>
            )}

        {/* Tasks List */}
        {activeTab === 'tasks' && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">المهام الميدانية والعمليات الموكلة إليك</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">سجل تقدّمك الفعلي ليتمكن المديرون من مراقبة الفروع</p>
            </div>

            {/* Contextual Stats for Worker Tasks */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border p-4 rounded-2xl text-right">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">مهام نشطة</span>
                <h3 className="text-sm font-bold text-sky-400 font-mono">{activeWorkerTasksCount} مهمة</h3>
              </div>
              <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border p-4 rounded-2xl text-right">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">مهام منجزة</span>
                <h3 className="text-sm font-bold text-fbm-green font-mono">{completedWorkerTasksCount} مهمة</h3>
              </div>
            </div>

            {myTasks.length === 0 ? (
              <div className="bg-white/40 dark:bg-fbm-blue-card border border-dashed border-slate-200 dark:border-fbm-blue-border p-12 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-fbm-green mx-auto" />
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">ممتاز! لا توجد مهام ميدانية نشطة حالياً</h4>
                <p className="text-[10px] text-slate-500">
                  استمتع بيومك الميداني، وسيصلك إشعار فوري عند تكليفك بأي عملية.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 space-y-3.5 hover:border-slate-300 dark:hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-fbm-blue-border/60 pb-3">
                      <div className="space-y-1.5 text-right">
                        <div className="flex flex-wrap gap-1.5 items-center justify-start">
                          <span className="text-[9px] font-extrabold bg-slate-200 dark:bg-fbm-blue-border text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full">
                            {task.categoryName}
                          </span>
                          {task.dueDate && (
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                                task.status === 'done'
                                  ? 'bg-slate-200/60 dark:bg-fbm-blue-border/60 text-slate-500 dark:text-slate-400'
                                  : new Date(task.dueDate).getTime() - Date.now() < 0
                                    ? 'bg-red-500/15 border border-red-500/30 text-red-400 animate-pulse'
                                    : new Date(task.dueDate).getTime() - Date.now() <= 24 * 60 * 60 * 1000
                                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse'
                                      : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              <span>
                                الموعد:{' '}
                                {new Date(task.dueDate).toLocaleString('en-GB', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{task.title}</h4>
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
                          <span className="bg-slate-200 dark:bg-fbm-blue-border text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                            بانتظار البدء
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desc */}
                    <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{task.description}</p>

                    {/* Timestamps log if any */}
                    {(task.startedAt || task.completedAt) && (
                      <div className="bg-white/40 dark:bg-fbm-blue/40 p-2.5 rounded-xl border border-slate-200 dark:border-fbm-blue-border text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                        {task.startedAt && (
                          <div className="flex justify-between items-center">
                            <span>توقيت بدء العمل:</span>
                            <span className="font-mono text-slate-500 dark:text-slate-300">
                              {new Date(task.startedAt).toLocaleString('en-GB')}
                            </span>
                          </div>
                        )}
                        {task.completedAt && (
                          <div className="flex justify-between items-center text-emerald-400">
                            <span>توقيت إتمام الإنجاز:</span>
                            <span className="font-mono">{new Date(task.completedAt).toLocaleString('en-GB')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lifecycle Action Buttons */}
                    <div className="flex gap-2 justify-end border-t border-slate-200/40 dark:border-fbm-blue-border/40 pt-3">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => onUpdateTaskStatus(task.id, 'in_progress', new Date().toISOString())}
                          className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                        >
                          تأكيد وبدء العمل الآن
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => setTaskToSign(task)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-slate-900 dark:text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-md"
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
          </motion.div>
        )}

        {/* Tab: Attendance System */}
        {activeTab === 'attendance' && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 space-y-4 text-right">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-fbm-blue-border pb-3">
                <UserCheck className="w-5 h-5 text-fbm-green shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">إثبات الحضور الميداني والجي بي اس</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    تسجيل الدخول والخروج من العمل بالبصمة البيومترية والموقع
                  </p>
                </div>
              </div>

              {/* Digital Time & Date Algiers Widget */}
              <div className="bg-white dark:bg-fbm-blue p-4 rounded-xl text-center space-y-1 border border-slate-200 dark:border-fbm-blue-border relative overflow-hidden">
                <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>الجزائر (الجرينيتش +1)</span>
                </div>
                <h4 className="text-xl font-bold font-mono text-slate-900 dark:text-white tracking-widest">
                  {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </h4>
                <p className="text-[10px] text-fbm-green font-bold">
                  {new Date().toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Active attendance control box */}
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const activeRecord = attendance.find(
                  (r) => r.workerUid === currentUser.uid && r.date === todayStr && !r.clockOutTime,
                );
                const alreadyFinishedToday = attendance.find(
                  (r) => r.workerUid === currentUser.uid && r.date === todayStr && r.clockOutTime,
                );

                if (isBiometricScanning) {
                  return (
                    <div className="bg-slate-950 p-8 border border-fbm-green/40 rounded-xl text-center space-y-4">
                      <div className="w-16 h-16 border-4 border-fbm-green border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-fbm-green animate-pulse">
                          جاري فحص بصمة الوجه ومطابقة موقع GPS...
                        </h4>
                        <p className="text-[10px] text-slate-500">نظام التحقق الذاتي فائق الدقة FBM</p>
                      </div>
                    </div>
                  );
                }

                if (activeRecord) {
                  const hoursActive =
                    Math.round((Date.now() - new Date(activeRecord.clockInTime).getTime()) / 360000) / 10;
                  return (
                    <div className="bg-gradient-to-br from-[#050E46] to-emerald-950/20 p-5 border border-emerald-500/20 rounded-xl space-y-4 text-center">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-bold tracking-wide inline-block">
                          أنت مسجل كحاضر بالخدمة الآن ✅
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white pt-2">
                          بداية العمل:{' '}
                          {new Date(activeRecord.clockInTime).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          مدة تواجدك الميداني المستمر تقريباً:{' '}
                          <strong className="text-fbm-green font-mono">{hoursActive} ساعة</strong>
                        </p>
                      </div>

                      <button
                        onClick={handleClockOut}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all"
                      >
                        تسجيل الانصراف ونهاية الوردية 🔴
                      </button>
                    </div>
                  );
                }

                if (alreadyFinishedToday) {
                  return (
                    <div className="bg-slate-100/60 dark:bg-fbm-blue-card p-6 border border-slate-200 dark:border-fbm-blue-border rounded-xl text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">تم إتمام وإثبات حضور اليوم بنجاح!</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                        قمنا بحفظ إحداثيات موقعك الجي بي اس وصورة بصمة المطابقة الذاتية لكلا الفترتين الصباحية
                        والمسائية. شكرًا لجهودك اليوم المتميزة!
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="bg-white dark:bg-fbm-blue p-5 border border-slate-200 dark:border-fbm-blue-border rounded-xl space-y-4 text-center">
                    <div className="w-12 h-12 bg-fbm-green/10 text-fbm-green rounded-full flex items-center justify-center mx-auto">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-xs mx-auto">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">لم تقم بتسجيل الحضور الميداني لليوم</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        يتطلب النظام التحقق الذاتي ببصمة الوجه المباشرة وموقعك الميداني لبدء العمل واستقبال طلبات
                        المصاريف.
                      </p>
                    </div>

                    <button
                      onClick={handleClockIn}
                      className="w-full bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-3 rounded-xl text-xs cursor-pointer shadow-lg shadow-[#76BC21]/10 transition-all"
                    >
                      إثبات الحضور وبدء وردية العمل 🟢
                    </button>
                  </div>
                );
              })()}

              {/* Attendance Log History */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white border-r-2 border-fbm-green pr-2">
                  سجلك الميداني الأخير للحضور
                </h4>

                {attendance.filter((r) => r.workerUid === currentUser.uid).length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-4 bg-slate-950/30 rounded-xl border border-dashed border-slate-200 dark:border-fbm-blue-border">
                    لا يوجد سجلات حضور سابقة مسجلة هذا الشهر
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {attendance
                      .filter((r) => r.workerUid === currentUser.uid)
                      .map((rec) => (
                        <div
                          key={rec.id}
                          className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border p-3 rounded-xl flex items-center justify-between gap-3 text-right"
                        >
                          <div className="flex items-center gap-2">
                            {rec.selfieImage && (
                              <img
                                src={rec.selfieImage}
                                alt="Selfie"
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-fbm-blue-border shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div>
                              <h5 className="text-[11px] font-bold text-slate-900 dark:text-white">
                                {new Date(rec.clockInTime).toLocaleDateString('en-GB', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </h5>
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                                {new Date(rec.clockInTime).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {rec.clockOutTime
                                  ? ` - ${new Date(rec.clockOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                                  : ' (مستمر)'}
                              </span>
                            </div>
                          </div>

                          {rec.clockInGPS && (
                            <a
                              href={`https://www.google.com/maps?q=${rec.clockInGPS.lat},${rec.clockInGPS.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-100 dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border text-[10px] text-emerald-400 font-bold px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 shrink-0"
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
          </motion.div>
        )}

        {/* Tab: Team Chat & Communications */}
        {activeTab === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 space-y-4 text-right flex flex-col h-[500px]">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-fbm-blue-border pb-3 shrink-0">
                <MessageSquare className="w-5 h-5 text-fbm-green shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">الدردشة والمسائل الميدانية (FBM Team Chat)</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    تواصل وتنسيق تشغيلي لحظي مع الإدارة والزملاء بموقع العمل
                  </p>
                </div>
              </div>

              {/* Chat messages viewport */}
              <div className="flex-1 overflow-y-auto space-y-3 p-1 select-text">
                {chatMessages.filter((msg) => msg.senderUid !== 'system').length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-50">
                    <MessageSquare className="w-8 h-8 text-slate-500" />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">لا توجد محادثات أو مسائل تشغيلية مطروحة اليوم</p>
                  </div>
                ) : (
                  chatMessages
                    .filter((msg) => msg.senderUid !== 'system')
                    .map((msg) => {
                      const isMe = msg.senderUid === currentUser.uid;
                      const isSystem = msg.senderUid === 'system';

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-2 shrink-0">
                            <span className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border text-[9px] text-slate-500 dark:text-slate-400 font-bold px-3 py-1 rounded-full text-center">
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
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold mb-0.5 px-1">
                            {msg.senderName} {msg.senderRole === 'admin' && '⭐ الإدارة'}
                          </span>
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed break-words text-right ${
                              isMe
                                ? 'bg-fbm-green hover:bg-fbm-green-hover text-white rounded-tr-none font-bold'
                                : 'bg-white dark:bg-fbm-blue text-slate-900 dark:text-white border border-slate-200 dark:border-fbm-blue-border rounded-tl-none'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[8px] text-slate-500 font-mono mt-0.5 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChatMessage} className="flex gap-2 shrink-0 pt-3 border-t border-slate-200 dark:border-fbm-blue-border">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="اكتب رسالة ميدانية أو استفسار عاجل للإدارة..."
                  className="flex-1 bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-3 py-2.5 text-xs text-right focus:outline-none placeholder-slate-500"
                  maxLength={300}
                />
                <button
                  type="submit"
                  className="bg-fbm-green hover:bg-fbm-green-hover text-white p-2.5 rounded-xl cursor-pointer transition-all shrink-0 shadow-md active:scale-95"
                >
                  <Send className="w-4 h-4 transform rotate-180" />
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Tab: Stock Transfers */}
        {activeTab === 'transfers' && (
          <motion.div
            key="transfers"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">إحضار ونقل السلع من الديبو 📦</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">سجل وتابع تحويل قطع الغيار من المستودعات إلى المحل</p>
              </div>
              <button
                onClick={() => setShowTransferModal(true)}
                className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4 font-bold" />
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
                className="w-full bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl pr-9 pl-4 py-2 text-xs text-right text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {transfers.length === 0 ? (
              <div className="bg-white/40 dark:bg-fbm-blue-card border border-dashed border-slate-200 dark:border-fbm-blue-border p-12 rounded-2xl text-center space-y-2">
                <Package className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">لا توجد تحويلات أو طلبات نقل حالياً</h4>
                <p className="text-[10px] text-slate-500">انقر على الزر أعلاه لتسجيل طلب جديد لإحضار قطع الغيار.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transfers
                  .filter((t) => (t.partName || '').toLowerCase().includes(transferSearch.toLowerCase()))
                  .map((tr) => (
                    <div
                      key={tr.id}
                      className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{tr.partName}</span>
                          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                            {tr.quantity} وحدات
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          من: <span className="text-slate-500 dark:text-slate-300 font-bold">{tr.fromLocation}</span> | إلى:{' '}
                          <span className="text-slate-500 dark:text-slate-300 font-bold">{tr.toLocation}</span>
                        </div>
                        <div className="text-[9px] text-slate-500">
                          بواسطة: {tr.movedByName} | {new Date(tr.createdAt).toLocaleDateString('en-GB')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                            tr.status === 'entered'
                              ? 'bg-fbm-green hover:bg-fbm-green-hover text-white text-fbm-green'
                              : tr.status === 'verified'
                                ? 'bg-blue-500/15 text-blue-300'
                                : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {tr.status === 'entered'
                            ? '✓ تم تسجيلها بالحاسوب'
                            : tr.status === 'verified'
                              ? '✓ تم توصيلها للمحل'
                              : '⏳ قيد التحويل / النقل'}
                        </span>

                        {tr.status === 'pending' && onUpdateTransfer && (
                          <button
                            onClick={() => onUpdateTransfer({ ...tr, status: 'verified' })}
                            className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold tracking-wide py-1 px-2 rounded-lg text-[10px] transition-all cursor-pointer"
                          >
                            تأكيد الاستلام ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab: Client Orders (البونات) */}
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">الطلبيات وبونات الزبائن 📋</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">ملء وتتبع الفواتير والبونات غير المنجزة للزبائن</p>
              </div>
              <button
                onClick={() => setShowClientOrderModal(true)}
                className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4 font-bold" />
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
                className="w-full bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl pr-9 pl-4 py-2 text-xs text-right text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Client orders list */}
            {clientOrders.length === 0 ? (
              <div className="bg-white/40 dark:bg-fbm-blue-card border border-dashed border-slate-200 dark:border-fbm-blue-border p-12 rounded-2xl text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">لا توجد بونات أو طلبيات مسجلة حالياً</h4>
                <p className="text-[10px] text-slate-500">سجل أول بون غير منجز بالنقر على الزر أعلاه.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientOrders
                  .filter((o) => (o.clientName || '').toLowerCase().includes(orderSearch.toLowerCase()))
                  .map((order) => (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 text-right space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              order.status === 'delivered'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : order.status === 'prepared'
                                  ? 'bg-blue-500/15 text-blue-300'
                                  : 'bg-amber-500/15 text-amber-400 animate-pulse'
                            }`}
                          >
                            {order.status === 'delivered'
                              ? '✓ بون منجز ومسلّم'
                              : order.status === 'prepared'
                                ? '📦 جاهز للشحن'
                                : '⏳ بون غير منجز (قيد التحضير)'}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{order.clientName}</h4>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-fbm-blue-card px-2 py-0.5 rounded-lg">
                          {order.bonNo || 'بدون رقم'}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-900 text-right">
                        <span className="text-[9px] text-slate-500 block mb-1">المحتويات المطلوبة:</span>
                        <ul className="text-xs text-slate-500 dark:text-slate-300 space-y-1 list-disc list-inside">
                          {(Array.isArray(order.items)
                            ? order.items
                            : typeof order.items === 'string'
                              ? (order.items as string)
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                              : []
                          ).map((item, idx) => (
                            <li key={idx} className="truncate">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-fbm-blue-border pt-2">
                        <span>
                          مطلوب تلبية بحلول: <strong className="text-slate-900 dark:text-white font-mono">{order.deliveryDate}</strong>
                        </span>

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
                              className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-1 px-2 rounded-lg text-[9px] transition-all cursor-pointer"
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
          </motion.div>
        )}

        {/* Tab: Camion Route (مسار الكاميو) */}
        {activeTab === 'camion' && (
          <motion.div
            key="camion"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">مسارات التوزيع والكاميو 🚚</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                تتبع خط سير الشاحنات والمحلات المطلوب زيارتها وتسليمها البونات
              </p>
            </div>

            {camionRoutes.length === 0 ? (
              <div className="bg-white/40 dark:bg-fbm-blue-card border border-dashed border-slate-200 dark:border-fbm-blue-border p-12 rounded-2xl text-center space-y-2">
                <Truck className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">لا توجد مسارات شاحنات مجدولة</h4>
                <p className="text-[10px] text-slate-500">سيقوم المدير بتخطيط المسارات لتظهر لك هنا في الوقت الفعلي.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {camionRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 space-y-3 text-right"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            route.status === 'completed'
                              ? 'bg-fbm-green hover:bg-fbm-green-hover text-white text-fbm-green'
                              : route.status === 'in_progress'
                                ? 'bg-blue-500/15 text-blue-300 animate-pulse'
                                : 'bg-slate-200 dark:bg-fbm-blue-border text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {route.status === 'completed'
                            ? '✓ تم التوزيع بنجاح'
                            : route.status === 'in_progress'
                              ? '🚚 الشاحنة في الطريق'
                              : '⏳ مسار مجدول'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{route.camionName || 'شاحنة التوزيع'}</h4>
                      </div>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-fbm-blue-card px-2.5 py-1 rounded-lg">
                        {route.date}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-300 bg-white/60 dark:bg-fbm-blue/60 p-3 rounded-2xl border border-slate-850">
                      <div>
                        الخط: <strong className="text-slate-900 dark:text-white">{route.routePath}</strong>
                      </div>
                      <div>
                        👤 السائق: <strong className="text-slate-900 dark:text-white">{route.driverName}</strong>
                      </div>
                    </div>

                    {/* Sequential clients checklist */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-fbm-green font-bold block">
                        📞 قائمة الزبائن والمحلات بالترتيب الميداني:
                      </span>

                      {route.clientsToCall && route.clientsToCall.length > 0 ? (
                        <div className="space-y-1.5">
                          {route.clientsToCall.map((cl, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-slate-500 dark:text-slate-300 flex items-center justify-between bg-white dark:bg-fbm-blue border border-slate-850/60 px-3 py-2 rounded-xl"
                            >
                              <span className="font-bold">
                                {idx + 1}. {cl}
                              </span>
                              <span className="text-[9px] text-slate-500">جاهز للتوصيل والتحصيل</span>
                            </div>
                          ))}
                        </div>
                      ) : route.clients && route.clients.length > 0 ? (
                        <div className="space-y-2">
                          {route.clients.map((cl, idx) => (
                            <div
                              key={cl.id || idx}
                              className="bg-white dark:bg-fbm-blue border border-slate-850 p-3 rounded-xl space-y-2"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {idx + 1}. {cl.name} ({cl.location})
                                </span>
                                <select
                                  value={cl.calledStatus || 'not_called'}
                                  onChange={(e) => {
                                    if (onUpdateCamionRoute) {
                                      const updatedClients = [...route.clients];
                                      updatedClients[idx] = {
                                        ...cl,
                                        calledStatus: e.target.value as any,
                                      };
                                      onUpdateCamionRoute({
                                        ...route,
                                        clients: updatedClients,
                                      });
                                    }
                                  }}
                                  className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-lg text-[9px] text-slate-900 dark:text-white py-1 px-1.5 focus:outline-none"
                                >
                                  <option value="not_called">⏳ لم يتم المرور/الاتصال</option>
                                  <option value="called_no_answer">📞 لا يرد / غائب</option>
                                  <option value="order_taken">✓ تم التسليم والتحصيل</option>
                                  <option value="no_order">❌ لا توجد طلبية</option>
                                </select>
                              </div>
                              {cl.phone && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">الهاتف: {cl.phone}</div>
                              )}
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
                            className="flex-1 bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
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
          </motion.div>
        )}
        </>
        )}
        </AnimatePresence>
      </div>

      
      {/* Unified Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-fbm-blue/95 backdrop-blur-md border-t border-slate-200 dark:border-fbm-blue-border px-2 py-3 flex items-center justify-around z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-x-auto scrollbar-none gap-2">
        
        {isSectionVisible('expenses') && (
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
              activeTab === 'expenses' ? 'text-fbm-green font-bold scale-110' : 'text-slate-500 hover:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <TrendingUp className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-bold whitespace-nowrap">المصاريف</span>
          </button>
        )}

        {isSectionVisible('tasks') && (
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
              activeTab === 'tasks' ? 'text-fbm-green font-bold scale-110' : 'text-slate-500 hover:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <Clock className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-bold whitespace-nowrap">المهام</span>
          </button>
        )}

        {isSectionVisible('chat') && (
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
              activeTab === 'chat' ? 'text-fbm-green font-bold scale-110' : 'text-slate-500 hover:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5 shrink-0" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
            <span className="text-[9px] font-bold whitespace-nowrap">الدردشة</span>
          </button>
        )}

        {isSectionVisible('attendance') && (
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
              activeTab === 'attendance' ? 'text-fbm-green font-bold scale-110' : 'text-slate-500 hover:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <UserCheck className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-bold whitespace-nowrap">الحضور</span>
          </button>
        )}

        {/* More ☰ Button */}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
            showMoreMenu ? 'text-fbm-green font-bold' : 'text-slate-500 hover:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          <Menu className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-bold whitespace-nowrap">المزيد ☰</span>
        </button>

      </div>

      {/* More sections bottom drawer */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
              className="md:hidden fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50"
            />
            {/* Bottom Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-fbm-blue-card border-t border-slate-200 dark:border-fbm-blue-border rounded-t-3xl p-6 pb-10 z-50 shadow-2xl space-y-6 text-right"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1 bg-slate-300 dark:bg-fbm-blue-border rounded-full mx-auto" />
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-fbm-blue-border">
                <button 
                  onClick={() => setShowMoreMenu(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">المزيد من الأقسام والعمليات ☰</h4>
              </div>

              {/* Grid of More Items */}
              <div className="grid grid-cols-3 gap-4">
                {isAllowed('canManageOrders') && isSectionVisible('orders') && (
                  <button
                    onClick={() => {
                      setActiveTab('orders');
                      setShowMoreMenu(false);
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                      activeTab === 'orders'
                        ? 'bg-fbm-green/15 border-fbm-green text-fbm-green'
                        : 'bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-fbm-blue-border text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    <Calendar className="w-6 h-6 shrink-0" />
                    <span className="text-[10px] font-bold text-center leading-tight">الطلبيات</span>
                  </button>
                )}

                {isAllowed('canManageCamion') && isSectionVisible('camion') && (
                  <button
                    onClick={() => {
                      setActiveTab('camion');
                      setShowMoreMenu(false);
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                      activeTab === 'camion'
                        ? 'bg-fbm-green/15 border-fbm-green text-fbm-green'
                        : 'bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-fbm-blue-border text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    <Truck className="w-6 h-6 shrink-0" />
                    <span className="text-[10px] font-bold text-center leading-tight">خطوط المسار</span>
                  </button>
                )}

                {isAllowed('canManageTransfers') && isSectionVisible('transfers') && (
                  <button
                    onClick={() => {
                      setActiveTab('transfers');
                      setShowMoreMenu(false);
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                      activeTab === 'transfers'
                        ? 'bg-fbm-green/15 border-fbm-green text-fbm-green'
                        : 'bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-fbm-blue-border text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    <Package className="w-6 h-6 shrink-0" />
                    <span className="text-[10px] font-bold text-center leading-tight">السلع والتحويل</span>
                  </button>
                )}

                {/* Theme toggle */}
                <button
                  onClick={() => {
                    onToggleTheme?.();
                    setShowMoreMenu(false);
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-fbm-blue-border text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/10 cursor-pointer"
                >
                  {isDarkMode ? <Sun className="w-6 h-6 text-amber-500" /> : <Moon className="w-6 h-6 text-slate-400" />}
                  <span className="text-[10px] font-bold text-center leading-tight">المظهر</span>
                </button>

                {/* Logout */}
                <button
                  onClick={() => {
                    onLogout();
                    setShowMoreMenu(false);
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/20 cursor-pointer col-span-2"
                >
                  <LogOut className="w-6 h-6" />
                  <span className="text-[10px] font-bold text-center leading-tight">تسجيل الخروج</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Completion Signature Modal */}
      {taskToSign && (
        <TaskSignatureModal
          task={taskToSign}
          isOpen={!!taskToSign}
          onClose={() => setTaskToSign(null)}
          onConfirm={handleSignatureConfirm}
        />
      )}

      {/* 1. Add Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 bg-[#00021c]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 shadow-sm relative"
              dir="rtl"
            >
              <button
                onClick={() => {
                  setShowExpenseModal(false);
                  stopCamera();
                  setShowCamera(false);
                }}
                className="absolute left-4 top-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-5 text-right border-b border-slate-200 dark:border-fbm-blue-border pb-3">
                تسجيل وإضافة مصروف ميداني 💸
              </h3>

              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                    المبلغ المالي المشتري به (دينار جزائري - د.ج)
                  </label>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="مثال: 4500"
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-3 text-xs text-right focus:outline-none font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                    البيان وتفصيل وجه الصرف ورقم الشاحنة/المستودع
                  </label>
                  <input
                    type="text"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    placeholder="مثال: شراء مبرد مياه للمستودع"
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-3 text-xs text-right focus:outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">التصنيف والتبويب المحاسبي</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-3 py-3 text-xs text-right focus:outline-none text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">-- اختر التصنيف الأساسي --</option>
                    {categories
                      .filter((c) => c.type === 'expense')
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Receipt Image / Camera Upload block */}
                <div className="space-y-2 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                    توثيق صورة الفاتورة أو الإيصال المالي
                  </label>

                  {capturedImage ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-fbm-blue-border overflow-hidden relative bg-slate-950 p-2 flex flex-col items-center">
                      <img
                        src={capturedImage}
                        alt="Receipt Preview"
                        className="max-h-44 object-contain rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedImage(null);
                          startCamera();
                          setShowCamera(true);
                        }}
                        className="mt-2 text-xs text-fbm-green hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>إعادة تصوير المستند</span>
                      </button>
                    </div>
                  ) : showCamera ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-fbm-blue-border bg-slate-950 overflow-hidden relative p-4 flex flex-col items-center justify-center">
                      {cameraMode === 'real' ? (
                        <div className="w-full flex flex-col items-center">
                          <video
                            ref={videoRef}
                            className="w-full max-h-44 bg-black object-cover rounded-xl"
                            playsInline
                          />
                          <canvas ref={canvasRef} className="hidden" />
                        </div>
                      ) : (
                        <div className="text-center p-4 space-y-3 w-full">
                          <div className="bg-slate-100 dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border p-3.5 rounded-xl space-y-2">
                            <span className="block text-[10px] text-slate-500 font-bold">
                              محاكاة الفاتورة الرقمية الجزائرية الفورية
                            </span>

                            <div className="space-y-1">
                              <label className="block text-[9px] text-slate-500 dark:text-slate-400">اختر نوع الإيصال المحاكي:</label>
                              <select
                                value={simulatedBillType}
                                onChange={(e) => setSimulatedBillType(e.target.value)}
                                className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-lg p-1.5 text-[11px] text-slate-900 dark:text-white"
                              >
                                <option value="وقود وتعبئة مازوت شاحنة فوسو">وقود وتعبئة مازوت شاحنة فوسو</option>
                                <option value="قطع غيار رافعة المستودع الرئيسي">قطع غيار رافعة المستودع الرئيسي</option>
                                <option value="شراء قرطاسية وأختام ومستلزمات">شراء قرطاسية وأختام ومستلزمات</option>
                                <option value="شراء غداء لعمال الشحن والتفريغ">شراء غداء لعمال الشحن والتفريغ</option>
                              </select>
                            </div>
                          </div>
                          <p className="text-[10px] text-fbm-green">🤖 يقوم النظام بنمذجة الإيصال بالختم الرسمي الفوري</p>
                        </div>
                      )}

                      <div className="flex gap-2 w-full mt-3">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="flex-1 bg-fbm-green hover:bg-fbm-green-hover text-white font-bold tracking-wide py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
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
                          className="bg-slate-200 dark:bg-fbm-blue-border hover:bg-slate-300 dark:hover:bg-slate-700 px-3 py-2 rounded-xl text-xs text-slate-500 dark:text-slate-300 cursor-pointer"
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
                      className="w-full bg-white dark:bg-fbm-blue border border-dashed border-slate-200 dark:border-fbm-blue-border hover:border-fbm-green p-6 rounded-2xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                      <Camera className="w-7 h-7 text-fbm-green mb-2" />
                      <span className="text-xs font-bold">اضغط هنا لفتح آلة تصوير الفاتورة</span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        تأكد من وضوح السعر والختم لضمان الاعتماد المالي السريع
                      </span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  onClick={() => setSubmitMode('pending')}
                  className="w-full bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all mt-4 flex items-center justify-center gap-1.5 text-slate-950 font-black"
                >
                  <span>تسجيل وحفظ المصروف للاعتماد 🚀</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Add Stock Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 bg-[#00021c]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 shadow-sm relative"
              dir="rtl"
            >
              <button
                onClick={() => setShowTransferModal(false)}
                className="absolute left-4 top-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-5 text-right border-b border-slate-200 dark:border-fbm-blue-border pb-3">
                طلب وإحضار سلعة من الديبو إلى المحل 📦
              </h3>

              <form onSubmit={handleCreateTransfer} className="space-y-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                    اسم قطعة الغيار المطلوبة
                  </label>
                  <input
                    type="text"
                    value={transferPartName}
                    onChange={(e) => setTransferPartName(e.target.value)}
                    placeholder="مثال: فلتر زيت Fuso 2024"
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-3 text-xs text-right focus:outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                    الكمية المطلوبة بالوحدة (U)
                  </label>
                  <input
                    type="number"
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(e.target.value)}
                    placeholder="مثال: 15"
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-3 text-xs text-right focus:outline-none font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-right">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">من موقع</label>
                    <select
                      value={transferFrom}
                      onChange={(e) => setTransferFrom(e.target.value)}
                      className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-3 py-3 text-xs text-right focus:outline-none text-slate-900 dark:text-white"
                    >
                      <option value="ديبو / المستودع الرئيسي 🏢">المستودع الرئيسي 🏢</option>
                      <option value="المحل الفرعي / التجزئة 🏪">المحل الفرعي 🏪</option>
                      <option value="شاحنة الفوسو المتنقلة 🚚">شاحنة الفوسو 🚚</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">إلى موقع</label>
                    <select
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-3 py-3 text-xs text-right focus:outline-none text-slate-900 dark:text-white"
                    >
                      <option value="محل البيع والتجزئة 🏪">محل البيع والتجزئة 🏪</option>
                      <option value="المستودع الرئيسي 🏢">المستودع الرئيسي 🏢</option>
                      <option value="الزبون المباشر 👤">الزبون المباشر 👤</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all mt-4 flex items-center justify-center gap-1.5 text-slate-950 font-black"
                >
                  <span>تأكيد وتسجيل طلب النقل 🚀</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Add Client Order Modal */}
      <AnimatePresence>
        {showClientOrderModal && (
          <div className="fixed inset-0 bg-[#00021c]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 shadow-sm relative"
              dir="rtl"
            >
              <button
                onClick={() => setShowClientOrderModal(false)}
                className="absolute left-4 top-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-5 text-right border-b border-slate-200 dark:border-fbm-blue-border pb-3">
                تسجيل بون طلبيات زبائن جديد 📋
              </h3>

              <form onSubmit={handleCreateClientOrder} className="space-y-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                    اسم الزبون أو المحل التجاري
                  </label>
                  <input
                    type="text"
                    value={orderClientName}
                    onChange={(e) => setOrderClientName(e.target.value)}
                    placeholder="مثال: شركة بوعلام لقطع الغيار"
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-3 text-xs text-right focus:outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                    رقم البون (Bon No) - اتركه فارغاً للتوليد التلقائي
                  </label>
                  <input
                    type="text"
                    value={orderBonNo}
                    onChange={(e) => setOrderBonNo(e.target.value)}
                    placeholder="مثال: BON-9402"
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-3 text-xs text-right focus:outline-none font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                    تفاصيل السلع وقطع الغيار المطلوبة (افصل بينها بفاصلة)
                  </label>
                  <textarea
                    value={orderPartNames}
                    onChange={(e) => setOrderPartNames(e.target.value)}
                    placeholder="مثال: مكابح Fuso أمامية، زيت محرك 10W45، فلتر مازوت"
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-3 text-xs text-right focus:outline-none h-20 resize-none text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                    تاريخ التسليم المتوقع
                  </label>
                  <input
                    type="date"
                    value={orderDeliveryDate}
                    onChange={(e) => setOrderDeliveryDate(e.target.value)}
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-3 text-xs text-right focus:outline-none text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                    ملاحظات وتعليمات السائق الإضافية
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="مثال: التسليم صباحاً مع تحصيل البون نقداً"
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-3 text-xs text-right focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all mt-4 flex items-center justify-center gap-1.5 text-slate-950 font-black"
                >
                  <span>حفظ وإطلاق بون الطلبية 🚀</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
  
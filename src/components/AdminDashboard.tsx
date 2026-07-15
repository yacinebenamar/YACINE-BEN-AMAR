import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { exportToCSV } from '../utils/export';
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
  ClientDebt,
  CamionRoute,
  SupplierAlert,
  SectionVisibility,
} from '../types';
import { playNotificationChime } from '../utils/audio';
import { saveSectionsVisibilityToFirestore } from '../firebase';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { 
  FileSpreadsheet,
  Plus,
  Trash2,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ListCollapse,
  Layers,
  Megaphone,
  Check,
  X,
  LogOut,
  TrendingUp,
  Wallet,
  Users, Activity,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  AlertCircle, AlertTriangle,
  Smartphone,
  Download,
  Globe,
  Share2,
  Sparkles,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Send,
  Calendar,
  Printer,
  UserCheck,
  Camera,
  RefreshCw,
  LayoutGrid,
  MoreHorizontal,
  Menu,
  Archive,
  ListTodo,
  Settings,
  Package,
  Truck,
  Volume2,
  CreditCard,
  Moon, Sun } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import NotificationPopover from './NotificationPopover';
import FBMLogo from './FBMLogo';
import WorkerDashboard from './WorkerDashboard';
import TaskSignatureModal from './TaskSignatureModal';

interface AdminDashboardProps {
  currentUser: AppUser;
  users: AppUser[];
  categories: CompanyCategory[];
  tasks: CompanyTask[];
  expenses: CompanyExpense[];
  notifications: CompanyNotification[];
  attendance: AttendanceRecord[];
  chatMessages: ChatMessage[];
  transfers: StockTransfer[];
  clientOrders: ClientOrder[];
  clientDebts: ClientDebt[];
  camionRoutes: CamionRoute[];
  supplierAlerts: SupplierAlert[];
  onLogout: () => void;
  onUpdateExpenses: (newExpenses: CompanyExpense[]) => void;
  onAddExpense?: (expense: CompanyExpense) => void;
  onDeleteExpense?: (id: string) => Promise<void>;
  onUpdateTasks: (newTasks: CompanyTask[]) => void;
  onDeleteTask?: (id: string) => Promise<void>;
  onUpdateCategories: (newCategories: CompanyCategory[]) => void;
  onAddNotification: (notif: CompanyNotification) => void;
  onUpdateNotifications: (newNotifications: CompanyNotification[]) => void;
  onUpdateNotification?: (notification: CompanyNotification) => Promise<void>;
  onUpdateUsers: (newUsers: AppUser[]) => void;
  onAddChatMessage: (msg: ChatMessage) => void;
  onAddTransfer: (t: StockTransfer) => Promise<void>;
  onUpdateTransfer: (t: StockTransfer) => Promise<void>;
  onDeleteTransfer: (id: string) => Promise<void>;
  onAddClientOrder: (o: ClientOrder) => Promise<void>;
  onUpdateClientOrder: (o: ClientOrder) => Promise<void>;
  onDeleteClientOrder: (id: string) => Promise<void>;
  onAddClientDebt: (d: ClientDebt) => Promise<void>;
  onUpdateClientDebt: (d: ClientDebt) => Promise<void>;
  onDeleteClientDebt: (id: string) => Promise<void>;
  onAddCamionRoute: (r: CamionRoute) => Promise<void>;
  onUpdateCamionRoute: (r: CamionRoute) => Promise<void>;
  onDeleteCamionRoute: (id: string) => Promise<void>;
  onAddSupplierAlert: (s: SupplierAlert) => Promise<void>;
  onUpdateSupplierAlert: (s: SupplierAlert) => Promise<void>;
  onDeleteSupplierAlert: (id: string) => Promise<void>;
  onUpdateAttendance?: (record: AttendanceRecord) => void;

  // View mode switcher props
  adminViewMode?: 'admin' | 'worker';
  onToggleViewMode?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  sectionsVisibility: SectionVisibility[];
}

export default function AdminDashboard({
  currentUser,
  users,
  categories,
  tasks,
  expenses,
  notifications,
  attendance,
  chatMessages,
  transfers,
  clientOrders,
  clientDebts,
  camionRoutes,
  supplierAlerts,
  onLogout,
  onUpdateExpenses,
  onAddExpense,
  onDeleteExpense,
  onUpdateTasks,
  onDeleteTask,
  onUpdateCategories,
  onAddNotification,
  onUpdateNotifications,
  onUpdateNotification,
  onUpdateUsers,
  onAddChatMessage,
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
  onUpdateAttendance,

  // View mode switcher parameters
  adminViewMode = 'admin',
  onToggleViewMode,
  isDarkMode,
  onToggleTheme,
  sectionsVisibility = [],
}: AdminDashboardProps) {
  // Toggle Admin session into Worker view mode
  const [isAdminWorkingAsWorker, setIsAdminWorkingAsWorker] = useState(false);

  // Unified expense creation and camera states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const expenseDraftKey = `admin_expense_draft_${currentUser.uid}`;
  const [showCamera, setShowCamera] = useState(false);
  const [simulatedBillType, setSimulatedBillType] = useState('وقود وتعبئة مازوت');
  const [submitMode, setSubmitMode] = useState<'approved' | 'pending'>('pending');
  const [cameraMode, setCameraMode] = useState<'real' | 'simulated'>('simulated');
  const [taskToSign, setTaskToSign] = useState<CompanyTask | null>(null);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [showCharts, setShowCharts] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const [localToast, setLocalToast] = useState<{
    id: string;
    title: string;
    body: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'expense' | 'task';
    itemId: string;
    itemTitle: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Auto-dismissal for local toast
  useEffect(() => {
    if (!localToast) return;
    const timer = setTimeout(() => {
      setLocalToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [localToast]);

  useEffect(() => {
    try {
      const draftStr = localStorage.getItem(expenseDraftKey);
      if (!draftStr) return;
      const draft = JSON.parse(draftStr);
      if (draft.amount) setExpenseAmount(draft.amount);
      if (draft.desc) setExpenseDesc(draft.desc);
      if (draft.category) setExpenseCategory(draft.category);
      if (draft.capturedImage) setCapturedImage(draft.capturedImage);
    } catch (error) {
      console.warn('Failed to restore expense draft', error);
    }
  }, [expenseDraftKey]);

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

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'users'
    | 'categories'
    | 'tasks'
    | 'expenses'
    | 'attendance'
    | 'chat'
    | 'transfers'
    | 'orders'
    | 'camion'
    | 'broadcast'
    | 'debts'
    | 'settings'
  >('overview');
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);

  // Track last read chat timestamp to calculate unread badge count
  const [lastReadChat, setLastReadChat] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`admin_last_read_chat_${currentUser.uid}`);
      return saved ? parseInt(saved, 10) : Date.now();
    } catch (e) {
      return Date.now();
    }
  });

  const unreadChatCount = chatMessages.filter(
    (m) => m.senderUid !== currentUser.uid && new Date(m.createdAt).getTime() > lastReadChat
  ).length;

  useEffect(() => {
    if (activeTab === 'chat') {
      const now = Date.now();
      setLastReadChat(now);
      localStorage.setItem(`admin_last_read_chat_${currentUser.uid}`, now.toString());
    }
  }, [activeTab, chatMessages, currentUser.uid]);
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selectedExpenseForReview, setSelectedExpenseForReview] = useState<CompanyExpense | null>(null);

  // New task form state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showQuickExpenseForm, setShowQuickExpenseForm] = useState(false);
  const [showQuickCategoryForm, setShowQuickCategoryForm] = useState(false);
  const [showQuickBroadcastForm, setShowQuickBroadcastForm] = useState(false);
  const [showQuickUserForm, setShowQuickUserForm] = useState(false);
  const [taskSubTab, setTaskSubTab] = useState<'active' | 'archived'>('active');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskWorkerUids, setNewTaskWorkerUids] = useState<string[]>([]);
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'task'>('expense');

  // Broadcast form state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'specific'>('all');
  const [broadcastTargetUids, setBroadcastTargetUids] = useState<string[]>([]);

  // New user registration state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmailPrefix, setNewUserEmailPrefix] = useState('');
  const [newUserRole, setNewUserRole] = useState<'worker' | 'admin'>('worker');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserSubRole, setNewUserSubRole] = useState<string>('worker');
  const [newUserDepartments, setNewUserDepartments] = useState<string[]>([]);
  const [userSearchText, setUserSearchText] = useState('');

  // Local states for correcting expenses and user permissions
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseDesc, setEditExpenseDesc] = useState('');
  const [editExpenseCategory, setEditExpenseCategory] = useState('');
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<AppUser | null>(null);

  // Keys for draft local storage
  const taskDraftKey = `admin_task_draft_${currentUser.uid}`;
  const broadcastDraftKey = `admin_broadcast_draft_${currentUser.uid}`;

  // 1. Load drafts on mount
  useEffect(() => {
    const taskDraftStr = localStorage.getItem(taskDraftKey);
    if (taskDraftStr) {
      try {
        const d = JSON.parse(taskDraftStr);
        if (d.title) setNewTaskTitle(d.title);
        if (d.desc) setNewTaskDesc(d.desc);
        if (d.category) setNewTaskCategory(d.category);
        if (d.workerUids) setNewTaskWorkerUids(d.workerUids);
        if (d.dueDate) setNewTaskDueDate(d.dueDate);
      } catch (e) {}
    }

    const broadcastDraftStr = localStorage.getItem(broadcastDraftKey);
    if (broadcastDraftStr) {
      try {
        const d = JSON.parse(broadcastDraftStr);
        if (d.title) setBroadcastTitle(d.title);
        if (d.body) setBroadcastBody(d.body);
        if (d.target) setBroadcastTarget(d.target);
        if (d.targetUids) setBroadcastTargetUids(d.targetUids);
      } catch (e) {}
    }
  }, [taskDraftKey, broadcastDraftKey]);

  // 2. Save task draft when values change
  useEffect(() => {
    if (newTaskTitle || newTaskDesc || newTaskCategory || newTaskWorkerUids.length > 0 || newTaskDueDate) {
      localStorage.setItem(
        taskDraftKey,
        JSON.stringify({
          title: newTaskTitle,
          desc: newTaskDesc,
          category: newTaskCategory,
          workerUids: newTaskWorkerUids,
          dueDate: newTaskDueDate,
        })
      );
    } else {
      localStorage.removeItem(taskDraftKey);
    }
  }, [newTaskTitle, newTaskDesc, newTaskCategory, newTaskWorkerUids, newTaskDueDate, taskDraftKey]);

  // 3. Save broadcast draft when values change
  useEffect(() => {
    if (broadcastTitle || broadcastBody || broadcastTarget !== 'all' || broadcastTargetUids.length > 0) {
      localStorage.setItem(
        broadcastDraftKey,
        JSON.stringify({
          title: broadcastTitle,
          body: broadcastBody,
          target: broadcastTarget,
          targetUids: broadcastTargetUids,
        })
      );
    } else {
      localStorage.removeItem(broadcastDraftKey);
    }
  }, [broadcastTitle, broadcastBody, broadcastTarget, broadcastTargetUids, broadcastDraftKey]);

  useEffect(() => {
    if (selectedExpenseForReview) {
      setEditExpenseAmount(selectedExpenseForReview.amount.toString());
      setEditExpenseDesc(selectedExpenseForReview.description);
      setEditExpenseCategory(selectedExpenseForReview.category);
    }
  }, [selectedExpenseForReview]);

  // Redirect to first permitted tab if activeTab is not allowed for the supervisor
  useEffect(() => {
    const isAllowed = (tab: typeof activeTab): boolean => {
      if (currentUser.role === 'admin') return true;
      const perms = currentUser.permissions || {};
      switch (tab) {
        case 'transfers':
          return !!perms.canManageTransfers;
        case 'orders':
          return !!perms.canManageOrders;
        case 'debts':
          return !!perms.canManageDebts;
        case 'camion':
          return !!perms.canManageCamion;
        case 'expenses':
          return !!perms.canViewAllExpenses;
        case 'tasks':
          return !!perms.canManageTasks;
        case 'attendance':
          return !!perms.canManageAttendance;
        case 'chat':
          return true; // Chat is always allowed
        default:
          return false; // Admin-only tabs (categories, broadcast, users)
      }
    };

    if (!isAllowed(activeTab)) {
      const possibleTabs: (typeof activeTab)[] = [
        'transfers',
        'orders',
        'debts',
        'camion',
        'expenses',
        'tasks',
        'attendance',
        'chat',
      ];
      const fallback = possibleTabs.find((tab) => isAllowed(tab)) || 'chat';
      setActiveTab(fallback);
    }
  }, [activeTab, currentUser]);

  // Expandable tasks tracking
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Modal & form states for auto parts enterprise
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newTransferPartName, setNewTransferPartName] = useState('');
  const [newTransferQty, setNewTransferQty] = useState<number>(10);
  const [newTransferFrom, setNewTransferFrom] = useState<'المخزن 1' | 'المخزن 2' | 'المحل' | 'الشاحنة'>('المخزن 1');
  const [newTransferTo, setNewTransferTo] = useState<'المخزن 1' | 'المخزن 2' | 'المحل' | 'الشاحنة'>('المحل');
  const [newTransferWorkerUid, setNewTransferWorkerUid] = useState('');
  const [newTransferEnteredByPc, setNewTransferEnteredByPc] = useState('');
  const [newTransferStatus, setNewTransferStatus] = useState<'pending' | 'entered'>('pending');

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrderClientName, setNewOrderClientName] = useState('');
  const [newOrderItems, setNewOrderItems] = useState('');
  const [newOrderDeliveryDate, setNewOrderDeliveryDate] = useState('');
  const [newOrderStatus, setNewOrderStatus] = useState<'pending' | 'prepared' | 'delivered'>('pending');
  const [newOrderRouteId, setNewOrderRouteId] = useState('');

  const [showDebtModal, setShowDebtModal] = useState(false);
  const [newDebtClientName, setNewDebtClientName] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState<number>(0);
  const [newDebtPaid, setNewDebtPaid] = useState<number>(0);
  const [newDebtDueDate, setNewDebtDueDate] = useState('');
  const [newDebtStatus, setNewDebtStatus] = useState<'unpaid' | 'partial' | 'paid'>('unpaid');

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [newRouteCamionName, setNewRouteCamionName] = useState('شاحنة FBM (كاميو توزيع)');
  const [newRouteDriverName, setNewRouteDriverName] = useState('');
  const [newRouteDate, setNewRouteDate] = useState('');
  const [newRouteClientsToCall, setNewRouteClientsToCall] = useState('');
  const [newRouteStatus, setNewRouteStatus] = useState<'planned' | 'in_progress' | 'completed'>('planned');

  const [showSupplierAlertModal, setShowSupplierAlertModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPartName, setNewSupplierPartName] = useState('');
  const [newSupplierQtyIssue, setNewSupplierQtyIssue] = useState<number>(0);
  const [newSupplierSeverity, setNewSupplierSeverity] = useState<'info' | 'warning' | 'critical'>('warning');
  const [newSupplierNotes, setNewSupplierNotes] = useState('');

  const visibleChatMessages = chatMessages.filter((msg) => {
    if (msg.senderUid === 'system') return false;
    const text = `${msg.text || ''}`.toLowerCase();
    return !text.includes('ترحيب') && !text.includes('مرحبا') && !text.includes('welcome');
  });

  // Search/Filters for operational tabs
  const [transferSearch, setTransferSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [debtSearch, setDebtSearch] = useState('');
  const [routeSearch, setRouteSearch] = useState('');

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

  // Register new employee
  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserName.trim() || !newUserEmailPrefix || !newUserEmailPrefix.trim()) return;

    const cleanEmailPrefix = (newUserEmailPrefix || '').trim().toLowerCase().replace(/\s+/g, '');
    const userEmail = `${cleanEmailPrefix}@fbm.local`;

    // Check if user already exists
    if (users.some((u) => (u.email || '').toLowerCase() === (userEmail || '').toLowerCase())) {
      alert('⚠️ اسم المستخدم هذا مسجل بالفعل لموظف آخر!');
      return;
    }

    const newUser: AppUser = {
      uid: `user_${Date.now()}`,
      email: userEmail,
      fullName: newUserName.trim(),
      role: newUserRole,
      isActive: true,
      password: newUserPassword,
      subRole: newUserSubRole,
      departments: newUserDepartments,
    };

    onUpdateUsers([...users, newUser]);

    // Send a notification broadcast about the new team member
    onAddNotification({
      id: `notif_sys_user_${Date.now()}`,
      title: '🎉 ترحيب بزميل عمل جديد في طاقم العمل',
      body: `يسر الإدارة الترحيب بـ "${newUserName.trim()}" في طاقم عمل الإخوة FBM وتفعيل حسابه الرسمي بالمؤسسة.`,
      targetType: 'all',
      readByUids: [],

      createdAt: new Date().toISOString(),
    });

    setNewUserName('');
    setNewUserEmailPrefix('');
    setNewUserRole('worker');
    setNewUserPassword('123456');
    setNewUserSubRole('worker');
    setNewUserDepartments([]);
    setShowQuickUserForm(false);
    alert('✅ تم تسجيل الحساب الجديد وإضافته لقاعدة البيانات وتفعيل الدخول بنجاح!');
  };

  // Toggle user activation status
  const handleToggleUserActive = (uid: string) => {
    const updated = users.map((u) => {
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
      const updated = users.filter((u) => u.uid !== uid);
      onUpdateUsers(updated);
    }
  };

  // Save edited user permissions to database
  const handleSavePermissions = () => {
    if (!editingPermissionsUser) return;

    const updated = users.map((u) => {
      if (u.uid === editingPermissionsUser.uid) {
        return { ...u, permissions: editingPermissionsUser.permissions };
      }
      return u;
    });

    onUpdateUsers(updated);
    setEditingPermissionsUser(null);
    alert('✅ تم تحديث صلاحيات الموظف وحفظها بنجاح!');
  };

  // Toggle single permission checkbox
  const handleTogglePermissionKey = (key: keyof NonNullable<AppUser['permissions']>) => {
    if (!editingPermissionsUser) return;

    const currentPerms = editingPermissionsUser.permissions || {};
    const updatedPerms = {
      ...currentPerms,
      [key]: !currentPerms[key],
    };

    setEditingPermissionsUser({
      ...editingPermissionsUser,
      permissions: updatedPerms,
    });
  };

  // Stats calculation
  const totalExpensesAmount = expenses.filter((e) => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);

  const pendingExpensesCount = expenses.filter((e) => e.status === 'pending').length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'in_progress').length;
  const activeWorkersCount = users.filter((u) => u.role === 'worker' && u.isActive).length;

  const isSupervisorOrAdmin = currentUser.role === 'admin' || currentUser.subRole === 'supervisor';
  const isWorker = currentUser.role === 'worker';
  const isCurrentViewWorker = isWorker || adminViewMode === 'worker' || isAdminWorkingAsWorker;
  const canApproveExpenses =
    isSupervisorOrAdmin || currentUser.permissions?.canApproveExpenses || currentUser.permissions?.canAuditExpenses;
  const canEditExpenses =
    isSupervisorOrAdmin || currentUser.permissions?.canEditExpenses || currentUser.permissions?.canAuditExpenses;
  const canViewFinancialReports = isSupervisorOrAdmin || currentUser.permissions?.canViewFinancialReports;

  // Handle expense approval/rejection with auditing/correction capability
  const handleReviewExpense = (
    expenseId: string,
    status: 'approved' | 'rejected',
    correctedAmount?: number,
    correctedCategory?: string,
    correctedDescription?: string,
  ) => {
    const updated = expenses.map((e) => {
      if (e.id === expenseId) {
        const isCorrected = correctedAmount !== undefined && correctedAmount !== e.amount;
        return {
          ...e,
          status,
          amount: correctedAmount !== undefined ? correctedAmount : e.amount,
          category: correctedCategory || e.category,
          description: correctedDescription || e.description,
          originalAmount: isCorrected ? e.amount : e.originalAmount || undefined,
          isAudited: true,
          auditedBy: currentUser.fullName,
          auditDate: new Date().toISOString(),
        };
      }
      return e;
    });
    onUpdateExpenses(updated);
    setSelectedExpenseForReview(null);

    setLocalToast({
      id: `review_exp_${Date.now()}`,
      title: status === 'approved' ? 'تم مراجعة واعتماد الفاتورة 🟢' : 'تم مراجعة ورفض الفاتورة 🔴',
      body: `تم تحديث حالة الفاتورة بنجاح في سجل الحسابات.`,
      type: 'success',
    });

    // Notify the worker
    const targetExp = expenses.find((e) => e.id === expenseId);
    if (targetExp) {
      const isCorrected = correctedAmount !== undefined && correctedAmount !== targetExp.amount;
      const statusText =
        status === 'approved' ? (isCorrected ? 'تصحيح واعتماد الفاتورة' : 'اعتماد وقبول الفاتورة') : 'رفض الفاتورة';

      onAddNotification({
        id: `notif_exp_${Date.now()}`,
        title: `تحديث طلب مصروف: ${statusText}`,
        body: isCorrected
          ? `قامت الإدارة بتدقيق وتصحيح مبلغ المصروف من ${targetExp.amount.toLocaleString('en-US')} د.ج إلى ${correctedAmount?.toLocaleString('en-US')} د.ج واعتماده رسميًا.`
          : `تم قبول واعتماد المصروف الخاص بك: "${targetExp.description.slice(0, 30)}..." بقيمة ${targetExp.amount.toLocaleString('en-US')} د.ج.`,
        targetType: 'specific',
        targetUids: [targetExp.workerUid],
        readByUids: [],
        createdByUid: currentUser.uid,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleDeleteExpenseClick = (expenseId: string, description: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'expense',
      itemId: expenseId,
      itemTitle: description,
      onConfirm: async () => {
        try {
          if (onDeleteExpense) {
            await onDeleteExpense(expenseId);
          } else {
            onUpdateExpenses(expenses.filter((e) => e.id !== expenseId));
          }
          setLocalToast({
            id: `del_exp_${Date.now()}`,
            title: 'تم حذف المصروف بنجاح 🗑️',
            body: `تم إزالة المصروف: "${description.slice(0, 30)}..." نهائياً من قائمة المصاريف.`,
            type: 'success',
          });
        } catch (error) {
          setLocalToast({
            id: `del_exp_err_${Date.now()}`,
            title: 'فشل في حذف المصروف ❌',
            body: 'حدث خطأ غير متوقع أثناء محاولة حذف المصروف. يرجى إعادة المحاولة.',
            type: 'error',
          });
        }
        setConfirmModal(null);
      },
    });
  };

  const handleDeleteTaskClick = (taskId: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'task',
      itemId: taskId,
      itemTitle: title,
      onConfirm: async () => {
        try {
          if (onDeleteTask) {
            await onDeleteTask(taskId);
          } else {
            onUpdateTasks(tasks.filter((t) => t.id !== taskId));
          }
          setLocalToast({
            id: `del_task_${Date.now()}`,
            title: 'تم حذف المهمة بنجاح 🗑️',
            body: `تم إزالة المهمة الميدانية: "${title.slice(0, 30)}..." نهائياً من قائمة المهام الموزعة.`,
            type: 'success',
          });
        } catch (error) {
          setLocalToast({
            id: `del_task_err_${Date.now()}`,
            title: 'فشل في حذف المهمة ❌',
            body: 'حدث خطأ غير متوقع أثناء محاولة حذف المهمة. يرجى إعادة المحاولة.',
            type: 'error',
          });
        }
        setConfirmModal(null);
      },
    });
  };

  const handleArchiveTaskClick = async (taskId: string, title: string) => {
    try {
      const updatedTasks = tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, archived: true, archivedAt: new Date().toISOString() };
        }
        return t;
      });
      await onUpdateTasks(updatedTasks);
      setLocalToast({
        id: `archive_task_${Date.now()}`,
        title: 'تم أرشفة المهمة بنجاح 🗄️',
        body: `تم نقل المهمة: "${title.slice(0, 30)}..." بنجاح إلى قسم الأرشيف التاريخي.`,
        type: 'success',
      });
    } catch (error) {
      setLocalToast({
        id: `archive_task_err_${Date.now()}`,
        title: 'فشل في أرشفة المهمة ❌',
        body: 'حدث خطأ أثناء محاولة أرشفة المهمة. يرجى المحاولة لاحقاً.',
        type: 'error',
      });
    }
  };

  const handleUnarchiveTaskClick = async (taskId: string, title: string) => {
    try {
      const updatedTasks = tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, archived: false, archivedAt: null };
        }
        return t;
      });
      await onUpdateTasks(updatedTasks);
      setLocalToast({
        id: `unarchive_task_${Date.now()}`,
        title: 'تم استعادة المهمة بنجاح 📋',
        body: `تم استعادة المهمة: "${title.slice(0, 30)}..." ونقلها مجدداً للمهام النشطة.`,
        type: 'success',
      });
    } catch (error) {
      setLocalToast({
        id: `unarchive_task_err_${Date.now()}`,
        title: 'فشل في استعادة المهمة ❌',
        body: 'حدث خطأ أثناء محاولة استعادة المهمة. يرجى المحاولة لاحقاً.',
        type: 'error',
      });
    }
  };

  const handleBulkArchiveClick = async () => {
    const completedTasks = tasks.filter((t) => t.status === 'done' && t.archived !== true);
    if (completedTasks.length === 0) {
      setLocalToast({
        id: `bulk_archive_empty_${Date.now()}`,
        title: 'لا توجد مهام مكتملة لأرشفتها ℹ️',
        body: 'جميع المهام المكتملة مؤرشفة بالفعل أو لا توجد أي مهمة مكتملة حالياً.',
        type: 'info',
      });
      return;
    }

    try {
      const nowStr = new Date().toISOString();
      const updatedTasks = tasks.map((t) => {
        if (t.status === 'done' && t.archived !== true) {
          return { ...t, archived: true, archivedAt: nowStr };
        }
        return t;
      });
      await onUpdateTasks(updatedTasks);
      setLocalToast({
        id: `bulk_archive_success_${Date.now()}`,
        title: 'تمت الأرشفة الجماعية بنجاح 🧹',
        body: `تم نقل عدد (${completedTasks.length}) مهمة مكتملة إلى الأرشيف التاريخي للعمليات.`,
        type: 'success',
      });
    } catch (error) {
      setLocalToast({
        id: `bulk_archive_err_${Date.now()}`,
        title: 'فشل في الأرشفة الجماعية ❌',
        body: 'حدث خطأ غير متوقع أثناء محاولة الأرشفة الجماعية.',
        type: 'error',
      });
    }
  };

  const handleUpdateSectionVisibility = async (id: string, field: 'workerState' | 'supervisorState', value: 'active' | 'hidden' | 'soon') => {
    const updated = sectionsVisibility.map(sec => {
      if (sec.id === id) {
        return { ...sec, [field]: value };
      }
      return sec;
    });
    try {
      await saveSectionsVisibilityToFirestore(updated);
      setLocalToast({
        id: `vis_updated_${Date.now()}`,
        title: 'تم تحديث الصلاحية بنجاح ⚙️',
        body: 'تم حفظ إعدادات رؤية القسم وتطبيقها على حسابات طاقم العمل فوراً.',
        type: 'success',
      });
    } catch (err) {
      console.error('Error saving section visibility:', err);
      setLocalToast({
        id: `vis_err_${Date.now()}`,
        title: 'خطأ في الحفظ ⚠️',
        body: 'حدث خطأ أثناء الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً.',
        type: 'error',
      });
    }
  };

  // Add Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newTaskTitle.trim();
    const cleanDesc = newTaskDesc.trim();

    if (!cleanTitle || !cleanDesc || newTaskWorkerUids.length === 0 || !newTaskCategory.trim()) {
      setLocalToast({
        id: `task_invalid_${Date.now()}`,
        title: 'إكمال البيانات مطلوب ⚠️',
        body: 'يرجى كتابة عنوان المهمة، وصف واضح، واختيار موظف واحد على الأقل قبل الإرسال.',
        type: 'error',
      });
      return;
    }

    const assignedWorkers = users.filter((u) => newTaskWorkerUids.includes(u.uid));
    if (assignedWorkers.length === 0) {
      setLocalToast({
        id: `task_assign_${Date.now()}`,
        title: 'لم يتم اختيار موظف ✅',
        body: 'لا يمكن إسناد المهمة بدون موظف واحد على الأقل.',
        type: 'error',
      });
      return;
    }

    const assignedToNames = assignedWorkers.map((w) => w.fullName);

    const newTask: CompanyTask = {
      id: `task_${Date.now()}`,
      title: cleanTitle,
      description: cleanDesc,
      categoryName: newTaskCategory.trim(),
      assignedToUids: newTaskWorkerUids,
      assignedToNames: assignedToNames,
      status: 'pending',
      createdAt: new Date().toISOString(),
      dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null,
    };

    onUpdateTasks([newTask, ...tasks]);
    setShowTaskModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskWorkerUids([]);
    setNewTaskCategory('');
    setNewTaskDueDate('');

    setLocalToast({
      id: `task_created_${Date.now()}`,
      title: 'تم إنشاء المهمة بنجاح 📋',
      body: `تمت إضافة المهمة "${cleanTitle}" وإرسال تنبيه للمكلفين بها فوراً.`,
      type: 'success',
    });

    onAddNotification({
      id: `notif_task_${Date.now()}`,
      title: 'مهمة ميدانية جديدة موكلة إليك 📋',
      body: `المدير ${currentUser.fullName.split(' ')[0]} كلفك بمهمة: "${cleanTitle}"، يرجى مراجعة المهام الميدانية.`,
      targetType: 'specific',
      targetUids: newTaskWorkerUids,
      readByUids: [],
      createdByUid: currentUser.uid,
      createdAt: new Date().toISOString(),
    });
  };

  // Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: CompanyCategory = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      type: newCatType,
    };

    onUpdateCategories([...categories, newCat]);
    setNewCatName('');
    setShowQuickCategoryForm(false);
  };

  // Delete Category
  const handleDeleteCategory = (catId: string) => {
    const updated = categories.filter((c) => c.id !== catId);
    onUpdateCategories(updated);
  };

  // Broadcast Alert
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;
    if (broadcastTarget === 'specific' && broadcastTargetUids.length === 0) return;

    onAddNotification({
      id: `notif_b_${Date.now()}`,
      title: broadcastTitle,
      body: broadcastBody,
      targetType: broadcastTarget,
      targetUids: broadcastTarget === 'specific' ? broadcastTargetUids : null,
      readByUids: [],
      createdByUid: currentUser.uid,
      createdAt: new Date().toISOString(),
    });

    setBroadcastTitle('');
    setBroadcastBody('');
    setBroadcastTarget('all');
    setBroadcastTargetUids([]);
    setShowQuickBroadcastForm(false);
  };

  // Submit handlers for auto parts operations
  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransferPartName.trim()) return;

    const assignedWorkers = users.filter((u) => newTransferWorkerUid === u.uid);
    const assignedToNames = assignedWorkers.map((w) => w.fullName);

    const newTransfer: StockTransfer = {
      id: `transfer_${Date.now()}`,
      itemName: newTransferPartName.trim(),
      partName: newTransferPartName.trim(),
      quantity: Number(newTransferQty),
      fromLocation: newTransferFrom,
      toLocation: newTransferTo,
      movedByUid: newTransferWorkerUid || currentUser.uid,
      movedByName: assignedToNames.length > 0 ? assignedToNames[0] : currentUser.fullName,
      enteredByPcName: newTransferEnteredByPc || '',
      isEnteredIntoPcSalesSystem: newTransferStatus === 'entered',
      isEnteredInSalesSystem: newTransferStatus === 'entered',
      status: newTransferStatus,

      createdAt: new Date().toISOString(),
    };

    await onAddTransfer(newTransfer);
    setShowTransferModal(false);
    setNewTransferPartName('');
    setNewTransferQty(10);
    setNewTransferWorkerUid('');
    setNewTransferEnteredByPc('');
    setNewTransferStatus('pending');

    // Notify workers
    onAddNotification({
      id: `notif_trans_${Date.now()}`,
      title: 'طلب نقل سلع جديد 📦',
      body: `تم تسجيل طلب نقل ${newTransfer.quantity} وحدات من "${newTransfer.partName}" من ${newTransfer.fromLocation} إلى ${newTransfer.toLocation}.`,
      targetType: newTransferWorkerUid ? 'specific' : 'all',
      targetUids: newTransferWorkerUid ? [newTransferWorkerUid] : null,
      readByUids: [],
      createdByUid: currentUser.uid,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderClientName.trim() || !newOrderItems.trim()) return;

    const newOrder: ClientOrder = {
      id: `order_${Date.now()}`,
      clientName: newOrderClientName.trim(),
      items: newOrderItems
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      deliveryDate: newOrderDeliveryDate || new Date().toISOString().slice(0, 10),
      status: newOrderStatus,
      assignedRouteId: newOrderRouteId || '',

      createdAt: new Date().toISOString(),
    };

    await onAddClientOrder(newOrder);
    setShowOrderModal(false);
    setNewOrderClientName('');
    setNewOrderItems('');
    setNewOrderDeliveryDate('');
    setNewOrderStatus('pending');
    setNewOrderRouteId('');

    onAddNotification({
      id: `notif_order_${Date.now()}`,
      title: 'طلب تحضير زبون جديد 📋',
      body: `طلبية جديدة للزبون "${newOrder.clientName}" جاهزة للتحضير قبل تاريخ ${newOrder.deliveryDate}.`,
      targetType: 'all',
      readByUids: [],
      createdByUid: currentUser.uid,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSubmitDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebtClientName.trim() || !newDebtDueDate) return;

    const newDebt: ClientDebt = {
      id: `debt_${Date.now()}`,
      clientName: newDebtClientName.trim(),
      totalAmount: Number(newDebtAmount),
      paidAmount: Number(newDebtPaid),
      dueDate: newDebtDueDate,
      status: newDebtStatus,

      createdAt: new Date().toISOString(),
    };

    await onAddClientDebt(newDebt);
    setShowDebtModal(false);
    setNewDebtClientName('');
    setNewDebtAmount(0);
    setNewDebtPaid(0);
    setNewDebtDueDate('');
    setNewDebtStatus('unpaid');

    // Notification alert about potential debt collection
    onAddNotification({
      id: `notif_debt_${Date.now()}`,
      title: 'سجل ذمة مالية (دين زبون) 💳',
      body: `تم تقييد دين مالي للزبون "${newDebt.clientName}" بقيمة ${newDebt.totalAmount} د.ج يستحق بتاريخ ${newDebt.dueDate}.`,
      targetType: 'all',
      readByUids: [],
      createdByUid: currentUser.uid,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSubmitRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteDriverName.trim() || !newRouteDate) return;

    const newRoute: CamionRoute = {
      id: `route_${Date.now()}`,
      camionName: newRouteCamionName,
      driverName: newRouteDriverName,
      date: newRouteDate,
      dayOfWeek: new Date(newRouteDate).toLocaleDateString('en-GB', { weekday: 'long' }),
      routePath: 'توزيع عام',
      clientsToCall: newRouteClientsToCall
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      clients: [],
      status: newRouteStatus,

      createdAt: new Date().toISOString(),
    };

    await onAddCamionRoute(newRoute);
    setShowRouteModal(false);
    setNewRouteDriverName('');
    setNewRouteDate('');
    setNewRouteClientsToCall('');
    setNewRouteStatus('planned');

    onAddNotification({
      id: `notif_route_${Date.now()}`,
      title: 'مسار شاحنة توزيع جديد 🚚',
      body: `تم تحديد مسار شاحنة التوزيع بقيادة ${newRoute.driverName} ليوم ${newRoute.date}. يرجى التنسيق والاتصال بالزبائن.`,
      targetType: 'all',
      readByUids: [],
      createdByUid: currentUser.uid,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSubmitSupplierAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim() || !newSupplierPartName.trim()) return;

    const newAlert: SupplierAlert = {
      id: `alert_${Date.now()}`,
      supplierName: newSupplierName.trim(),
      type: 'merchandise_error',
      partName: newSupplierPartName.trim(),
      quantityIssue: Number(newSupplierQtyIssue),
      severity: newSupplierSeverity,
      notes: newSupplierNotes.trim(),

      createdAt: new Date().toISOString(),
    };

    await onAddSupplierAlert(newAlert);
    setShowSupplierAlertModal(false);
    setNewSupplierName('');
    setNewSupplierPartName('');
    setNewSupplierQtyIssue(0);
    setNewSupplierSeverity('warning');
    setNewSupplierNotes('');

    onAddNotification({
      id: `notif_sup_${Date.now()}`,
      title: `⚠️ تنبيه استيراد وموردين: ${newAlert.supplierName}`,
      body: `خطأ بضائع المورد في "${newAlert.partName}" بقيمة عجز ${newAlert.quantityIssue} وحدات. تفقد المستودع فوراً!`,
      targetType: 'all',
      readByUids: [],
      createdByUid: currentUser.uid,
      createdAt: new Date().toISOString(),
    });
  };

  // Camera & Invoice simulated document generator methods
  const startCamera = async () => {
    setCapturedImage(null);
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
      console.warn('Real camera not available, fallback to simulated scanner.', err);
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
      generateSimulatedInvoice();
    }
  };

  const generateSimulatedInvoice = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 600, 800);

    const gradient = ctx.createRadialGradient(300, 400, 100, 300, 400, 500);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 800);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 560, 760);

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

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px "Cairo", sans-serif';
    ctx.fillText('فاتورة شراء وتوريد مالي', 300, 145);

    ctx.textAlign = 'right';
    ctx.font = '14px "Cairo", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`الرقم التسلسلي: FBM-B-${Math.floor(100000 + Math.random() * 900000)}`, 540, 200);
    ctx.fillText(`التاريخ: ${new Date().toLocaleDateString('en-GB')}`, 540, 225);
    ctx.fillText('الجهة المصدرة: شركة نقل وتوريدات LES FRÈRES BENAMAR ش.ذ.م.م', 540, 250);
    ctx.fillText(`اسم المقتني: ${currentUser.fullName}`, 540, 275);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 310, 520, 200);
    ctx.beginPath();
    ctx.moveTo(40, 350);
    ctx.lineTo(560, 350);
    ctx.moveTo(180, 310);
    ctx.lineTo(180, 510);
    ctx.moveTo(350, 310);
    ctx.lineTo(350, 510);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px "Cairo", sans-serif';
    ctx.fillText('المجموع د.ج', 170, 335);
    ctx.fillText('الكمية / التفصيل', 340, 335);
    ctx.fillText('بيان المواد المشتراة والمصاريف', 540, 335);

    ctx.font = '14px "Cairo", sans-serif';
    ctx.fillText(`${expenseAmount || '0'} د.ج`, 170, 385);
    ctx.fillText('وحدة كاملة / ميداني', 340, 385);
    ctx.fillText(expenseDesc || simulatedBillType, 540, 385);

    ctx.strokeStyle = 'rgba(220, 38, 38, 0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(420, 620, 65, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = 'rgba(220, 38, 38, 0.65)';
    ctx.font = 'bold 11px "Cairo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LES FRÈRES BENAMAR', 420, 600);
    ctx.fillText('FBM الجزائر', 420, 620);
    ctx.fillText('مقبول وصالح للدفع', 420, 640);

    ctx.font = 'italic 12px "Courier New"';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText('FBM_Sign', 420, 690);

    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseCategory) return;

    // For worker, the expense defaults to 'pending' (طلب مصروف).
    // For admin or supervisor (isSupervisorOrAdmin), they can set it directly as 'approved' or 'pending'
    const finalStatus = isSupervisorOrAdmin ? submitMode : 'pending';

    const newExpense: CompanyExpense = {
      id: `exp_${Date.now()}`,
      workerUid: currentUser.uid,
      workerName: currentUser.fullName,
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      description: expenseDesc || `مصروف لفئة ${expenseCategory}`,
      status: finalStatus,

      createdAt: new Date().toISOString(),
      receiptImage: capturedImage,
    };

    if (onAddExpense) {
      onAddExpense(newExpense);
    } else {
      onUpdateExpenses([newExpense, ...expenses]);
    }

    // Auto-create chat system notification
    onAddChatMessage({
      id: `chat_exp_${Date.now()}`,
      senderUid: 'system',
      senderName: finalStatus === 'approved' ? 'النظام المالي (اعتماد مباشر) 🟢' : 'النظام المالي (طلب مصروف) ⏳',
      senderRole: 'admin',
      text: `تم تسجيل مصروف جديد بقيمة ${newExpense.amount} د.ج لفئة ${newExpense.category} من طرف ${newExpense.workerName}. الحالة: ${finalStatus === 'approved' ? 'معتمد ومؤكد مباشر' : 'قيد المراجعة والتدقيق'}`,

      createdAt: new Date().toISOString(),
    });

    setLocalToast({
      id: `add_exp_${Date.now()}`,
      title: finalStatus === 'approved' ? 'تم تسجيل واعتماد المصروف فورا 🟢' : 'تم رفع طلب المصروف للمراجعة ⏳',
      body: `تم تسجيل مبلغ ${parseFloat(expenseAmount).toLocaleString('en-US')} د.ج لفئة ${expenseCategory} بنجاح.`,
      type: 'success',
    });

    setShowExpenseModal(false);
    setShowQuickExpenseForm(false);
    setExpenseAmount('');
    setExpenseDesc('');
    setExpenseCategory('');
    setCapturedImage(null);
    localStorage.removeItem(expenseDraftKey);
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Excel/CSV Export
  const handleExportCSV = () => {
    // Generate CSV contents based on the exact search & filter currently applied
    const itemsToExport = expenses.filter((e) => {
      const matchSearch =
        (e.workerName || '').toLowerCase().includes((expenseSearch || '').toLowerCase()) ||
        (e.description || '').toLowerCase().includes((expenseSearch || '').toLowerCase()) ||
        (e.category || '').toLowerCase().includes((expenseSearch || '').toLowerCase());
      const matchFilter = expenseFilter === 'all' || e.status === expenseFilter;
      return matchSearch && matchFilter;
    });

    let csvContent = '\ufeff'; // BOM for UTF-8 in Excel
    // Column headers in Arabic
    csvContent +=
      'المعرف الفريد,الموظف المكلف,المبلغ المعتمد (د.ج),المبلغ الأصلي (د.ج),الفئة المحاسبية,البيان والتفصيل,الحالة,تاريخ التسجيل,المراجع/المدقق\n';

    itemsToExport.forEach((e) => {
      const statusText = e.status === 'approved' ? 'معتمد' : e.status === 'rejected' ? 'مرفوض' : 'معلق';
      const cleanDesc = (e.description || '').replace(/"/g, '""').replace(/,/g, '،').replace(/\n/g, ' ');
      const cleanWorker = (e.workerName || '').replace(/"/g, '""').replace(/,/g, '،');
      const cleanCat = (e.category || '').replace(/"/g, '""').replace(/,/g, '،');
      const auditedByText = e.auditedBy ? (e.auditedBy || '').replace(/"/g, '""').replace(/,/g, '،') : 'بدون تعديل';
      const originalAmountText = e.originalAmount !== undefined ? e.originalAmount : e.amount;
      const formattedDate = e.createdAt ? new Date(e.createdAt).toLocaleString('en-GB') : '';

      csvContent += `"${e.id}","${cleanWorker}",${e.amount},${originalAmountText},"${cleanCat}","${cleanDesc}","${statusText}","${formattedDate}","${auditedByText}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_مصاريف_طاقم_العمل_بن_عمر_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered expenses list
  const filteredExpenses = expenses.filter((e) => {
    if (isCurrentViewWorker && e.workerUid !== currentUser.uid) {
      return false;
    }
    const matchSearch =
      (e.workerName || '').toLowerCase().includes((expenseSearch || '').toLowerCase()) ||
      (e.description || '').toLowerCase().includes((expenseSearch || '').toLowerCase()) ||
      (e.category || '').toLowerCase().includes((expenseSearch || '').toLowerCase());
    const matchFilter = expenseFilter === 'all' || e.status === expenseFilter;
    return matchSearch && matchFilter;
  });

  // --- Recharts Analytics calculations for Current Month ---
  const currentMonthData = (() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Filter current month's expenses and tasks
    const currentMonthExpenses = expenses.filter((e) => {
      if (!e.createdAt) return false;
      const d = new Date(e.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const currentMonthTasks = tasks.filter((t) => {
      if (!t.createdAt) return false;
      const d = new Date(t.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    // 2. Expenses by Category
    const approvedMonthExpenses = currentMonthExpenses.filter((e) => e.status === 'approved');
    const expenseByCategoryMap = approvedMonthExpenses.reduce(
      (acc, e) => {
        const cat = e.category || 'أخرى';
        acc[cat] = (acc[cat] || 0) + e.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const expenseByCategoryData = Object.entries(expenseByCategoryMap).map(([name, value]) => ({
      name,
      value,
    }));

    // 3. Task Status Breakdown
    const taskStatusCounts = currentMonthTasks.reduce(
      (acc, t) => {
        const status = t.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { pending: 0, in_progress: 0, done: 0 } as Record<string, number>,
    );

    const taskStatusData = [
      { name: 'منجزة ✓', value: taskStatusCounts.done || 0, color: '#76BC21' },
      { name: 'قيد التنفيذ ⏳', value: taskStatusCounts.in_progress || 0, color: '#3b82f6' },
      { name: 'معلقة ⏳', value: taskStatusCounts.pending || 0, color: '#f59e0b' },
    ].filter((item) => item.value > 0);

    // 4. Daily progression of approved expenses
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyExpensesMap: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      dailyExpensesMap[i] = 0;
    }

    approvedMonthExpenses.forEach((e) => {
      const d = new Date(e.createdAt);
      const day = d.getDate();
      if (day >= 1 && day <= daysInMonth) {
        dailyExpensesMap[day] = (dailyExpensesMap[day] || 0) + e.amount;
      }
    });

    const todayDayNum = now.getDate();
    const maxDaysToShow = Math.max(todayDayNum, 15);
    const dailyExpensesData = Object.entries(dailyExpensesMap)
      .map(([dayStr, amount]) => ({
        day: `يوم ${dayStr}`,
        'المصاريف (د.ج)': amount,
      }))
      .slice(0, maxDaysToShow);

    return {
      expenseByCategoryData,
      taskStatusData,
      dailyExpensesData,
      totalExpensesThisMonth: approvedMonthExpenses.reduce((sum, e) => sum + e.amount, 0),
      totalTasksThisMonth: currentMonthTasks.length,
      completedTasksThisMonth: taskStatusCounts.done || 0,
    };
  })();

  return (
    <div className="min-h-screen bg-fbm-light dark:bg-fbm-blue text-slate-900 dark:text-white flex flex-col md:flex-row pb-24 md:pb-0 font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Mobile Top Header (Sleek and Compact) */}
      
      {/* Mobile Premium Header */}
      <div className="md:hidden bg-white/90 dark:bg-fbm-blue-card/90 backdrop-blur-xl border-b border-slate-200 dark:border-fbm-blue-border px-5 pt-8 pb-5 flex flex-col z-40 sticky top-0 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-fbm-blue-border flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-fbm-blue transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="relative w-10 h-10 rounded-full border border-fbm-green bg-fbm-green/10 flex items-center justify-center font-bold text-sm text-fbm-green font-sans">
              ي
              <span className="absolute bottom-0 -right-0 w-2.5 h-2.5 bg-fbm-green text-white rounded-full border-2 border-white dark:border-fbm-blue-card"></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <FBMLogo size="sm" />
          </div>
        </div>
        <div className="mt-2 text-right">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">القيادة المركزية</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">نظام الإدارة المتكامل</p>
        </div>
      </div>

      {/* Desktop Premium Sidebar */}
      <div className="hidden md:flex w-[280px] bg-white dark:bg-fbm-blue-card border-l border-slate-200 dark:border-fbm-blue-border shrink-0 p-6 flex-col justify-between overflow-y-auto z-40 shadow-xl shadow-fbm-blue-border/5">
    
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <FBMLogo size="md" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">FBM ERP</h2>
              <p className="text-[10px] text-fbm-green font-bold">إدارة العمليات المركزية</p>
            </div>
          </div>
          
          <nav className="space-y-1.5 mt-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-fbm-green/10 text-fbm-green font-bold border-r-4 border-r-[#76BC21] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border-r-4 border-transparent'
              }`}
            >
              <span>نظرة عامة والعمليات</span>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'attendance'
                  ? 'bg-fbm-green/10 text-fbm-green font-bold border-r-4 border-r-[#76BC21] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border-r-4 border-transparent'
              }`}
            >
              <span>الحضور والانصراف</span>
              <UserCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'tasks'
                  ? 'bg-fbm-green/10 text-fbm-green font-bold border-r-4 border-r-[#76BC21] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border-r-4 border-transparent'
              }`}
            >
              <span>المهام التشغيلية</span>
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'expenses'
                  ? 'bg-fbm-green/10 text-fbm-green font-bold border-r-4 border-r-[#76BC21] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border-r-4 border-transparent'
              }`}
            >
              <span>المالية والمصاريف</span>
              <TrendingUp className="w-4 h-4" />
            </button>
          </nav>
        </div>
        
        <div className="pt-6 border-t border-slate-200 dark:border-fbm-blue-border mt-8">
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-fbm-blue hover:text-slate-900 dark:hover:text-white"
          >
            <span>{isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-500/10 hover:text-red-600 mt-2"
          >
            <span>تسجيل الخروج</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unified Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#000839]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#0a1660] px-2 py-3 flex items-center justify-around z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] gap-1">
        
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'overview' ? 'text-fbm-green font-bold scale-110' : 'text-slate-500 hover:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-bold whitespace-nowrap">الرئيسية</span>
        </button>
        
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'expenses' ? 'text-fbm-green font-bold scale-110' : 'text-slate-500 hover:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-bold whitespace-nowrap">المصاريف</span>
        </button>
        
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'tasks' ? 'text-fbm-green font-bold scale-110' : 'text-slate-500 hover:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-bold whitespace-nowrap">المهام</span>
        </button>
        
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

        {/* More ☰ Button */}
        <button
          onClick={() => setShowMobileMoreMenu(true)}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
            showMobileMoreMenu ? 'text-fbm-green font-bold' : 'text-slate-500 hover:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          <Menu className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-bold whitespace-nowrap">المزيد ☰</span>
        </button>
        
      </div>

      {/* Admin Mobile More bottom drawer */}
      <AnimatePresence>
        {showMobileMoreMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMoreMenu(false)}
              className="md:hidden fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50"
            />
            {/* Bottom Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#050e46] border-t border-slate-200 dark:border-[#0a1660] rounded-t-3xl p-6 pb-10 z-50 shadow-2xl space-y-6 text-right"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1 bg-slate-300 dark:bg-fbm-blue-border rounded-full mx-auto" />
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#0a1660]">
                <button 
                  onClick={() => setShowMobileMoreMenu(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">أقسام لوحة الإدارة 🛠️</h4>
              </div>

              {/* Grid of More Admin Items */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setActiveTab('users');
                    setShowMobileMoreMenu(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'users' ? 'bg-fbm-green/15 border-fbm-green text-fbm-green' : 'bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-[#0a1660] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Users className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-bold text-center leading-tight">الموظفين</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('attendance');
                    setShowMobileMoreMenu(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'attendance' ? 'bg-fbm-green/15 border-fbm-green text-fbm-green' : 'bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-[#0a1660] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <UserCheck className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-bold text-center leading-tight">الحضور</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('transfers');
                    setShowMobileMoreMenu(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'transfers' ? 'bg-fbm-green/15 border-fbm-green text-fbm-green' : 'bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-[#0a1660] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Package className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-bold text-center leading-tight">التحويلات</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('orders');
                    setShowMobileMoreMenu(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'orders' ? 'bg-fbm-green/15 border-fbm-green text-fbm-green' : 'bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-[#0a1660] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Calendar className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-bold text-center leading-tight">الطلبيات</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('debts');
                    setShowMobileMoreMenu(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'debts' ? 'bg-fbm-green/15 border-fbm-green text-fbm-green' : 'bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-[#0a1660] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-bold text-center leading-tight">الديون</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('camion');
                    setShowMobileMoreMenu(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'camion' ? 'bg-fbm-green/15 border-fbm-green text-fbm-green' : 'bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-[#0a1660] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Truck className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-bold text-center leading-tight">المسارات</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('categories');
                    setShowMobileMoreMenu(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'categories' ? 'bg-fbm-green/15 border-fbm-green text-fbm-green' : 'bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-[#0a1660] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ListTodo className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-bold text-center leading-tight">الفئات</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('broadcast');
                    setShowMobileMoreMenu(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'broadcast' ? 'bg-fbm-green/15 border-fbm-green text-fbm-green' : 'bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-[#0a1660] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Megaphone className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-bold text-center leading-tight">بث إشعار</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowMobileMoreMenu(false);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'settings' ? 'bg-fbm-green/15 border-fbm-green text-fbm-green' : 'bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-[#0a1660] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Settings className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-bold text-center leading-tight">إعدادات</span>
                </button>

                {/* Additional actions inside sheet */}
                <button
                  onClick={() => {
                    onToggleTheme?.();
                    setShowMobileMoreMenu(false);
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border bg-slate-50 dark:bg-fbm-blue/50 border-slate-200 dark:border-[#0a1660] text-slate-700 dark:text-slate-300 hover:border-slate-300 cursor-pointer"
                >
                  {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-400" />}
                  <span className="text-[10px] font-bold text-center leading-tight">المظهر</span>
                </button>

                <button
                  onClick={() => {
                    onLogout();
                    setShowMobileMoreMenu(false);
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border bg-red-50 dark:bg-red-950/15 border-red-200 dark:border-red-900/30 text-red-500 cursor-pointer col-span-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-[10px] font-bold text-center leading-tight">تسجيل الخروج</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="p-4 md:p-6 space-y-6 md:space-y-8 pb-32 md:pb-6"
          >

            <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 md:p-6 shadow-sm animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-5 border-b border-slate-200 dark:border-fbm-blue-border">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isCurrentViewWorker
                      ? 'تسجيل ومتابعة المصاريف الميدانية 💸'
                      : 'إدارة واعتماد مصاريف طاقم العمل الميداني'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isCurrentViewWorker
                      ? 'تسجيل الفواتير، الوقود، وتكاليف النقل الفورية ومتابعة حالة الاعتماد'
                      : 'مراجعة الفواتير المرفوعة والوقود وتكاليف النقل واعتمادها'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setShowCamera(false);
                      setExpenseAmount('');
                      setExpenseDesc('');
                      setExpenseCategory('');
                      setShowExpenseModal(true);
                    }}
                    className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold tracking-wide px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4 font-bold" />
                    <span>إضافة مصروف 💸</span>
                  </button>

                  {!isCurrentViewWorker && canViewFinancialReports && (
                    <button
                      onClick={handleExportCSV}
                      className="bg-slate-200 dark:bg-fbm-blue-border hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-300 dark:border-fbm-blue-border shadow-md self-start md:self-auto"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>تصدير Excel (ملف الحسابات)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filters and search row */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    placeholder="ابحث باسم الموظف أو البيان أو الفئة..."
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl pr-10 pl-4 py-2.5 text-xs text-right focus:outline-none placeholder-slate-500 transition-all"
                  />
                </div>

                {/* Status selectors filter */}
                <div className="flex gap-1 bg-white dark:bg-fbm-blue p-1 rounded-xl border border-slate-200 dark:border-fbm-blue-border overflow-x-auto shrink-0">
                  <button
                    onClick={() => setExpenseFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      expenseFilter === 'all' ? 'bg-fbm-green hover:bg-fbm-green-hover text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    الكل ({expenses.length})
                  </button>
                  <button
                    onClick={() => setExpenseFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      expenseFilter === 'pending' ? 'bg-amber-500 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    معلق ({expenses.filter((e) => e.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setExpenseFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      expenseFilter === 'approved' ? 'bg-emerald-600 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    معتمد ({expenses.filter((e) => e.status === 'approved').length})
                  </button>
                  <button
                    onClick={() => setExpenseFilter('rejected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      expenseFilter === 'rejected' ? 'bg-red-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    مرفوض ({expenses.filter((e) => e.status === 'rejected').length})
                  </button>
                </div>
              </div>

              {/* Expenses List */}
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12 bg-white/40 dark:bg-fbm-blue/40 rounded-2xl border border-dashed border-slate-200 dark:border-fbm-blue-border">
                  <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">لا توجد مصاريف مسجلة مطابقة للبحث أو الفلترة</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-slate-300 dark:hover:border-white/10 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold bg-fbm-green/10 text-fbm-green px-2.5 py-0.5 rounded-full">
                            {expense.category}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(expense.createdAt).toLocaleDateString('en-GB')}{' '}
                            {new Date(expense.createdAt).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{expense.description}</h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                          <span>الموظف المكلف:</span>
                          <span className="text-slate-200 font-semibold">{expense.workerName}</span>
                        </div>

                        {expense.originalAmount !== undefined && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-lg w-fit">
                            <span>
                              🔄 تم التدقيق والتعديل: المبلغ الأصلي كان {expense.originalAmount.toLocaleString('en-US')}{' '}
                              د.ج
                            </span>
                            {expense.auditedBy && (
                              <span className="text-slate-500">• المراجع: {expense.auditedBy}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 dark:border-fbm-blue-border/60">
                        <div className="text-right">
                          <span className="block text-[10px] text-slate-500 font-medium">القيمة المالية</span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                            {expense.amount.toLocaleString('en-US')} <span className="text-xs font-sans">د.ج</span>
                          </span>
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
                          {expense.status === 'pending' &&
                            (isCurrentViewWorker ? (
                              <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-xl text-xs font-bold animate-pulse">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                                <span>قيد المراجعة</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => setSelectedExpenseForReview(expense)}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                              >
                                مراجعة واعتماد
                              </button>
                            ))}

                          {/* Always show delete button for authorized administrators and supervisors */}
                          {(currentUser.role === 'admin' ||
                            currentUser.subRole === 'supervisor' ||
                            currentUser.permissions?.canAuditExpenses ||
                            (expense.workerUid === currentUser.uid && expense.status === 'pending')) && (
                            <button
                              onClick={() => handleDeleteExpenseClick(expense.id, expense.description)}
                              title="حذف هذا المصروف نهائياً"
                              className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-xl transition-all cursor-pointer border border-red-500/20 hover:border-red-500 flex items-center justify-center shrink-0"
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
          </motion.div>
        )}

        {/* Tab 2: Tasks Manager */}
        {activeTab === 'tasks' && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 md:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-200 dark:border-fbm-blue-border">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">توزيع ومتابعة العمليات اليومية للعمال</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">إرسال المهام وساعات بدء العمل وإتمام العمل الفعلي</p>
              </div>
              <button
                onClick={() => setShowTaskModal(true)}
                className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold tracking-wide px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4 font-bold" />
                <span>إسناد مهمة جديدة</span>
              </button>
            </div>

            {/* Contextual Stats and Charts for Tasks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fadeIn">
              {/* Stats Card 1: Active Tasks */}
              <div className="bg-white/40 dark:bg-fbm-blue/40 border border-slate-200 dark:border-fbm-blue-border p-4.5 rounded-2xl text-right flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-fbm-green/10 rounded-xl text-fbm-green">
                      <ListTodo className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 font-sans">المهام النشطة</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                    {pendingTasksCount + inProgressTasksCount}{' '}
                    <span className="text-xs font-sans text-slate-500">عملية</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    {inProgressTasksCount} قيد التنفيذ حالياً و {pendingTasksCount} معلقة بانتظار البدء
                  </p>
                </div>
              </div>

              {/* Stats Card 2: Completed Tasks */}
              <div className="bg-white/40 dark:bg-fbm-blue/40 border border-slate-200 dark:border-fbm-blue-border p-4.5 rounded-2xl text-right flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 font-sans">المهام المنجزة</span>
                  </div>
                  <h3 className="text-xl font-bold text-emerald-400 font-mono">
                    {currentMonthData.completedTasksThisMonth}{' '}
                    <span className="text-xs font-sans text-slate-500">مهمة</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">تم إكمالها وإغلاقها بالكامل بنجاح خلال هذا الشهر</p>
                </div>
              </div>

              {/* Chart Card: Task Status Doughnut */}
              <div className="bg-white/40 dark:bg-fbm-blue/40 border border-slate-200 dark:border-fbm-blue-border p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 font-sans">نسبة الإنجاز الإجمالية 📋</span>
                    <strong className="text-fbm-green text-xs font-mono">
                      {currentMonthData.totalTasksThisMonth > 0
                        ? Math.round(
                            (currentMonthData.completedTasksThisMonth / currentMonthData.totalTasksThisMonth) * 100,
                          )
                        : 0}
                      %
                    </strong>
                  </div>

                  <div className="h-28 w-full flex items-center justify-center" dir="ltr">
                    {currentMonthData.taskStatusData.length === 0 ? (
                      <div className="text-[10px] text-slate-500 text-center">لا توجد مهام تشغيلية موكلة لعرضها</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={currentMonthData.taskStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={22}
                            outerRadius={38}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {currentMonthData.taskStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#000839',
                              border: '1px solid #1e293b',
                              borderRadius: '12px',
                              fontSize: '9px',
                              color: '#fff',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="flex gap-2 justify-center mt-1 text-[9px]">
                    {currentMonthData.taskStatusData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-500 dark:text-slate-400">{item.name}:</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-tab Navigation and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white/60 dark:bg-fbm-blue/60 p-3 rounded-2xl border border-slate-200 dark:border-fbm-blue-border">
              <div className="flex gap-2">
                <button
                  onClick={() => setTaskSubTab('active')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    taskSubTab === 'active'
                      ? 'bg-fbm-green hover:bg-fbm-green-hover text-white shadow-md shadow-[#76BC21]/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40 dark:bg-fbm-blue-border/40'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  <span>المهام الحالية واليومية</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${taskSubTab === 'active' ? 'bg-white/20 dark:bg-fbm-blue/20 text-slate-900' : 'bg-slate-200 dark:bg-fbm-blue-border text-slate-500 dark:text-slate-400'}`}
                  >
                    {tasks.filter((t) => t.archived !== true).length}
                  </span>
                </button>
                <button
                  onClick={() => setTaskSubTab('archived')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    taskSubTab === 'archived'
                      ? 'bg-fbm-green hover:bg-fbm-green-hover text-white shadow-md shadow-[#76BC21]/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40 dark:bg-fbm-blue-border/40'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span>أرشيف العمليات</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${taskSubTab === 'archived' ? 'bg-white/20 dark:bg-fbm-blue/20 text-slate-900' : 'bg-slate-200 dark:bg-fbm-blue-border text-slate-500 dark:text-slate-400'}`}
                  >
                    {tasks.filter((t) => t.archived === true).length}
                  </span>
                </button>
              </div>

              {taskSubTab === 'active' && (
                <button
                  onClick={handleBulkArchiveClick}
                  className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-slate-900 font-bold px-3.5 py-2 rounded-xl text-xs transition-all border border-amber-500/20 hover:border-amber-500 flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-sm"
                  title="أرشفة كافة المهام التي تم إنجازها لتنظيف القائمة الحالية"
                >
                  <Archive className="w-4 h-4" />
                  <span>أرشفة المهام المكتملة جماعياً 🧹</span>
                </button>
              )}
            </div>

            {/* Task list with expandable logs */}
            {(() => {
              const filteredTasks = tasks.filter((task) => {
                if (taskSubTab === 'active') {
                  return task.archived !== true;
                } else {
                  return task.archived === true;
                }
              });

              if (filteredTasks.length === 0) {
                return (
                  <div className="text-center py-12 bg-white/40 dark:bg-fbm-blue/40 rounded-2xl border border-dashed border-slate-200 dark:border-fbm-blue-border">
                    <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {taskSubTab === 'active' ? 'لا توجد مهام نشطة حالياً' : 'أرشيف العمليات فارغ حالياً'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {taskSubTab === 'active'
                        ? 'يمكنك إسناد مهمة جديدة لطاقم العمل الميداني.'
                        : 'المهام المكتملة التي تتم أرشفتها ستظهر هنا للحفاظ على السجل التاريخي.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredTasks.map((task) => {
                    const isExpanded = expandedTaskId === task.id;
                    return (
                      <div
                        key={task.id}
                        className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-2xl hover:border-slate-300 dark:hover:border-white/10 transition-all overflow-hidden"
                      >
                        <div
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer select-none"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold bg-slate-200 dark:bg-fbm-blue-border text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                {task.categoryName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(task.createdAt).toLocaleDateString('en-GB')}
                              </span>
                              {task.archived && (
                                <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                                  مؤرشفة
                                </span>
                              )}
                              {task.dueDate && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                                    task.status === 'done'
                                      ? 'bg-slate-200 dark:bg-fbm-blue-border text-slate-500 dark:text-slate-400'
                                      : new Date(task.dueDate).getTime() - Date.now() < 0
                                        ? 'bg-red-500/15 border border-red-500/30 text-red-400 animate-pulse'
                                        : new Date(task.dueDate).getTime() - Date.now() <= 24 * 60 * 60 * 1000
                                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse'
                                          : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                  }`}
                                >
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>
                                    {task.status === 'done'
                                      ? 'كان يستحق: '
                                      : new Date(task.dueDate).getTime() - Date.now() < 0
                                        ? 'متأخرة: '
                                        : 'يستحق: '}
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
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{task.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              المكلف:{' '}
                              <span className="text-fbm-green font-semibold">
                                {task.assignedToNames?.join(', ') || ''}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-200 dark:border-fbm-blue-border/60">
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
                                <span className="bg-slate-200 dark:bg-fbm-blue-border text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-fbm-blue-border px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>بانتظار البدء</span>
                                </span>
                              )}
                            </div>

                            {/* Archive/Unarchive actions */}
                            {(currentUser.role === 'admin' || currentUser.subRole === 'supervisor') &&
                              (taskSubTab === 'active' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveTaskClick(task.id, task.title);
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-slate-900 border border-amber-500/20 hover:border-amber-500 transition-all cursor-pointer flex items-center justify-center shrink-0"
                                  title="نقل هذه المهمة للأرشيف"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnarchiveTaskClick(task.id, task.title);
                                  }}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-slate-900 border border-emerald-500/20 hover:border-emerald-500 transition-all cursor-pointer flex items-center justify-center shrink-0"
                                  title="استعادة المهمة للمهام النشطة"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              ))}

                            {/* Quick Delete action */}
                            {(currentUser.role === 'admin' || currentUser.subRole === 'supervisor') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTaskClick(task.id, task.title);
                                }}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 hover:border-red-500 transition-all cursor-pointer flex items-center justify-center shrink-0"
                                title="حذف هذه المهمة نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Details / Lifecycle Log */}
                        {isExpanded && (
                          <div className="bg-white/60 dark:bg-fbm-blue-card border-t border-slate-200 dark:border-fbm-blue-border/60 p-4 space-y-4 text-xs leading-relaxed text-slate-500 dark:text-slate-300">
                            <div className="bg-white/60 dark:bg-fbm-blue/60 p-3.5 rounded-xl border border-slate-200 dark:border-fbm-blue-border">
                              <h5 className="font-extrabold text-slate-900 dark:text-white mb-1.5 text-xs">
                                تفصيل المهمة والتعليمات المرفقة:
                              </h5>
                              <p className="text-xs text-slate-500 dark:text-slate-300 whitespace-pre-wrap">
                                {task.description || 'لم يتم إدراج وصف مفصل.'}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                              <div className="bg-white/30 dark:bg-fbm-blue/30 p-2.5 rounded-xl border border-slate-200 dark:border-fbm-blue-border text-right">
                                <span className="block text-slate-500 text-[10px] font-bold">توقيت إسناد المهمة</span>
                                <span className="font-mono text-slate-500 dark:text-slate-300 mt-1 block">
                                  {new Date(task.createdAt).toLocaleString('en-GB')}
                                </span>
                              </div>

                              <div className="bg-white/30 dark:bg-fbm-blue/30 p-2.5 rounded-xl border border-slate-200 dark:border-fbm-blue-border text-right">
                                <span className="block text-slate-500 text-[10px] font-bold">
                                  بدء العمل الفعلي (تسجيل الموظف)
                                </span>
                                <span
                                  className={`font-mono mt-1 block ${task.startedAt ? 'text-amber-400' : 'text-slate-500'}`}
                                >
                                  {task.startedAt ? new Date(task.startedAt).toLocaleString('en-GB') : 'لم يبدأ بعد'}
                                </span>
                              </div>

                              <div className="bg-white/30 dark:bg-fbm-blue/30 p-2.5 rounded-xl border border-slate-200 dark:border-fbm-blue-border text-right">
                                <span className="block text-slate-500 text-[10px] font-bold">
                                  إتمام العمل الفعلي وتسجيل التسليم
                                </span>
                                <span
                                  className={`font-mono mt-1 block ${task.completedAt ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}
                                >
                                  {task.completedAt
                                    ? new Date(task.completedAt).toLocaleString('en-GB')
                                    : 'لم يتم الإنجاز بعد'}
                                </span>
                              </div>
                            </div>

                            {/* Signature and Location Proof for Completed Tasks */}
                            {task.status === 'done' && (task.signatureImage || task.locationGPS) && (
                              <div className="border-t border-slate-200 dark:border-fbm-blue-border/60 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Signature Pad Visual */}
                                {task.signatureImage && (
                                  <div className="bg-white/50 dark:bg-fbm-blue/50 p-4 rounded-2xl border border-slate-200 dark:border-fbm-blue-border flex flex-col items-center text-center space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs text-fbm-green font-bold justify-center w-full">
                                      <ShieldCheck className="w-4 h-4" />
                                      <span>بصمة التوقيع الرقمي للموظف</span>
                                    </div>
                                    <div className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-xl p-2 w-full max-w-[240px] flex items-center justify-center">
                                      <img
                                        src={task.signatureImage}
                                        alt="توقيع إتمام المهمة"
                                        className="max-h-24 object-contain invert brightness-200"
                                      />
                                    </div>
                                    <span className="text-[10px] text-slate-500">
                                      تم التوقيع يدوياً بواسطة {task.assignedToNames?.join(', ') || ''}
                                    </span>
                                  </div>
                                )}

                                {/* GPS Coordinates & Google Map */}
                                {task.locationGPS && (
                                  <div className="bg-white/50 dark:bg-fbm-blue/50 p-4 rounded-2xl border border-slate-200 dark:border-fbm-blue-border flex flex-col justify-between space-y-3">
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                                        <MapPin className="w-4 h-4" />
                                        <span>إثبات الحضور والموقع الجغرافي (GPS)</span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                        تم تسجيل موقع الموظف تلقائياً عبر الأقمار الصناعية أثناء توقيع المهمة لضمان
                                        التواجد الميداني الحقيقي.
                                      </p>
                                      <div
                                        className="bg-white dark:bg-fbm-blue p-2 rounded-xl text-[10px] font-mono text-emerald-300 border border-slate-200 dark:border-fbm-blue-border text-left"
                                        dir="ltr"
                                      >
                                        Latitude: {task.locationGPS.lat.toFixed(6)}
                                        <br />
                                        Longitude: {task.locationGPS.lng.toFixed(6)}
                                      </div>
                                    </div>

                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${task.locationGPS.lat},${task.locationGPS.lng}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 text-xs py-2.5 rounded-xl font-bold text-center flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    >
                                      <MapPin className="w-4 h-4 animate-pulse" />
                                      <span>عرض موقع الموظف على خريطة Google 🗺️</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Tab 3: Categories CRUD */}
        {activeTab === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-fbm-blue-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">إعداد وتسيير فئات وتصنيفات النظام</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">التحكم في فئات المصاريف والعمليات المتاحة للموظفين</p>
              </div>
              {!showQuickCategoryForm && (
                <button
                  onClick={() => setShowQuickCategoryForm(true)}
                  className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-[#76BC21]/15"
                >
                  <Plus className="w-4 h-4 font-bold" />
                  <span>إدراج تصنيف جديد للنظام ➕</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form - Conditional animation with AnimatePresence */}
              {showQuickCategoryForm && (
                <div className="fixed inset-0 bg-[#00021c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 shadow-xl space-y-4 relative"
                    dir="rtl"
                  >
                    <button
                      onClick={() => setShowQuickCategoryForm(false)}
                      className="absolute left-4 top-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-fbm-blue-border/50 pb-3">
                      <Plus className="w-5 h-5 text-fbm-green" />
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        <span>إدراج تصنيف جديد للنظام</span>
                      </h2>
                    </div>

                    <form onSubmit={handleAddCategory} className="space-y-4">
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">اسم التصنيف الجديد</label>
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="مثال: وقود الشاحنات الكبيرة"
                          className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none text-slate-900 dark:text-white font-sans"
                          required
                        />
                      </div>

                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">نوع التصنيف</label>
                        <select
                          value={newCatType}
                          onChange={(e) => setNewCatType(e.target.value as 'expense' | 'task')}
                          className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none text-slate-900 dark:text-white font-bold"
                        >
                          <option value="expense">فئة مصاريف وفواتير</option>
                          <option value="task">فئة عمليات ومهام ميدانية</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-fbm-green hover:bg-fbm-green-hover text-white font-bold tracking-wide py-2.5 rounded-xl text-xs cursor-pointer shadow transition-all"
                      >
                        حفظ الفئة في النظام
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Lists */}
              <div
                className="lg:col-span-3 space-y-6 transition-all duration-300"
              >
                {/* Expenses Categories */}
                <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 text-right">
                    فئات وتصنيفات المصاريف ({categories.filter((c) => c.type === 'expense').length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categories
                      .filter((c) => c.type === 'expense')
                      .map((cat) => (
                        <div
                          key={cat.id}
                          className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border p-3 rounded-xl flex items-center justify-between text-xs"
                        >
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-slate-500 hover:text-red-400 transition-all p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer"
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
                <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 text-right">
                    فئات وتصنيفات العمليات الميدانية ({categories.filter((c) => c.type === 'task').length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categories
                      .filter((c) => c.type === 'task')
                      .map((cat) => (
                        <div
                          key={cat.id}
                          className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border p-3 rounded-xl flex items-center justify-between text-xs"
                        >
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-slate-500 hover:text-red-400 transition-all p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer"
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
          </motion.div>
        )}

        {/* Tab: Settings for Section Visibility */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6 text-right"
            dir="rtl"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-fbm-blue-border/60 pb-5 gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end">
                  <span>التحكم المركزي في الأقسام والصلاحيات</span>
                  <ShieldCheck className="w-6 h-6 text-fbm-green" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  يمكنك تفعيل، إخفاء، أو تعيين حالة (قيد التطوير) لأي قسم تشغيلي لطاقم العمل ميدانياً ومشرفين.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-200 dark:border-fbm-blue-border/60 bg-slate-50 dark:bg-fbm-blue/20">
                <p className="text-sm font-bold text-slate-950 dark:text-white">جدول التحكم بالأقسام والخصائص الميدانية</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">التغييرات المطبقة هنا تؤثر فوراً على شاشات الهواتف ومفاتيح التنقل في الوقت الحقيقي.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-fbm-blue/40 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-fbm-blue-border">
                      <th className="p-4">القسم والخاصية</th>
                      <th className="p-4 text-center">الموظف الميداني (Worker)</th>
                      <th className="p-4 text-center">المشرف والمسؤول (Supervisor)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-fbm-blue-border">
                    {sectionsVisibility.map((sec) => (
                      <tr key={sec.id} className="hover:bg-slate-50/50 dark:hover:bg-fbm-blue/30 transition-colors">
                        <td className="p-4 font-black text-slate-900 dark:text-white text-sm">
                          {sec.name}
                        </td>
                        
                        {/* Worker State */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1 bg-slate-50 dark:bg-fbm-blue/50 p-1.5 rounded-xl border border-slate-200 dark:border-fbm-blue-border max-w-[240px] mx-auto font-sans">
                            {[
                              { label: 'نشط', val: 'active', color: 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30' },
                              { label: 'قريباً', val: 'soon', color: 'bg-amber-500/20 text-amber-500 border border-amber-500/30' },
                              { label: 'مخفي', val: 'hidden', color: 'bg-red-500/20 text-red-500 border border-red-500/30' }
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => handleUpdateSectionVisibility(sec.id, 'workerState', opt.val as any)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex-1 ${
                                  sec.workerState === opt.val
                                    ? `${opt.color} font-black scale-105 shadow-sm`
                                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Supervisor State */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1 bg-slate-50 dark:bg-fbm-blue/50 p-1.5 rounded-xl border border-slate-200 dark:border-fbm-blue-border max-w-[240px] mx-auto font-sans">
                            {[
                              { label: 'نشط', val: 'active', color: 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30' },
                              { label: 'قريباً', val: 'soon', color: 'bg-amber-500/20 text-amber-500 border border-amber-500/30' },
                              { label: 'مخفي', val: 'hidden', color: 'bg-red-500/20 text-red-500 border border-red-500/30' }
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => handleUpdateSectionVisibility(sec.id, 'supervisorState', opt.val as any)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex-1 ${
                                  sec.supervisorState === opt.val
                                    ? `${opt.color} font-black scale-105 shadow-sm`
                                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: Broadcaster */}
        {activeTab === 'broadcast' && (
          <motion.div
            key="broadcast"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-fbm-blue-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">إرسال وبث التنبيهات السحابية</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  توجيه إشعارات أو تعليمات مباشرة وفورية لهواتف طاقم العمل
                </p>
              </div>
              {!showQuickBroadcastForm && (
                <button
                  onClick={() => setShowQuickBroadcastForm(true)}
                  className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-[#76BC21]/15"
                >
                  <Plus className="w-4 h-4 font-bold" />
                  <span>إنشاء وبث تنبيه جديد ➕</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Broadcaster form */}
              {showQuickBroadcastForm && (
                <div className="fixed inset-0 bg-[#00021c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 shadow-xl space-y-4 relative"
                    dir="rtl"
                  >
                    <button
                      type="button"
                      onClick={() => setShowQuickBroadcastForm(false)}
                      className="absolute left-4 top-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-fbm-blue-border/50 pb-3">
                      <Megaphone className="w-5 h-5 text-fbm-green" />
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        <span>إنشاء وبث تنبيه فوري</span>
                      </h2>
                    </div>

                    <form onSubmit={handleSendBroadcast} className="space-y-4">
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">عنوان الإشعار</label>
                        <input
                          type="text"
                          value={broadcastTitle}
                          onChange={(e) => setBroadcastTitle(e.target.value)}
                          placeholder="مثال: إشعار ببدء جرد مخازن العاصمة"
                          className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none text-slate-900 dark:text-white"
                          required
                        />
                      </div>

                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                          محتوى التنبيه والقرارات المرفقة
                        </label>
                        <textarea
                          value={broadcastBody}
                          onChange={(e) => setBroadcastBody(e.target.value)}
                          placeholder="اكتب تفاصيل التنبيه الموجه للعمال..."
                          rows={4}
                          className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none resize-none text-slate-900 dark:text-white"
                          required
                        />
                      </div>

                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">المستهدف بالإشعار</label>
                        <select
                          value={broadcastTarget}
                          onChange={(e) => setBroadcastTarget(e.target.value as 'all' | 'specific')}
                          className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none text-slate-900 dark:text-white font-bold"
                        >
                          <option value="all">بث عام (جميع الموظفين)</option>
                          <option value="specific">توجيه موظف محدد فقط</option>
                        </select>
                      </div>

                      {broadcastTarget === 'specific' && (
                        <div className="space-y-1.5 text-right animate-fadeIn">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">اختر الموظف المستهدف</label>
                          <div className="max-h-32 overflow-y-auto bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-xl p-2 space-y-1">
                            {users
                              .filter((u) => u.isActive)
                              .map((w) => (
                                <label
                                  key={w.uid}
                                  className="flex items-center space-x-2 space-x-reverse text-slate-900 dark:text-white text-xs cursor-pointer hover:bg-slate-200/50 dark:bg-fbm-blue-border/50 p-1.5 rounded-lg"
                                >
                                  <input
                                    type="checkbox"
                                    value={w.uid}
                                    checked={broadcastTargetUids.includes(w.uid)}
                                    onChange={(e) => {
                                      if (e.target.checked) setBroadcastTargetUids([...broadcastTargetUids, w.uid]);
                                      else setBroadcastTargetUids(broadcastTargetUids.filter((id) => id !== w.uid));
                                    }}
                                    className="accent-[#76BC21] w-4 h-4 cursor-pointer"
                                  />
                                  <span>{w.fullName}</span>
                                </label>
                              ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-fbm-green hover:bg-fbm-green-hover text-white font-bold tracking-wide py-2.5 rounded-xl text-xs cursor-pointer shadow transition-all"
                      >
                        بث الإشعار الآن
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Sent notifications history */}
              <div
                className="lg:col-span-3 bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 shadow-sm transition-all duration-300"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 text-right flex items-center justify-between">
                  <span>سجل الإشعارات الموجهة للعمال</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">إجمالي المرسل: {notifications.length}</span>
                </h3>

                {notifications.length === 0 ? (
                  <p className="text-center py-12 text-xs text-slate-500">لا توجد إشعارات سابقة مرسلة</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border p-4 rounded-2xl text-right"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              notif.targetType === 'all'
                                ? 'bg-fbm-green hover:bg-fbm-green-hover text-white text-fbm-green'
                                : 'bg-blue-900/40 text-blue-300'
                            }`}
                          >
                            {notif.targetType === 'all' ? 'بث عام للجميع' : 'موجه لموظف محدد'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(notif.createdAt).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">{notif.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{notif.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Account & Staff Management Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview_staff"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 px-2"
            >
              {/* Main GPS/Biometric Card */}
              <div className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 relative overflow-hidden shadow-sm mt-4">
                
                
                <div className="relative z-10 text-right">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-full border border-fbm-green/30 bg-fbm-green/10 flex items-center justify-center text-fbm-green">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight max-w-[80%]">تتبع حضور وانصراف عمال الميدان بالـ GPS والبيومتري</h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed max-w-[90%] mx-auto text-right w-full">
                    كشف ذكي لحظي يسجل مواقع تفعيل الخدمة وصور التحقق لضمان الدقة التشغيلية
                  </p>
                  <button className="flex items-center justify-center gap-2 bg-white dark:bg-fbm-blue bg-fbm-blue-card dark:bg-white hover:bg-fbm-blue-border dark:hover:bg-zinc-100 text-white dark:text-slate-900 font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm w-full">
                    <span>طباعة تقرير الحضور والوردية</span>
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total Workers */}
                <div className="bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 flex flex-col justify-between text-right relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <Users className="w-5 h-5 text-slate-500" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300">إجمالي عمال الميدان</span>
                  </div>
                  <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono">{users.filter(u => u.role === 'worker' || u.subRole === 'worker').length}</span>
                </div>
                
                {/* In Service Now */}
                <div className="bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 flex flex-col justify-between text-right relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-2 h-2 rounded-full bg-fbm-green hover:bg-fbm-green-hover text-white shadow-sm" />
                    <span className="text-xs font-bold text-fbm-green">متواجدون بالخدمة الآن</span>
                  </div>
                  <span className="text-3xl font-bold text-fbm-green font-mono">
                    {attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && !a.clockOutTime).length}
                  </span>
                </div>

                {/* Finished Work */}
                <div className="bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 flex flex-col justify-between text-right relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                      <span className="text-xs font-bold text-blue-400">أنهوا العمل اليوم</span>
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-blue-400 font-mono">
                    {attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.clockOutTime).length}
                  </span>
                </div>

                {/* Did Not Login */}
                <div className="bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 flex flex-col justify-between text-right relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-xs font-bold text-amber-500">لم يسجلوا حضور اليوم بعد</span>
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-amber-500 font-mono">
                    {Math.max(0, users.filter(u => u.role === 'worker' || u.subRole === 'worker').length - attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.clockInTime).length)}
                  </span>
                </div>
              </div>

              {/* Title before list */}
              <div className="mt-6 mb-2 text-right">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-end gap-2">
                  <span className="bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">3</span>
                  الحركات البيومترية والميدانية الموثقة
                </h3>
              </div>
              
              {/* Dummy spacing for bottom navigation */}
              <div className="h-24"></div>
            </motion.div>
          )}

          {activeTab === 'users' && (

          <motion.div
            key="users"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-fbm-blue-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">إدارة طاقم العمل والموظفين</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">تسجيل حسابات الموظفين وتعديل صلاحياتهم وأقسامهم</p>
              </div>
              {!showQuickUserForm && (
                <button
                  onClick={() => setShowQuickUserForm(true)}
                  className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-[#76BC21]/15"
                >
                  <Plus className="w-4 h-4 font-bold" />
                  <span>تسجيل حساب موظف جديد ➕</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left/Single Col: Add New Employee Account */}
              {showQuickUserForm && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 shadow-sm h-fit space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-fbm-blue-border/50 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-fbm-green" />
                      <span>تسجيل حساب موظف جديد</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowQuickUserForm(false)}
                      className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-fbm-blue-card px-2 py-0.5 rounded border border-slate-200 dark:border-fbm-blue-border cursor-pointer"
                    >
                      <span>إلغاء ❌</span>
                    </button>
                  </div>

                  <form onSubmit={handleRegisterUser} className="space-y-4 text-right">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">الاسم الكامل للموظف</label>
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="مثال: عبد القادر الجزائري"
                        className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                        اسم المستخدم لتسجيل الدخول (لاتيني)
                      </label>
                      <div className="relative">
                        <span
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono select-none"
                          dir="ltr"
                        >
                          @fbm.local
                        </span>
                        <input
                          type="text"
                          value={newUserEmailPrefix}
                          onChange={(e) => setNewUserEmailPrefix(e.target.value)}
                          placeholder="مثال: kader"
                          dir="ltr"
                          className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl pl-32 pr-4 py-2.5 text-xs text-left focus:outline-none text-slate-900 dark:text-white font-mono"
                          required
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        اسم مبسط يكتبه الموظف لتسجيل الدخول بسرعة وسرية.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">نوع الحساب الرئيسي</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as 'worker' | 'admin')}
                        className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-3 py-2.5 text-xs text-right focus:outline-none text-slate-900 dark:text-white font-medium"
                        required
                      >
                        <option value="worker">موظف ميداني تشغيلي (وصول محدود للعمليات والمهام)</option>
                        <option value="admin">مدير نظام (وصول كامل للاعتمادات والمصاريف والتقارير)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                        الصلاحيات والوظيفة التفصيلية (عامل، مشرف، إلخ)
                      </label>
                      <select
                        value={newUserSubRole}
                        onChange={(e) => setNewUserSubRole(e.target.value)}
                        className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-3 py-2.5 text-xs text-right focus:outline-none text-slate-900 dark:text-white font-medium"
                        required
                      >
                        <option value="worker">👷 عامل ميداني تشغيلي</option>
                        <option value="supervisor">👮 مشرف عمليات ميدانية</option>
                        <option value="driver">🚚 سائق شاحنة ونقل وتوزيع</option>
                        <option value="accountant">💰 محاسب / مدقق مالي للمصاريف</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">
                        الأقسام التابع لها الموظف (متعدد)
                      </label>
                      <div className="flex flex-wrap gap-1.5 justify-start" dir="rtl">
                        {[
                          'إدارة المخازن والشحن',
                          'المعرض والمبيعات',
                          'التوزيع والتوصيل الميداني',
                          'الإدارة والمالية',
                          'الصيانة والدعم الفني',
                        ].map((dept) => {
                          const isSelected = newUserDepartments.includes(dept);
                          return (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setNewUserDepartments(newUserDepartments.filter((d) => d !== dept));
                                } else {
                                  setNewUserDepartments([...newUserDepartments, dept]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all border ${
                                isSelected
                                  ? 'bg-fbm-green/20 text-fbm-green border-fbm-green'
                                  : 'bg-white dark:bg-fbm-blue text-slate-500 dark:text-slate-400 border-slate-200 dark:border-fbm-blue-border hover:border-slate-300 dark:hover:border-white/10'
                              }`}
                            >
                              {dept}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">كلمة المرور الافتراضية</label>
                      <input
                        type="text"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="123456"
                        dir="ltr"
                        className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-left focus:outline-none text-slate-900 dark:text-white font-mono"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-fbm-green hover:bg-fbm-green-hover text-white font-bold tracking-wide py-2.5 rounded-xl text-xs cursor-pointer shadow transition-all mt-2"
                    >
                      إنشاء الحساب وتفعيله فوراً
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Right/Double Col: Registered Staff Directory */}
              <div
                className={`${showQuickUserForm ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 shadow-sm transition-all duration-300`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white text-right">
                    <span>سجل طاقم العمل وموظفي المؤسسة</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400 block mt-0.5">
                      إجمالي المسجلين: {users.length} موظف
                    </span>
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
                      className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl pr-9 pl-3 py-1.5 text-xs text-right text-slate-900 dark:text-white focus:outline-none w-full sm:w-48 placeholder-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {users
                    .filter(
                      (u) =>
                        (u.fullName || '').toLowerCase().includes((userSearchText || '').toLowerCase()) ||
                        (u.email || '').toLowerCase().includes((userSearchText || '').toLowerCase()),
                    )
                    .map((user) => {
                      const isSelf = user.uid === currentUser.uid;
                      const defaultUserPass = user.password || (user.role === 'admin' ? 'admin123' : '123456');

                      return (
                        <div
                          key={user.uid}
                          className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 transition-all text-right ${
                            user.isActive
                              ? 'bg-white dark:bg-fbm-blue border-slate-200 dark:border-fbm-blue-border'
                              : 'bg-red-950/5 border-red-950/25 opacity-70'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Circular Avatar Graphic with First Letter */}
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                                user.role === 'admin'
                                  ? 'bg-fbm-green hover:bg-fbm-green-hover text-white text-fbm-green'
                                  : 'bg-blue-900/40 text-blue-300'
                              }`}
                            >
                              {user.fullName.trim().charAt(0)}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{user.fullName}</h4>
                                {isSelf && (
                                  <span className="bg-fbm-green/10 text-fbm-green text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                    أنت
                                  </span>
                                )}
                                <span
                                  className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                                    user.role === 'admin'
                                      ? 'bg-fbm-green hover:bg-fbm-green-hover text-white text-fbm-green'
                                      : 'bg-slate-200 dark:bg-fbm-blue-border text-slate-500 dark:text-slate-300'
                                  }`}
                                >
                                  {user.role === 'admin' ? 'إدارة عليا' : 'موظف ميداني'}
                                </span>

                                {/* Custom Sub-role / Permissions Badge */}
                                {user.subRole && (
                                  <span className="bg-blue-500/10 text-blue-400 text-[8px] font-bold px-2 py-0.5 rounded-full border border-blue-500/10">
                                    {user.subRole === 'worker'
                                      ? '👷 عامل تشغيل'
                                      : user.subRole === 'supervisor'
                                        ? '👮 مشرف عمليات'
                                        : user.subRole === 'driver'
                                          ? '🚚 سائق توزيع'
                                          : user.subRole === 'accountant'
                                            ? '💰 محاسب مالي'
                                            : user.subRole}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                                <span dir="ltr">📧 {user.email}</span>
                                <span>•</span>
                                <span dir="ltr" className="text-slate-500 dark:text-slate-400">
                                  🔑 {defaultUserPass}
                                </span>
                              </div>

                              {/* Assigned Departments list */}
                              {user.departments && user.departments.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1.5 justify-start">
                                  {user.departments.map((dept, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-white dark:bg-fbm-blue-card  text-slate-500 dark:text-slate-300 text-[8px] font-medium px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-fbm-blue-border flex items-center gap-1 select-none"
                                    >
                                      <span className="text-fbm-green text-[9px]">🏢</span> {dept}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Interactive Row Controls */}
                          <div className="flex items-center gap-2.5 self-end sm:self-auto">
                            {/* Status Badge */}
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                user.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                              }`}
                            >
                              {user.isActive ? 'نشط في الفروع' : 'موقف ومحجوب'}
                            </span>

                            {/* Permissions Config Button (Only for Admin to modify others) */}
                            {currentUser.role === 'admin' && !isSelf && (
                              <button
                                onClick={() => setEditingPermissionsUser(user)}
                                className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all border bg-slate-100 dark:bg-fbm-blue-card hover:bg-blue-950/40 text-blue-400 border-slate-200 dark:border-fbm-blue-border hover:border-blue-900/60 flex items-center gap-1 shrink-0"
                              >
                                ⚙️ الصلاحيات
                              </button>
                            )}

                            {/* Toggle status */}
                            <button
                              onClick={() => handleToggleUserActive(user.uid)}
                              disabled={isSelf}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all border ${
                                isSelf
                                  ? 'bg-slate-100/40 dark:bg-fbm-blue-card text-slate-500 border-slate-200 dark:border-fbm-blue-border cursor-not-allowed'
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
                                  ? 'bg-slate-100/40 dark:bg-fbm-blue-card text-slate-500 border-slate-200 dark:border-fbm-blue-border cursor-not-allowed'
                                  : 'bg-slate-100 dark:bg-fbm-blue-card hover:bg-red-950 hover:text-red-400 border-slate-200 dark:border-fbm-blue-border hover:border-red-900/60 text-slate-500 dark:text-slate-400'
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
          </motion.div>
        )}

        {/* Tab: Stock Transfers & Sales PC Sync */}
        {activeTab === 'transfers' && (
          <motion.div
            key="transfers"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-fbm-blue-card/40 border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 relative overflow-hidden shadow-sm text-right">
              <div className="absolute top-0 left-0 w-64 h-64 bg-fbm-green hover:bg-fbm-green-hover text-white rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1 text-right">
                  <span className="inline-flex items-center gap-1.5 bg-fbm-green hover:bg-fbm-green-hover text-white text-fbm-green px-3 py-1 rounded-full text-[10px] font-bold">
                    ✨ حماية ومطابقة مخزون مجموعة FBM
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">مركز تتبع حركة السلع ومطابقة برنامج البيع (PC)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-300 max-w-2xl leading-relaxed mt-1">
                    هنا يتم تسجيل أي نقل لقطع الغيار بين المستودعات والمحلات. يمنع هذا النظام أخطاء المخزون الشائعة
                    بضمان تدوين وتأكيد كل عملية، ومطابقتها لاحقاً مع حاسوب المبيعات المركزي.
                  </p>
                </div>

                <button
                  onClick={() => setShowTransferModal(true)}
                  className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-2.5 px-5 rounded-2xl text-xs cursor-pointer shadow-lg transition-all flex items-center gap-2 self-stretch md:self-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>طلب إحضار / نقل سلعة 📦</span>
                </button>
              </div>
            </div>

            {/* Quick Filter and Search */}
            <div
              className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-right"
              dir="rtl"
            >
              <div className="relative w-full md:w-80">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  placeholder="ابحث باسم قطعة الغيار أو الموظف..."
                  className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl pr-9 pl-4 py-2 text-xs text-right text-slate-900 dark:text-white focus:outline-none placeholder-slate-600"
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي حركات السلع: {transfers.length} عملية نقل</div>
            </div>

            {/* Transfers List Grid split into Pending matching and Matched */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-right" dir="rtl">
              {/* Column 1: Awaiting PC Sync */}
              <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-fbm-blue-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping shrink-0"></span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">سلع في الطريق أو لم تسجل في برنامج الحاسوب</h3>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full">
                    معلق المطابقة: {transfers.filter((t) => t.status === 'pending').length}
                  </span>
                </div>

                {transfers.filter((t) => t.status === 'pending').length === 0 ? (
                  <div className="text-center py-16 text-slate-500 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-fbm-green mx-auto opacity-40" />
                    <p className="text-xs">كل السلع المنقولة مطابقة ومسجلة في برنامج الكومبيوتر بنجاح!</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {transfers
                      .filter((t) => t.status === 'pending')
                      .filter(
                        (t) =>
                          (t.partName || t.itemName || '')
                            .toLowerCase()
                            .includes((transferSearch || '').toLowerCase()) ||
                          (t.carriedOutBy || '').toLowerCase().includes((transferSearch || '').toLowerCase()),
                      )
                      .map((t) => (
                        <div
                          key={t.id}
                          className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border hover:border-amber-500/30 p-4 rounded-2xl transition-all"
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div>
                              <span className="bg-amber-500/15 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                {t.carriedOutBy ? '🚚 أحضرها الموظف ميدانياً' : '⏳ بانتظار استلام الموظف'}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{t.partName}</h4>
                            </div>
                            <span className="text-xs font-bold font-mono text-fbm-green bg-fbm-green/10 px-3 py-1 rounded-xl">
                              {t.quantity} وحدة (U)
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 py-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-900 mt-2">
                            <div>
                              <span className="block text-[9px] text-slate-500">مسار النقل:</span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                من {t.fromLocation} ← إلى {t.toLocation}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-500">بواسطة الموظف الميداني:</span>
                              <span className="font-bold text-slate-900 dark:text-white">{t.carriedOutBy || 'قيد الانتظار...'}</span>
                            </div>
                          </div>

                          {t.carriedOutAt && (
                            <div className="text-[10px] text-slate-500 mt-1 font-mono">
                              تاريخ الإحضار الميداني المعتمد: {new Date(t.carriedOutAt).toLocaleString('en-GB')}
                            </div>
                          )}

                          {/* Matching to PC Sales Software Action */}
                          <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border p-3 rounded-xl mt-3 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <p className="text-[10px] text-slate-500 dark:text-slate-300 leading-relaxed text-right">
                              ⚠️ هل قمت بإدخال هذه الكمية ({t.quantity} وحدة) في{' '}
                              <strong>برنامج البيع على الكومبيوتر</strong> لتصحيح مخزون الفروع؟
                            </p>
                            <button
                              onClick={() => {
                                const pcName = prompt(
                                  'يرجى كتابة اسم الموظف الذي قام بإدخالها وتدقيقها في الحاسوب المركزي:',
                                );
                                if (pcName && pcName.trim()) {
                                  onUpdateTransfer({
                                    ...t,
                                    status: 'entered',
                                    enteredByPc: pcName.trim(),
                                    enteredAtPc: new Date().toISOString(),
                                  });
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition-all whitespace-nowrap border border-emerald-500/20"
                            >
                              ✓ تم الإدخال في برنامج المبيعات
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Column 2: History of Matched / Entered Stock */}
              <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-fbm-blue-border pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-fbm-green" />
                    <span>عمليات تم مطابقتها وتثبيتها في الحاسوب</span>
                  </h3>
                  <span className="text-[10px] bg-fbm-green hover:bg-fbm-green-hover text-white text-fbm-green font-bold px-2 py-0.5 rounded-full">
                    تطابق معتمد: {transfers.filter((t) => t.status === 'entered').length}
                  </span>
                </div>

                {transfers.filter((t) => t.status === 'entered').length === 0 ? (
                  <p className="text-center py-24 text-xs text-slate-500">لم يتم ترحيل أي سلع لبرنامج المبيعات بعد.</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {transfers
                      .filter((t) => t.status === 'entered')
                      .filter((t) =>
                        (t.partName || t.itemName || '').toLowerCase().includes((transferSearch || '').toLowerCase()),
                      )
                      .map((t) => (
                        <div
                          key={t.id}
                          className="bg-white/60 dark:bg-fbm-blue/60 border border-slate-900 p-3.5 rounded-xl space-y-1.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-400 bg-emerald-500/10 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              ✓ مطابقة ومسجلة في الكومبيوتر
                            </span>
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-300 font-bold">{t.quantity} وحدة</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.partName}</h4>

                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1.5 border-t border-slate-900/60">
                            <div>
                              <span>الناقل ميدانياً: </span>
                              <strong className="text-slate-500 dark:text-slate-300">{t.carriedOutBy || 'غير محدد'}</strong>
                            </div>
                            <div>
                              <span>المدخل في الكومبيوتر: </span>
                              <strong className="text-emerald-400">{t.enteredByPc || 'غير محدد'}</strong>
                            </div>
                          </div>

                          {t.enteredAtPc && (
                            <p className="text-[9px] text-slate-500 font-mono text-left">
                              سجلت بتاريخ: {new Date(t.enteredAtPc).toLocaleString('en-GB')}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Client Orders */}
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-fbm-blue-card/40 border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 relative overflow-hidden shadow-sm text-right">
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1 text-right">
                  <span className="inline-flex items-center gap-1.5 bg-fbm-green hover:bg-fbm-green-hover text-white text-fbm-green px-3 py-1 rounded-full text-[10px] font-bold">
                    📋 تسيير طلبيات زبائن الجملة والتجزئة
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">مركز تحضير وتتبع طلبيات الزبائن (المحلات والفروع)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-300 max-w-2xl leading-relaxed mt-1">
                    تابع تقدم تحضير الطلبيات، وقم بتعيينها لسائقي شاحنات التوزيع (الكاميو) لنقلها وتسليمها وتخفيض
                    الأخطاء التشغيلية.
                  </p>
                </div>

                <button
                  onClick={() => setShowOrderModal(true)}
                  className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-2.5 px-5 rounded-2xl text-xs cursor-pointer shadow-lg transition-all flex items-center gap-2 self-stretch md:self-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل طلبية جديدة لزبون 📋</span>
                </button>
              </div>
            </div>

            {/* Orders Search */}
            <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 text-right" dir="rtl">
              <div className="relative w-full md:w-80">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="ابحث باسم الزبون..."
                  className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl pr-9 pl-4 py-2 text-xs text-right text-slate-900 dark:text-white focus:outline-none placeholder-slate-600"
                />
              </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-right" dir="rtl">
              {clientOrders
                .filter((o) => (o.clientName || '').toLowerCase().includes((orderSearch || '').toLowerCase()))
                .map((order) => {
                  const matchingRoute = camionRoutes.find((r) => r.id === order.assignedRouteId);

                  return (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border hover:border-fbm-green/30 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
                    >
                      <div className="space-y-3 text-right">
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              order.status === 'delivered'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : order.status === 'prepared'
                                  ? 'bg-blue-500/15 text-blue-300'
                                  : 'bg-amber-500/15 text-amber-400'
                            }`}
                          >
                            {order.status === 'delivered'
                              ? '✓ تم التسليم والتحصيل'
                              : order.status === 'prepared'
                                ? '📦 جاهزة للشحن (محضرة)'
                                : '⏳ قيد التحضير في المحل'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(order.createdAt).toLocaleDateString('en-GB')}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs text-slate-500 dark:text-slate-400">الزبون المستلم:</h4>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{order.clientName}</h3>
                        </div>

                        <div className="bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-900 text-right">
                          <span className="text-[9px] text-slate-500 block mb-1">قطع الغيار المطلوبة:</span>
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

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                          <span>تاريخ التوصيل المطلوب:</span>
                          <strong className="text-slate-900 dark:text-white font-mono">{order.deliveryDate}</strong>
                        </div>

                        {matchingRoute ? (
                          <div className="bg-fbm-green hover:bg-fbm-green-hover text-white border border-fbm-green/20 p-2.5 rounded-xl text-[11px] text-right">
                            <span className="block text-fbm-green font-bold">🚚 مشحونة مع شاحنة التوزيع:</span>
                            <span className="text-slate-500 dark:text-slate-300">
                              {matchingRoute.camionName} (بقيادة: {matchingRoute.driverName})
                            </span>
                          </div>
                        ) : (
                          <div className="bg-slate-100 dark:bg-fbm-blue-card p-2.5 rounded-xl text-[10px] text-slate-500 text-center">
                            لم تُنسب لأي شاحنة توزيع حتى الآن
                          </div>
                        )}
                      </div>

                      {/* Action buttons to update status */}
                      <div className="flex gap-2 pt-2 border-t border-slate-900">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => onUpdateClientOrder({ ...order, status: 'prepared' })}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 rounded-lg text-[10px] transition-all cursor-pointer border border-blue-600/30"
                          >
                            ✓ تم التحضير بالكامل
                          </button>
                        )}
                        {order.status === 'prepared' && (
                          <button
                            onClick={() => onUpdateClientOrder({ ...order, status: 'delivered' })}
                            className="flex-1 bg-fbm-green hover:bg-fbm-green-hover text-white font-extrabold py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                          >
                            ✓ تم تسليم الطلبية للزبون
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (confirm('هل أنت متأكد من حذف هذه الطلبية نهائياً؟')) {
                              await onDeleteClientOrder(order.id);
                            }
                          }}
                          className="bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-900/30 p-1.5 rounded-lg cursor-pointer transition-all"
                          title="حذف الطلبية"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* Tab: Client Debts */}
        {activeTab === 'debts' && (
          <motion.div
            key="debts"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-fbm-blue-card/40 border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 relative overflow-hidden shadow-sm text-right">
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1 text-right">
                  <span className="inline-flex items-center gap-1.5 bg-red-500/15 text-red-400 px-3 py-1 rounded-full text-[10px] font-bold">
                    💳 رقابة السيولة المالية والديون المترتبة
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">سجل ديون وذمم زبائن الجملة والتجزئة (Crédit)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-300 max-w-2xl leading-relaxed mt-1">
                    تابع تحصيل الديون المتبقية لدى زبائن قطع غيار السيارات الصينية والهندية، مع التنبيه بآجال الاستحقاق
                    لضمان التدفق النقدي للشركة.
                  </p>
                </div>

                <button
                  onClick={() => setShowDebtModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-5 rounded-2xl text-xs cursor-pointer shadow-lg transition-all flex items-center gap-2 self-stretch md:self-auto justify-center border border-red-500/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>تقييد دين مالي جديد لزبون 💳</span>
                </button>
              </div>
            </div>

            {/* Debt Search and KPI Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 text-right" dir="rtl">
              <div className="lg:col-span-2 bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 flex items-center">
                <div className="relative w-full">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={debtSearch}
                    onChange={(e) => setDebtSearch(e.target.value)}
                    placeholder="ابحث باسم الزبون المدين..."
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl pr-9 pl-4 py-2 text-xs text-right text-slate-900 dark:text-white focus:outline-none placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Debt KPIs */}
              <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 text-right">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">إجمالي الديون المعلقة</span>
                <span className="text-base font-bold text-red-400 font-mono">
                  {clientDebts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0).toLocaleString('en-GB')} د.ج
                </span>
              </div>

              <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 text-right">
                <span className="text-[10px] text-fbm-green font-bold block">إجمالي ما تم تحصيله</span>
                <span className="text-base font-bold text-fbm-green font-mono">
                  {clientDebts.reduce((sum, d) => sum + d.paidAmount, 0).toLocaleString('en-GB')} د.ج
                </span>
              </div>
            </div>

            {/* Debts Table/List */}
            <div
              className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl overflow-hidden shadow-sm text-right"
              dir="rtl"
            >
              <div className="p-5 border-b border-slate-200 dark:border-fbm-blue-border flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">قائمة ذمم الزبائن والمتابعة المالية</h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">آخر تحديث لحظي</span>
              </div>

              {clientDebts.length === 0 ? (
                <p className="text-center py-16 text-xs text-slate-500">لا توجد أي ديون مسجلة في هذا الحساب حالياً.</p>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {clientDebts
                    .filter((d) => (d.clientName || '').toLowerCase().includes((debtSearch || '').toLowerCase()))
                    .map((debt) => {
                      const remaining = debt.totalAmount - debt.paidAmount;
                      const isOverdue = new Date(debt.dueDate) < new Date() && remaining > 0;

                      return (
                        <div
                          key={debt.id}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/20 dark:bg-fbm-blue/20 transition-all"
                        >
                          <div className="space-y-1.5 text-right">
                            <div className="flex items-center gap-2 flex-wrap justify-start">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{debt.clientName}</h4>
                              <span
                                className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full ${
                                  remaining === 0
                                    ? 'bg-fbm-green hover:bg-fbm-green-hover text-white text-fbm-green'
                                    : isOverdue
                                      ? 'bg-red-500/10 text-red-500 animate-pulse'
                                      : 'bg-amber-500/10 text-amber-400'
                                }`}
                              >
                                {remaining === 0
                                  ? '✓ مسدد بالكامل'
                                  : isOverdue
                                    ? '⚠️ متأخر عن السداد'
                                    : '⏳ قيد التحصيل'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              <span>
                                تاريخ الاستحقاق:{' '}
                                <strong className={isOverdue ? 'text-red-400' : 'text-slate-900 dark:text-white'}>{debt.dueDate}</strong>
                              </span>
                              <span>•</span>
                              <span>أنشئ بتاريخ: {new Date(debt.createdAt).toLocaleDateString('en-GB')}</span>
                            </div>
                          </div>

                          {/* Amounts visual and manager controls */}
                          <div className="flex items-center gap-4 self-end sm:self-auto flex-wrap sm:flex-nowrap">
                            <div className="text-left space-y-0.5 font-mono">
                              <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
                                متبقي:{' '}
                                <span className="font-extrabold text-red-400">
                                  {remaining.toLocaleString('en-GB')} د.ج
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 text-right">
                                مدفوع: {debt.paidAmount.toLocaleString('en-GB')} / كلي:{' '}
                                {debt.totalAmount.toLocaleString('en-GB')}
                              </div>
                            </div>

                            {/* Collect action */}
                            {remaining > 0 && (
                              <button
                                onClick={() => {
                                  const payStr = prompt(
                                    `تحديث السداد للزبون "${debt.clientName}":\nالمتبقي حالياً: ${remaining} د.ج\nيرجى كتابة المبلغ الإضافي المحصل الآن (بالدينار الجزائري):`,
                                  );
                                  if (payStr) {
                                    const amount = Number(payStr);
                                    if (isNaN(amount) || amount <= 0) {
                                      alert('يرجى إدخال مبلغ رقمي صحيح أكبر من الصفر');
                                      return;
                                    }
                                    const newPaid = Math.min(debt.totalAmount, debt.paidAmount + amount);
                                    onUpdateClientDebt({
                                      ...debt,
                                      paidAmount: newPaid,
                                      status: newPaid >= debt.totalAmount ? 'paid' : 'partial',
                                    });
                                    alert('✅ تم تسجيل وتحديث الدفعة المالية بنجاح!');
                                  }
                                }}
                                className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-1.5 px-3 rounded-xl text-[10px] transition-all cursor-pointer whitespace-nowrap"
                              >
                                💸 تحصيل دفعة مادية
                              </button>
                            )}

                            <button
                              onClick={async () => {
                                if (confirm(`هل ترغب في مسح سجل ذمة "${debt.clientName}" نهائياً من قاعدة البيانات؟`)) {
                                  await onDeleteClientDebt(debt.id);
                                }
                              }}
                              className="p-2 bg-red-950/20 hover:bg-red-950/60 border border-red-900/40 rounded-xl text-red-400 transition-all cursor-pointer"
                              title="مسح السجل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab: Camion & Suppliers */}
        {activeTab === 'camion' && (
          <motion.div
            key="camion"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-fbm-blue-card/40 border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 relative overflow-hidden shadow-sm text-right">
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1 text-right">
                  <span className="inline-flex items-center gap-1.5 bg-fbm-green hover:bg-fbm-green-hover text-white text-fbm-green px-3 py-1 rounded-full text-[10px] font-bold">
                    🚚 أسطول شاحنات التوزيع وإدارة الاستيراد
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    تسيير شاحنات التوزيع والاتصال بزبائن المسار والموردين
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-300 max-w-2xl leading-relaxed mt-1">
                    تابع تحركات سائق الكاميو لتوزيع السلع مباشرة على المحلات، وراقب تنبيهات نواقص الموردين الواردة من
                    العمال ميدانياً لمعالجة مشاكل الاستيراد لقطع الغيار الصينية والهندية.
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap self-stretch md:self-auto justify-center">
                  <button
                    onClick={() => setShowRouteModal(true)}
                    className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-2.5 px-4 rounded-2xl text-[11px] cursor-pointer shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>تخطيط مسار شاحنة جديدة 🚚</span>
                  </button>
                  <button
                    onClick={() => setShowSupplierAlertModal(true)}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-2xl text-[11px] cursor-pointer shadow transition-all flex items-center justify-center gap-1.5 border border-red-500/30"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>تنبيه نقص استيراد / موردين ⚠️</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Split page: Routes tracker (Left) & Suppliers issues (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-right" dir="rtl">
              {/* Routes Tracking Column */}
              <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-fbm-blue-border pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">تتبع الشاحنة وخطوط سير التوزيع (الكاميو)</h3>
                  <span className="text-[10px] text-slate-500">
                    نشط: {camionRoutes.filter((r) => r.status !== 'completed').length} مسارات
                  </span>
                </div>

                {camionRoutes.length === 0 ? (
                  <p className="text-center py-24 text-xs text-slate-500">
                    لا توجد مسارات توزيع مجدولة حالياً للشاحنات.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {camionRoutes.map((route) => (
                      <div key={route.id} className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="text-right">
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
                                ? '✓ تم التوزيع والانتهاء'
                                : route.status === 'in_progress'
                                  ? '🚚 الشاحنة في الطريق حالياً'
                                  : '⏳ مسار مخطط ومجدول'}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{route.camionName}</h4>
                          </div>
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-fbm-blue-card px-2.5 py-1 rounded-lg">
                            {route.date}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-300">
                          👤 : <strong className="text-slate-900 dark:text-white">{route.driverName}</strong>
                        </div>

                        {/* List of clients to call in this route */}
                        <div className="bg-white dark:bg-fbm-blue-card  p-3 rounded-xl border border-slate-850 space-y-2">
                          <span className="text-[10px] text-fbm-green font-bold block">
                            📞 قائمة الزبائن والمحلات المطلوب المرور عليها بالتسلسل:
                          </span>
                          {route.clientsToCall && route.clientsToCall.length > 0 ? (
                            <div className="space-y-1.5">
                              {route.clientsToCall.map((cl, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-slate-500 dark:text-slate-300 flex items-center justify-between bg-white dark:bg-fbm-blue-card px-2.5 py-1 rounded-md"
                                >
                                  <span>
                                    {idx + 1}. {cl}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-bold">بانتظار التوزيع والتحصيل</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">لا توجد محلات زبائن محددة لهذا خط.</span>
                          )}
                        </div>

                        {/* Route operations */}
                        <div className="flex gap-2 pt-2 border-t border-slate-900/60">
                          {route.status === 'planned' && (
                            <button
                              onClick={() => onUpdateCamionRoute({ ...route, status: 'in_progress' })}
                              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 rounded-lg text-[10px] transition-all cursor-pointer border border-blue-600/30"
                            >
                              🚀 إطلاق الشاحنة للزبائن الآن
                            </button>
                          )}
                          {route.status === 'in_progress' && (
                            <button
                              onClick={() => onUpdateCamionRoute({ ...route, status: 'completed' })}
                              className="flex-1 bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                            >
                              ✓ تأكيد اكتمال التوزيع والعودة
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (confirm('هل ترغب في حذف مسار شاحنة التوزيع هذا نهائياً؟')) {
                                await onDeleteCamionRoute(route.id);
                              }
                            }}
                            className="bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-900/30 p-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Supplier Missing Stock Alerts */}
              <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-fbm-blue-border pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">تنبيهات عجز استيراد قطع الغيار والموردين</h3>
                  <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded-full">
                    نشط: {supplierAlerts.length} عجز
                  </span>
                </div>

                {supplierAlerts.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-fbm-green mx-auto opacity-40" />
                    <p className="text-xs">لا توجد أي بلاغات عجز أو قطع غيار تالفة مرسلة من الموردين حالياً.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {supplierAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`border p-4 rounded-2xl transition-all space-y-2 ${
                          alert.severity === 'critical'
                            ? 'bg-red-950/10 border-red-900/40 hover:border-red-500'
                            : 'bg-white dark:bg-fbm-blue border-slate-200 dark:border-fbm-blue-border hover:border-slate-300 dark:hover:border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="text-right">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                alert.severity === 'critical'
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : alert.severity === 'warning'
                                    ? 'bg-amber-500 text-slate-900 font-bold'
                                    : 'bg-blue-600 text-white'
                              }`}
                            >
                              {alert.severity === 'critical'
                                ? '🚨 حرج جداً (توقف مبيعات)'
                                : alert.severity === 'warning'
                                  ? '⚠️ نقص حاد'
                                  : 'ℹ️ تنبيه استيراد'}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2">قطعة الغيار: {alert.partName}</h4>
                          </div>

                          <button
                            onClick={async () => {
                              if (confirm('هل ترغب في تسوية وحذف بلاغ العجز هذا نهائياً بعد حله مع المورد؟')) {
                                await onDeleteSupplierAlert(alert.id);
                              }
                            }}
                            className="text-slate-500 hover:text-red-400 p-1 rounded transition-all cursor-pointer"
                            title="حل وتسوية البلاغ"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-300">
                          المورد المعني: <strong className="text-slate-900 dark:text-white">{alert.supplierName}</strong>
                        </div>

                        {alert.qtyNeeded !== undefined && alert.qtyNeeded > 0 && (
                          <div className="text-xs text-red-400 font-mono">
                            العجز الميداني المقدر:{' '}
                            <strong className="font-mono text-slate-900 dark:text-white">{alert.qtyNeeded} وحدة مطلوبة عاجلاً</strong>
                          </div>
                        )}

                        {alert.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-300 bg-white dark:bg-fbm-blue-card  p-2.5 rounded-xl border border-slate-850 leading-relaxed text-right">
                            💡 ملاحظات الميدان: {alert.notes}
                          </p>
                        )}

                        <div className="text-[9px] text-slate-500 font-mono text-left">
                          سجل بتاريخ: {new Date(alert.createdAt).toLocaleString('en-GB')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Attendance Monitoring System */}
        {activeTab === 'attendance' && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6"
          >
            {/* Header & Print controls */}
            <div
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border p-4 rounded-2xl"
              dir="rtl"
            >
              <div className="text-right">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-fbm-green" />
                  <span>تتبع حضور وانصراف عمال الميدان بالـ GPS والبيومتري</span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  كشف ذكي لحظي يسجل مواقع تفعيل الخدمة وصور التحقق لضمان الدقة التشغيلية
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="bg-fbm-green hover:bg-fbm-green-hover text-white hover:bg-fbm-green hover:bg-fbm-green-hover text-white border border-fbm-green/45 text-fbm-green font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer mr-auto"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة تقرير الحضور والوردية 📑</span>
              </button>
            </div>

            {/* Quick KPI stats */}
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const totalWorkersCount = users.filter((u) => u.role === 'worker').length;
              const activeNowCount = attendance.filter((r) => r.date === todayStr && !r.clockOutTime).length;
              const completedCount = attendance.filter((r) => r.date === todayStr && r.clockOutTime).length;
              const absentCount = Math.max(0, totalWorkersCount - activeNowCount - completedCount);

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" dir="rtl">
                  <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 text-right space-y-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">إجمالي عمال الميدان</span>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{totalWorkersCount}</span>
                      <Users className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-fbm-blue-card  border border-fbm-green/20 rounded-2xl p-4 text-right space-y-1">
                    <span className="text-[10px] text-fbm-green font-bold block">متواجدون بالخدمة الآن 🟢</span>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-fbm-green">{activeNowCount}</span>
                      <span className="w-2.5 h-2.5 bg-fbm-green hover:bg-fbm-green-hover text-white rounded-full animate-ping"></span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-fbm-blue-card  border border-sky-500/25 rounded-2xl p-4 text-right space-y-1">
                    <span className="text-[10px] text-sky-400 font-bold block">أنهوا العمل اليوم 🔴</span>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-sky-400">{completedCount}</span>
                      <Clock className="w-4 h-4 text-sky-500" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 text-right space-y-1">
                    <span className="text-[10px] text-amber-500 font-bold block">لم يسجلوا حضور اليوم بعد ⚠️</span>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-amber-500">{absentCount}</span>
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Attendance Logs List Table */}
            <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5" dir="rtl">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white border-r-4 border-fbm-green pr-2.5 mb-4 text-right">
                سجل الحركات البيومترية والميدانية الموثقة
              </h3>

              {attendance.length === 0 ? (
                <div className="text-center py-12 space-y-2 opacity-60">
                  <UserCheck className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    لا توجد حركات حضور مسجلة في قاعدة البيانات حتى الآن
                  </p>
                  <p className="text-[10px] text-slate-500">
                    سيظهر طاقم الميدان وصور الفحص البيومترية هنا فور قيامهم بتسجيل الدخول من هواتفهم
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-fbm-blue-border text-slate-500 dark:text-slate-400 font-bold">
                        <th className="pb-3 pr-2">الموظف الميداني</th>
                        <th className="pb-3">صورة الفحص البيومتري</th>
                        <th className="pb-3">تاريخ اليوم</th>
                        <th className="pb-3">تسجيل الحضور والـ GPS</th>
                        <th className="pb-3">تسجيل الانصراف والـ GPS</th>
                        <th className="pb-3 pl-2">الحالة التشغيلية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {attendance.map((rec) => {
                        const isWorkingNow = !rec.clockOutTime;
                        return (
                          <tr key={rec.id} className="hover:bg-white/40 dark:bg-fbm-blue/40 transition-all">
                            <td className="py-4 pr-2 font-bold text-slate-900 dark:text-white">
                              {rec.workerName}
                              <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                                UID: {rec.workerUid.substring(0, 8)}
                              </span>
                            </td>
                            <td className="py-4">
                              {rec.selfieImage ? (
                                <div className="relative group cursor-zoom-in">
                                  <img
                                    src={rec.selfieImage}
                                    alt="Face Scan Verification"
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-fbm-blue-border transition-all group-hover:scale-110"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="absolute bottom-0 right-0 bg-fbm-green hover:bg-fbm-green-hover text-white text-[7px] font-bold px-1 rounded-tl-md">
                                    VERIFIED
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[10px]">بدون بصمة وجه</span>
                              )}
                            </td>
                            <td className="py-4 font-mono text-slate-500 dark:text-slate-300">{rec.date}</td>
                            <td className="py-4">
                              <span className="text-emerald-400 font-bold font-mono">
                                {new Date(rec.clockInTime).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {rec.clockInGPS && (
                                <a
                                  href={`https://www.google.com/maps?q=${rec.clockInGPS.lat},${rec.clockInGPS.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-[10px] text-fbm-green hover:underline font-bold mt-1 flex items-center gap-0.5"
                                >
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span>خرائط جوجل (إحداثيات الدخول)</span>
                                </a>
                              )}
                            </td>
                            <td className="py-4">
                              {rec.clockOutTime ? (
                                <>
                                  <span className="text-sky-400 font-bold font-mono">
                                    {new Date(rec.clockOutTime).toLocaleTimeString('en-GB', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  {rec.clockOutGPS && (
                                    <a
                                      href={`https://www.google.com/maps?q=${rec.clockOutGPS.lat},${rec.clockOutGPS.lng}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-[10px] text-fbm-green hover:underline font-bold mt-1 flex items-center gap-0.5"
                                    >
                                      <MapPin className="w-3 h-3 shrink-0" />
                                      <span>خرائط جوجل (إحداثيات الخروج)</span>
                                    </a>
                                  )}
                                </>
                              ) : (
                                <span className="text-slate-500">لا يزال في الخدمة 🟢</span>
                              )}
                            </td>
                            <td className="py-4 pl-2">
                              {isWorkingNow ? (
                                <span className="bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 font-bold py-1 px-2.5 rounded-lg text-[9px] animate-pulse">
                                  قيد العمل الميداني 🟢
                                </span>
                              ) : (
                                <span className="bg-slate-200 dark:bg-fbm-blue-border border border-slate-300 dark:border-fbm-blue-border text-slate-500 dark:text-slate-400 font-bold py-1 px-2.5 rounded-lg text-[9px]">
                                  منتهي ومسجّل 🔴
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab: Real-Time Communication Chat & Instructions Room */}
        {activeTab === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-5 flex flex-col h-[550px]" dir="rtl">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-fbm-blue-border pb-3 shrink-0">
                <MessageSquare className="w-5 h-5 text-fbm-green" />
                <div className="text-right">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">غرفة توجيه ومراقبة طاقم العمل الميداني</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    تبادل الإرشادات والمستجدات وتأكيد استلام عهد المازوت فورياً
                  </p>
                </div>
              </div>

              {/* Chat Viewport */}
              <div className="flex-1 overflow-y-auto space-y-3 p-2 my-2 select-text">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-50">
                    <MessageSquare className="w-8 h-8 text-slate-500" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">لم يتم طرح أي رسائل أو استفسارات ميدانية اليوم</p>
                    <p className="text-[10px] text-slate-500">يمكنك كتابة تنبيه عام ليروه على هواتفهم فوراً</p>
                  </div>
                ) : (
                  visibleChatMessages.map((msg) => {
                    const isMe = msg.senderUid === currentUser.uid;
                    const isSystem = msg.senderUid === 'system';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-1.5 shrink-0">
                          <span className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border text-[9px] text-slate-500 dark:text-slate-400 font-bold px-3 py-1 rounded-full text-center">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[75%] ${isMe ? 'mr-auto items-start text-left' : 'ml-auto items-end text-right'}`}
                      >
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5 px-1">
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
                          {new Date(msg.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Send Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formEl = e.currentTarget;
                  const inputEl = formEl.elements.namedItem('adminChatMsg') as HTMLInputElement;
                  if (!inputEl || !inputEl.value.trim()) return;

                  const newMsg: ChatMessage = {
                    id: `msg_${Date.now()}`,
                    senderUid: currentUser.uid,
                    senderName: currentUser.fullName,
                    senderRole: 'admin',
                    text: inputEl.value.trim(),

                    createdAt: new Date().toISOString(),
                  };
                  onAddChatMessage(newMsg);
                  inputEl.value = '';
                }}
                className="flex gap-2 shrink-0 pt-3 border-t border-slate-200 dark:border-fbm-blue-border"
              >
                <input
                  name="adminChatMsg"
                  type="text"
                  placeholder="بث تنبيه تشغيلي مباشر، تفاصيل موقع التسليم، أو الرد على تساؤلات العمال..."
                  className="flex-1 bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none placeholder-slate-500 text-slate-900 dark:text-white"
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
        </AnimatePresence>
      </div>

      {/* Review & Approve Expense Dialog */}
      <AnimatePresence>
      {selectedExpenseForReview && (
        <div className="fixed inset-0 bg-[#00021c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 shadow-sm relative"
            dir="rtl"
          >
            <button
              onClick={() => setSelectedExpenseForReview(null)}
              className="absolute left-4 top-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 text-right border-b border-slate-200 dark:border-fbm-blue-border pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-fbm-green" />
              <span>مراجعة وتدقيق وتعديل المصروف</span>
            </h3>

            <div className="space-y-4 text-right text-xs leading-relaxed">
              {/* Original details sent by worker */}
              <div className="bg-white dark:bg-fbm-blue p-3.5 rounded-2xl space-y-1.5 border border-slate-200 dark:border-fbm-blue-border">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">الموظف المشتري:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedExpenseForReview.workerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">توقيت الرفع:</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {new Date(selectedExpenseForReview.createdAt).toLocaleString('en-GB')}
                  </span>
                </div>
              </div>

              {/* Editable Correction Form */}
              <div className="space-y-3 pt-1 border-t border-slate-850">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-fbm-green uppercase tracking-wider">
                    ✏️ حقل التدقيق والتصحيح المالي:
                  </div>
                  {!canEditExpenses && (
                    <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      ⚠️ وضع الاعتماد فقط
                    </span>
                  )}
                </div>

                {!canEditExpenses && (
                  <p className="text-[10px] text-amber-400 bg-amber-500/5 p-2 rounded-xl border border-amber-500/10 leading-normal">
                    ملاحظة: لا تملك صلاحية تعديل قيم الفاتورة الأصلية. يمكنك فقط مراجعة المستند المرفق واعتماده أو رفضه
                    بالقيم الحالية.
                  </p>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-300 block">المبلغ الفعلي المعتمد (د.ج)</label>
                  <input
                    type="number"
                    value={editExpenseAmount}
                    onChange={(e) => setEditExpenseAmount(e.target.value)}
                    placeholder="1000"
                    dir="ltr"
                    disabled={!canEditExpenses}
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-left focus:outline-none text-slate-900 dark:text-white font-mono font-bold disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100/40 dark:bg-fbm-blue-card"
                    required
                  />
                  {canEditExpenses && (
                    <p className="text-[9px] text-slate-500">
                      إذا كان هناك خطأ في القيمة التي أدخلها العامل، اكتب القيمة الصحيحة هنا مباشرة.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-300 block">التصنيف المحاسبي المعتمد</label>
                  <select
                    value={editExpenseCategory}
                    onChange={(e) => setEditExpenseCategory(e.target.value)}
                    disabled={!canEditExpenses}
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none text-slate-900 dark:text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100/40 dark:bg-fbm-blue-card"
                    required
                  >
                    <option value="">-- اختر الفئة --</option>
                    {categories
                      .filter((c) => c.type === 'expense')
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-300 block">البيان وسبب الصرف النهائي</label>
                  <textarea
                    value={editExpenseDesc}
                    onChange={(e) => setEditExpenseDesc(e.target.value)}
                    placeholder="بنزين للشاحنة رقم 4..."
                    disabled={!canEditExpenses}
                    className="w-full h-16 bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none text-slate-900 dark:text-white resize-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100/40 dark:bg-fbm-blue-card"
                    required
                  />
                </div>
              </div>

              {/* Receipt Image simulation */}
              <div>
                <span className="block text-slate-500 dark:text-slate-400 font-bold mb-1.5">نسخة الفاتورة الموثقة (المرفوعة):</span>
                {selectedExpenseForReview.receiptImage ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-fbm-blue-border overflow-hidden relative">
                    <img
                      src={selectedExpenseForReview.receiptImage}
                      alt="Receipt Document"
                      className="w-full max-h-48 object-contain bg-slate-950"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="h-28 bg-slate-950 border border-slate-200 dark:border-fbm-blue-border rounded-2xl flex flex-col items-center justify-center text-slate-500 text-center p-3">
                    <AlertCircle className="w-6 h-6 text-amber-500/70 mb-1" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">لم يتم إرفاق صورة فاتورة</span>
                    <span className="text-[8px] text-slate-500">
                      رقم مرجعي: FBM-BILL-{selectedExpenseForReview.id.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-fbm-blue-border/60">
                {!canApproveExpenses ? (
                  <div className="space-y-2">
                    <div className="bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl text-[10px] text-red-400 font-bold text-center">
                      🔒 عذرًا، ليس لديك صلاحية اعتماد أو رفض طلبات المصاريف (معاينة فقط).
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedExpenseForReview(null)}
                      className="w-full bg-slate-100 dark:bg-fbm-blue-card hover:bg-slate-850 border border-slate-200 dark:border-fbm-blue-border text-slate-500 dark:text-slate-300 font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all"
                    >
                      إغلاق ومعاينة المستند
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedExpenseForReview(null)}
                      className="bg-slate-100 dark:bg-fbm-blue-card hover:bg-slate-850 border border-slate-200 dark:border-fbm-blue-border text-slate-500 dark:text-slate-400 font-semibold py-3 px-2 rounded-xl text-xs cursor-pointer transition-all text-center"
                    >
                      إلغاء
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('⚠️ هل أنت متأكد من رفض هذا المصروف نهائياً؟')) {
                          handleReviewExpense(
                            selectedExpenseForReview.id,
                            'rejected',
                            parseFloat(editExpenseAmount),
                            editExpenseCategory,
                            editExpenseDesc,
                          );
                        }
                      }}
                      className="bg-red-600/20 hover:bg-red-600 border border-red-600/30 text-red-400 hover:text-white font-bold py-3 px-2 rounded-xl text-xs cursor-pointer transition-all text-center"
                    >
                      رفض الطلب ❌
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const amt = parseFloat(editExpenseAmount);
                        if (isNaN(amt) || amt <= 0) {
                          alert('⚠️ يرجى إدخال مبلغ صحيح ومقبول!');
                          return;
                        }
                        if (!editExpenseCategory) {
                          alert('⚠️ يرجى تحديد الفئة المحاسبية!');
                          return;
                        }
                        handleReviewExpense(
                          selectedExpenseForReview.id,
                          'approved',
                          amt,
                          editExpenseCategory,
                          editExpenseDesc,
                        );
                      }}
                      className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-3 px-2 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1 text-center"
                    >
                      <Check className="w-4 h-4 font-bold" />
                      <span>{canEditExpenses ? 'تدقيق واعتماد' : 'اعتماد وقبول'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Edit Permissions Modal */}
      <AnimatePresence>
      {editingPermissionsUser && (
        <div className="fixed inset-0 bg-[#00021c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 shadow-sm relative"
            dir="rtl"
          >
            <button
              onClick={() => setEditingPermissionsUser(null)}
              className="absolute left-4 top-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 text-right flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-fbm-green" />
              <span>إدارة وصلاحيات الحساب التفصيلية</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 text-right">
              تعديل صلاحيات الوصول والتحكم للموظف:{' '}
              <span className="text-slate-900 dark:text-white font-bold">{editingPermissionsUser.fullName}</span>
            </p>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1 text-right">
              {/* Permission Item: Access Admin Dashboard */}
              <label className="flex items-start gap-3 bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-200 dark:border-fbm-blue-border cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={!!editingPermissionsUser.permissions?.canAccessAdminDashboard}
                  onChange={() => handleTogglePermissionKey('canAccessAdminDashboard')}
                  className="mt-0.5 accent-[#76BC21] w-4 h-4 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">السماح بدخول لوحة الإدارة والتحكم</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    تمكين الموظف من تسجيل الدخول إلى لوحة المدير لإدارة المهام أو متابعة المخزون أو المصاريف.
                  </span>
                </div>
              </label>

              {/* Financial Section Heading */}
              <div className="col-span-1 md:col-span-2 border-t border-slate-200 dark:border-fbm-blue-border pt-4 mt-2">
                <h4 className="text-xs font-bold text-fbm-green mb-2 flex items-center gap-1">
                  <span>💼 الصلاحيات المالية والرقابة وتدقيق المصاريف التفصيلية:</span>
                </h4>
              </div>

              {/* Permission Item: View All Expenses */}
              <label className="flex items-start gap-3 bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-200 dark:border-fbm-blue-border cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={!!editingPermissionsUser.permissions?.canViewAllExpenses}
                  onChange={() => handleTogglePermissionKey('canViewAllExpenses')}
                  className="mt-0.5 accent-[#76BC21] w-4 h-4 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">رؤية جميع مصاريف الشركة</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    يسمح برؤية مصاريف وفواتير جميع الموظفين في لوحة التحكم بشكل كامل.
                  </span>
                </div>
              </label>

              {/* Permission Item: Approve Expenses Only */}
              <label className="flex items-start gap-3 bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-200 dark:border-fbm-blue-border cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={!!editingPermissionsUser.permissions?.canApproveExpenses}
                  onChange={() => handleTogglePermissionKey('canApproveExpenses')}
                  className="mt-0.5 accent-[#76BC21] w-4 h-4 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">صلاحية الاعتماد المالي فقط (بدون تعديل)</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    تمكين المشرف من اعتماد وقبول المصارف مباشرة بالمبالغ الأصلية التي رفعها العمال.
                  </span>
                </div>
              </label>

              {/* Permission Item: Edit Expenses */}
              <label className="flex items-start gap-3 bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-200 dark:border-fbm-blue-border cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={!!editingPermissionsUser.permissions?.canEditExpenses}
                  onChange={() => handleTogglePermissionKey('canEditExpenses')}
                  className="mt-0.5 accent-[#76BC21] w-4 h-4 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">صلاحية التعديل وتصحيح تفاصيل المصروف</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    يسمح بتغيير مبالغ الفواتير، تعديل فئتها المحاسبية، وتصحيح سبب الصرف أثناء التدقيق.
                  </span>
                </div>
              </label>

              {/* Permission Item: View Financial Reports */}
              <label className="flex items-start gap-3 bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-200 dark:border-fbm-blue-border cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={!!editingPermissionsUser.permissions?.canViewFinancialReports}
                  onChange={() => handleTogglePermissionKey('canViewFinancialReports')}
                  className="mt-0.5 accent-[#76BC21] w-4 h-4 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    عرض التقارير والرسوم البيانية المالية وتصدير البيانات
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    تمكين المشرف من الاطلاع على الرسوم البيانية، ومتابعة ميزانية الشهر، وتصدير ملف Excel المالي
                    للحسابات.
                  </span>
                </div>
              </label>

              {/* Permission Item: Audit Expenses (Legacy/Full) */}
              <label className="flex items-start gap-3 bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-200 dark:border-fbm-blue-border cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={!!editingPermissionsUser.permissions?.canAuditExpenses}
                  onChange={() => handleTogglePermissionKey('canAuditExpenses')}
                  className="mt-0.5 accent-[#76BC21] w-4 h-4 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">التدقيق الكامل (تعديل واعتماد معاً)</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    صلاحية تدقيق ومراجعة شاملة متوافقة مع الأنظمة السابقة (تعديل واعتماد في خطوة واحدة).
                  </span>
                </div>
              </label>

              <div className="col-span-1 md:col-span-2 border-t border-slate-200 dark:border-fbm-blue-border pt-4 mt-2">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                  <span>🛠️ الصلاحيات التشغيلية واللوجستية:</span>
                </h4>
              </div>

              {/* Permission Item: Manage Tasks */}
              <label className="flex items-start gap-3 bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-200 dark:border-fbm-blue-border cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={!!editingPermissionsUser.permissions?.canManageTasks}
                  onChange={() => handleTogglePermissionKey('canManageTasks')}
                  className="mt-0.5 accent-[#76BC21] w-4 h-4 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">توزيع وإدارة مهام العمل الميداني</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    تمكين الموظف من توزيع المهام وتعيينها للموظفين ومتابعة إتمامها وتوقيعاتهم.
                  </span>
                </div>
              </label>

              {/* Permission Item: Manage Transfers */}
              <label className="flex items-start gap-3 bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-200 dark:border-fbm-blue-border cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={!!editingPermissionsUser.permissions?.canManageTransfers}
                  onChange={() => handleTogglePermissionKey('canManageTransfers')}
                  className="mt-0.5 accent-[#76BC21] w-4 h-4 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">إدارة حركة السلع ومطابقة المخازن (PC)</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    يمنح صلاحية التحقق من تحويلات السلع وتسجيلها ومطابقتها مع نظام المبيعات.
                  </span>
                </div>
              </label>

              {/* Permission Item: Manage Orders */}
              <label className="flex items-start gap-3 bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-200 dark:border-fbm-blue-border cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={!!editingPermissionsUser.permissions?.canManageOrders}
                  onChange={() => handleTogglePermissionKey('canManageOrders')}
                  className="mt-0.5 accent-[#76BC21] w-4 h-4 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">إدارة وتحضير طلبيات الزبائن</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    إدارة ومراقبة تجهيز بونات الزبائن وحالة توصيلها خطوة بخطوة.
                  </span>
                </div>
              </label>

              {/* Permission Item: Manage Debts */}
              <label className="flex items-start gap-3 bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-200 dark:border-fbm-blue-border cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={!!editingPermissionsUser.permissions?.canManageDebts}
                  onChange={() => handleTogglePermissionKey('canManageDebts')}
                  className="mt-0.5 accent-[#76BC21] w-4 h-4 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">إدارة ديون وذمم الزبائن المالية</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    رؤية وإدارة الذمم المالية للزبائن وتحديث الدفعات وتحصيل الديون.
                  </span>
                </div>
              </label>

              {/* Permission Item: Manage Camion */}
              <label className="flex items-start gap-3 bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-200 dark:border-fbm-blue-border cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={!!editingPermissionsUser.permissions?.canManageCamion}
                  onChange={() => handleTogglePermissionKey('canManageCamion')}
                  className="mt-0.5 accent-[#76BC21] w-4 h-4 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">إدارة شاحنات التوزيع والموردين</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    تخطيط مسارات الشاحنات ومكالمات السائقين وتنبيهات توريد السلع ومشاكل الكمية.
                  </span>
                </div>
              </label>

              {/* Permission Item: Manage Attendance */}
              <label className="flex items-start gap-3 bg-white dark:bg-fbm-blue p-3 rounded-xl border border-slate-200 dark:border-fbm-blue-border cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={!!editingPermissionsUser.permissions?.canManageAttendance}
                  onChange={() => handleTogglePermissionKey('canManageAttendance')}
                  className="mt-0.5 accent-[#76BC21] w-4 h-4 rounded"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">مراقبة حضور وانصراف الموظفين وبصماتهم</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    رؤية سجلات تسجيل الدخول والخروج، ومطابقة صور السيلفي وإحداثيات الـ GPS الجغرافية في وقتها الفعلي.
                  </span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-5 border-t border-slate-200 dark:border-fbm-blue-border/60 mt-5">
              <button
                type="button"
                onClick={() => setEditingPermissionsUser(null)}
                className="bg-slate-100 dark:bg-fbm-blue-card hover:bg-slate-850 border border-slate-200 dark:border-fbm-blue-border text-slate-500 dark:text-slate-400 font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all"
              >
                إلغاء التعديل
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold tracking-wide py-3 px-4 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4 font-bold" />
                <span>حفظ الصلاحيات والمزامنة</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Task Modal */}
      <AnimatePresence>
      {showTaskModal && (
        <div className="fixed inset-0 bg-[#00021c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 shadow-sm relative"
            dir="rtl"
          >
            <button
              onClick={() => setShowTaskModal(false)}
              className="absolute left-4 top-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 text-right border-b border-slate-200 dark:border-fbm-blue-border pb-3">
              إسناد وتكليف مهمة ميدانية جديدة
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">عنوان العملية</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="مثال: توصيل دفعة الشوكولاتة لمستودع وهران"
                  className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">تفصيل التعليمات التشغيلية</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="اكتب التوجيهات الدقيقة، الأوقات، وأرقام مستلمي الحاويات..."
                  rows={4}
                  className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">تعيين للموظفين (متعدد)</label>
                  <div className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-xl max-h-40 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {users
                      .filter((u) => u.isActive)
                      .map((w) => (
                        <label
                          key={w.uid}
                          className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
                        >
                          <input
                            type="checkbox"
                            value={w.uid}
                            checked={newTaskWorkerUids.includes(w.uid)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTaskWorkerUids([...newTaskWorkerUids, w.uid]);
                              } else {
                                setNewTaskWorkerUids(newTaskWorkerUids.filter((id) => id !== w.uid));
                              }
                            }}
                            className="w-4 h-4 rounded bg-white dark:bg-fbm-blue-card  border-slate-300 dark:border-fbm-blue-border text-fbm-green focus:ring-[#76BC21] focus:ring-offset-[#000839]"
                          />
                          <span className="text-sm text-slate-900 dark:text-white">
                            {w.fullName}{' '}
                            <span className="text-[10px] text-slate-500">
                              ({w.role === 'admin' ? 'إدارة' : w.subRole === 'supervisor' ? 'مشرف 👑' : 'موظف ميداني 👷‍♂️'})
                            </span>
                          </span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block">فئة وتصنيف العملية</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-3 py-2.5 text-xs text-right focus:outline-none text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">-- اختر الفئة المعتمدة --</option>
                    {categories
                      .filter((c) => c.type === 'task')
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 block flex items-center justify-start gap-1.5">
                  <span>الموعد النهائي لإنجاز المهمة (اختياري)</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                    تنبيه مجدول ⏰
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-2.5 text-xs text-right focus:outline-none text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-slate-500 block">
                  سيقوم النظام تلقائياً بإطلاق إشعار وتنبيه لجميع المدراء والمشرفين قبل هذا الموعد بـ 24 ساعة.
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-fbm-green hover:bg-fbm-green-hover text-white font-bold tracking-wide py-3 rounded-xl text-xs cursor-pointer shadow transition-all mt-4"
              >
                تثبيت التكليف وإبلاغ الموظف فوراً
              </button>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Add Expense Form Sheet Modal */}
      <AnimatePresence>
      {showExpenseModal && (
        <div className="fixed inset-0 bg-[#00021c]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-white dark:bg-fbm-blue-card  border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 shadow-sm relative"
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
              {isSupervisorOrAdmin ? 'تسجيل وإضافة مصروف فوري مباشر (صلاحيات الإدارة)' : 'تسجيل وإضافة مصروف ميداني 💸'}
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
                  className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-3 text-xs text-right focus:outline-none font-mono"
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
                  className="w-full bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border focus:border-fbm-green rounded-xl px-4 py-3 text-xs text-right focus:outline-none"
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

              {isSupervisorOrAdmin ? (
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    type="submit"
                    onClick={() => setSubmitMode('approved')}
                    className="w-full bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-900" />
                    <span>اعتماد وصرف فوري مباشر ✅</span>
                  </button>
                  <button
                    type="submit"
                    onClick={() => setSubmitMode('pending')}
                    className="w-full bg-amber-500/10 hover:bg-amber-500 hover:text-slate-900 text-amber-400 border border-amber-500/25 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>إرسال للتدقيق والمراجعة اللاحقة ⏳</span>
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  onClick={() => setSubmitMode('pending')}
                  className="w-full bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-3 rounded-xl text-xs cursor-pointer shadow-lg transition-all mt-4 flex items-center justify-center gap-1.5"
                >
                  <span>تسجيل وحفظ المصروف للاعتماد 🚀</span>
                </button>
              )}
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Local Toast Notification for deletions and edits */}
      {localToast && (
        <div
          className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[9999] max-w-sm w-full bg-white/95 dark:bg-fbm-blue-card/95 backdrop-blur border border-slate-200 dark:border-fbm-blue-border rounded-2xl shadow-sm p-4 flex gap-3 text-right animate-slideIn"
          dir="rtl"
        >
          {/* Status Icon & Glow */}
          <div className="shrink-0">
            <div
              className={`w-10 h-10 ${localToast.type === 'success' ? 'bg-fbm-green/10 text-fbm-green' : 'bg-red-500/10 text-red-500'} rounded-xl flex items-center justify-center relative shadow-inner animate-pulse`}
            >
              {localToast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex justify-between items-start gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{localToast.title}</h4>
              <button
                onClick={() => setLocalToast(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 leading-relaxed">{localToast.body}</p>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-[#00021c]/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-fbm-blue-card  border border-slate-200/85 dark:border-fbm-blue-border rounded-2xl max-w-md w-full shadow-sm p-6 text-right space-y-6 relative overflow-hidden"
            dir="rtl"
          >
            {/* Visual warning background bar */}
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-red-500 to-amber-500"></div>

            {/* Header / Icon */}
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-fbm-blue-border pb-4">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">تأكيد عملية الحذف النهائية ⚠️</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">إجراء حساس ولا يمكن التراجع عنه بعد التأكيد</p>
              </div>
            </div>

            {/* Description of what is being deleted */}
            <div className="bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-4 space-y-2">
              <span className="text-[10px] text-slate-500 font-bold block">
                {confirmModal.type === 'expense' ? 'تفاصيل المصروف المراد حذفه:' : 'تفاصيل المهمة المراد حذفها:'}
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed break-words">{confirmModal.itemTitle}</p>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-300 leading-relaxed">
              يرجى الانتباه إلى أن هذا الإجراء سيقوم بإزالة هذا العنصر نهائياً وبشكل كامل من قاعدة البيانات السحابية
              ونظام الفروع. هل أنت متأكد تماماً من رغبتك في الموافقة؟
            </p>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => confirmModal.onConfirm()}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-lg hover:shadow-red-500/10 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف نهائياً</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 bg-slate-100 dark:bg-fbm-blue-card hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-fbm-blue-border font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                إلغاء وتراجع
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}

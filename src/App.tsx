import { useState, useEffect, useRef } from 'react';
import ToasterSetup from './components/ToasterSetup';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
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
} from './types';
import { getStoredData, setStoredData } from './data';
import {
  seedFirestoreIfNeeded,
  subscribeToCollection,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  saveNotificationToFirestore,
  deleteNotificationFromFirestore,
  saveAttendanceToFirestore,
  saveChatToFirestore,
  saveTransferToFirestore,
  deleteTransferFromFirestore,
  saveClientOrderToFirestore,
  deleteClientOrderFromFirestore,
  saveClientDebtToFirestore,
  deleteClientDebtFromFirestore,
  saveCamionRouteToFirestore,
  deleteCamionRouteFromFirestore,
  saveSupplierAlertToFirestore,
  deleteSupplierAlertFromFirestore,
  saveSectionsVisibilityToFirestore,
  subscribeToSectionsVisibility,
} from './firebase';
import SmartLogin from './components/SmartLogin';
import AdminDashboard from './components/AdminDashboard';
import WorkerDashboard from './components/WorkerDashboard';
import { isEqual } from './utils/safeStringify';

import { playNotificationChime } from './utils/audio';
import { Bell, X } from 'lucide-react';

export default function App() {
  // Database states persisted in Cloud Firestore
  const [users, setUsers] = useState<AppUser[]>([]);
  const [categories, setCategories] = useState<CompanyCategory[]>([]);
  const [tasks, setTasks] = useState<CompanyTask[]>([]);
  const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
  const [notifications, setNotifications] = useState<CompanyNotification[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sectionsVisibility, setSectionsVisibility] = useState<SectionVisibility[]>([]);

  // New States for auto spare parts wholesale business operations
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [clientOrders, setClientOrders] = useState<ClientOrder[]>([]);
  const [clientDebts, setClientDebts] = useState<ClientDebt[]>([]);
  const [camionRoutes, setCamionRoutes] = useState<CamionRoute[]>([]);
  const [supplierAlerts, setSupplierAlerts] = useState<SupplierAlert[]>([]);

  // Auth state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'worker'>('admin');

  // Audio and Toast Notification alerts
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());
  const isFirstNotificationsLoadRef = useRef(true);
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; body: string } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Initialize data on mount
  useEffect(() => {
    let unsubUsers = () => {};
    let unsubCategories = () => {};
    let unsubTasks = () => {};
    let unsubExpenses = () => {};
    let unsubNotifications = () => {};
    let unsubAttendance = () => {};
    let unsubChat = () => {};
    let unsubTransfers = () => {};
    let unsubClientOrders = () => {};
    let unsubClientDebts = () => {};
    let unsubCamionRoutes = () => {};
    let unsubSupplierAlerts = () => {};
    let unsubSectionsVisibility = () => {};

    const initAndSync = async () => {
      // Seed initial admin if needed
      await seedFirestoreIfNeeded();

      // ─── Native Android Notification Channel Setup ───────────────────────────
      // CRITICAL: Without a notification channel, no notifications appear on Android 8+
      if (Capacitor.isNativePlatform()) {
        try {
          // Request permission first (Android 13+)
          const permResult = await LocalNotifications.requestPermissions();
          console.log('[FBM] Notification permission:', permResult.display);

          // Create HIGH-importance channel for business alerts (heads-up popup)
          await LocalNotifications.createChannel({
            id: 'fbm-main-channel',
            name: 'FBM - إشعارات فورية',
            description: 'إشعارات المهام، المصاريف، والتنبيهات الفورية',
            importance: 5, // IMPORTANCE_HIGH — heads-up, appears in notification drawer
            visibility: 1, // VISIBILITY_PUBLIC — visible on lock screen
            vibration: true,
            lights: true,
            lightColor: '#76BC21',
            sound: 'default',
          });

          // Create LOW-importance channel for the keep-alive service notification
          await LocalNotifications.createChannel({
            id: 'fbm-keepalive-channel',
            name: 'FBM - نظام متصل',
            description: 'خدمة الاتصال المستمر بالخادم',
            importance: 1, // IMPORTANCE_MIN — silent, no popup
            visibility: -1, // VISIBILITY_SECRET — hidden on lock screen
            vibration: false,
            lights: false,
            sound: undefined,
          });

          console.log('[FBM] Notification channels created.');
        } catch (e) {
          console.error('[FBM] Error setting up notification channels:', e);
        }

        // ─── Request Battery Optimization Exemption ──────────────────────────
        // The native FBMBackgroundService handles this via foreground service.
        // Log that background service should be running.
        console.log('[FBM] Background keep-alive service is active via FBMBackgroundService.');
      }
      // ─────────────────────────────────────────────────────────────────────────

      // Subscribe to real-time updates from Cloud Firestore
      unsubUsers = subscribeToCollection<AppUser>('users', (data) => {
        // Keep active users first, or sorted as needed
        setUsers(data);
        setIsUsersLoaded(true);
      });
      unsubCategories = subscribeToCollection<CompanyCategory>('categories', setCategories);
      unsubTasks = subscribeToCollection<CompanyTask>('tasks', setTasks);
      unsubExpenses = subscribeToCollection<CompanyExpense>('expenses', setExpenses);
      unsubNotifications = subscribeToCollection<CompanyNotification>('notifications', setNotifications, 'createdAt');
      unsubAttendance = subscribeToCollection<AttendanceRecord>('attendance', setAttendance, 'clockInTime');
      unsubChat = subscribeToCollection<ChatMessage>(
        'chat',
        (msgs) => {
          // Sort by oldest first so chat displays linearly
          const sorted = [...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setChatMessages(sorted);
        },
        'createdAt',
      );

      // Real-time subscriptions for auto parts enterprise features
      unsubTransfers = subscribeToCollection<StockTransfer>('transfers', setTransfers, 'createdAt');
      unsubClientOrders = subscribeToCollection<ClientOrder>('client_orders', setClientOrders, 'createdAt');
      unsubClientDebts = subscribeToCollection<ClientDebt>('client_debts', setClientDebts, 'createdAt');
      unsubCamionRoutes = subscribeToCollection<CamionRoute>('camion_routes', setCamionRoutes);
      unsubSupplierAlerts = subscribeToCollection<SupplierAlert>('supplier_alerts', setSupplierAlerts, 'createdAt');
      unsubSectionsVisibility = subscribeToSectionsVisibility(setSectionsVisibility);

      // Keep login session stored locally for smooth UX
      const storedAuth = await getStoredData<AppUser | null>('auth_user', null);
      if (storedAuth) {
        setCurrentUser(storedAuth);
      }
      setIsInitializing(false);
    };

    initAndSync();

    return () => {
      unsubUsers();
      unsubCategories();
      unsubTasks();
      unsubExpenses();
      unsubNotifications();
      unsubAttendance();
      unsubChat();
      unsubTransfers();
      unsubClientOrders();
      unsubClientDebts();
      unsubCamionRoutes();
      unsubSupplierAlerts();
      unsubSectionsVisibility();
    };
  }, []);

  // Sync / monitor notifications to trigger real-time audio chime, heads-up system alerts, and in-app Toasts
  const knownChatIdsRef = useRef<Set<string>>(new Set());
  const isFirstChatLoadRef = useRef(true);

  useEffect(() => {
    if (notifications.length === 0) return;

    // On initial notifications load, just record the existing IDs and return (avoid chiming on old history)
    if (isFirstNotificationsLoadRef.current) {
      notifications.forEach((n) => knownNotificationIdsRef.current.add(n.id));
      isFirstNotificationsLoadRef.current = false;
      return;
    }

    // Find new notifications
    const newNotifications = notifications.filter((n) => !knownNotificationIdsRef.current.has(n.id));

    // Update the set of known IDs
    notifications.forEach((n) => knownNotificationIdsRef.current.add(n.id));

    if (newNotifications.length === 0) return;

    // Check if any of these new ones target the logged in user
    if (!currentUser) return;

    const relevantNotifications = newNotifications.filter((n) => {
      if (n.createdByUid && n.createdByUid === currentUser.uid) return false;

      if (currentUser.role === 'admin') {
        return true;
      }

      if (n.targetType === 'all') {
        return true;
      }

      if (n.targetUids && n.targetUids.includes(currentUser.uid)) {
        return true;
      }

      return false;
    });

    if (relevantNotifications.length > 0) {
      // Play a premium high-quality soft notification chime
      playNotificationChime();

      // Show in-app Toast for the latest incoming notification
      const latestNotif = relevantNotifications[relevantNotifications.length - 1];
      setActiveToast({
        id: latestNotif.id,
        title: latestNotif.title,
        body: latestNotif.body,
      });

      // CRITICAL: Send native system notification (for notification drawer & lock screen)
      relevantNotifications.forEach((notif) => {
        sendNativeSystemNotification(notif.title, notif.body);
      });
    }
  }, [notifications, currentUser]);

  // Sync / monitor chat messages to trigger background system notifications (Snapchat/WhatsApp style)
  useEffect(() => {
    if (chatMessages.length === 0) return;

    // On initial chat load, record existing message IDs to avoid alerting old history
    if (isFirstChatLoadRef.current) {
      chatMessages.forEach((m) => knownChatIdsRef.current.add(m.id));
      isFirstChatLoadRef.current = false;
      return;
    }

    // Find new incoming chat messages
    const newMessages = chatMessages.filter((m) => !knownChatIdsRef.current.has(m.id));

    // Keep track of the message IDs
    chatMessages.forEach((m) => knownChatIdsRef.current.add(m.id));

    if (newMessages.length === 0) return;
    if (!currentUser) return;

    // Only notify if message was sent by someone else (not the current user)
    const incomingMessages = newMessages.filter((m) => m.senderUid !== currentUser.uid);

    if (incomingMessages.length > 0) {
      // Play soft chime
      playNotificationChime();

      // Send native system notification for each new message
      incomingMessages.forEach((msg) => {
        sendNativeSystemNotification(`💬 رسالة جديدة من ${msg.senderName}`, msg.text);
      });
    }
  }, [chatMessages, currentUser]);

  // Real-time Native FCM Push Notification Registry
  useEffect(() => {
    if (!currentUser || !Capacitor.isNativePlatform()) return;

    const setupPush = async () => {
      try {
        console.log('[FBM FCM] Initializing Native Push Notifications Setup...');
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive === 'granted') {
          await PushNotifications.register();
        }

        // Handle successful registration and update token in Firestore
        PushNotifications.addListener('registration', async (token) => {
          console.log('[FBM FCM] Registration successful, Token:', token.value);
          if (token.value && token.value !== currentUser.fcmToken) {
            const updatedUser = { ...currentUser, fcmToken: token.value };
            await saveUserToFirestore(updatedUser);
          }
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('[FBM FCM] Native Push Registration failed:', err);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[FBM FCM] Push Notification received in foreground:', notification);
          // Play sound and trigger in-app alert or notification list update
          playNotificationChime();
          setActiveToast({
            id: `push_toast_${Date.now()}`,
            title: notification.title || 'تنبيه جديد 🔔',
            body: notification.body || '',
          });
        });
      } catch (err) {
        console.error('[FBM FCM] Error setting up Push Notifications:', err);
      }
    };

    setupPush();

    return () => {
      try {
        PushNotifications.removeAllListeners();
      } catch (e) {
        console.warn('[FBM FCM] Error removing listeners:', e);
      }
    };
  }, [currentUser]);

  // Handle active toast auto-dismissal after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  // Scheduled Alerts for upcoming tasks (within 24 hours)
  useEffect(() => {
    if (tasks.length === 0) return;

    const checkUpcomingDeadlines = () => {
      const now = Date.now();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      tasks.forEach((task) => {
        if (!task.dueDate || task.status === 'done' || task.archived) return;

        const deadlineTime = new Date(task.dueDate).getTime();
        const diffMs = deadlineTime - now;

        // Trigger if deadline is within 24 hours and is not yet alerted
        if (diffMs > -2 * 60 * 60 * 1000 && diffMs <= twentyFourHoursMs) {
          const alertId = `alert_24h_${task.id}`;

          // Check if we already created an alert notification for this task
          const alreadyAlerted = notifications.some((n) => n.id === alertId);
          if (!alreadyAlerted) {
            const formattedDate = new Date(task.dueDate).toLocaleString('en-GB', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            handleAddNotification({
              id: alertId,
              title: 'تنبيه اقتراب الموعد النهائي ⚠️',
              body: `المهمة: "${task.title}" المكلف بها (${task.assignedToNames.join(', ')}) يتبقى على موعدها النهائي أقل من 24 ساعة (الموعد: ${formattedDate}).`,
              targetType: 'all',
              readByUids: [],
              createdByUid: currentUser?.uid,
              createdAt: new Date().toISOString(),
            });
          }
        }
      });
    };

    // Check immediately on load or state updates
    checkUpcomingDeadlines();

    // Check periodically every 2 minutes
    const interval = setInterval(checkUpcomingDeadlines, 120 * 1000);
    return () => clearInterval(interval);
  }, [tasks, notifications]);

  // Sync state changes with Cloud Firestore
  const handleUpdateUsers = async (newUsers: AppUser[]) => {
    const changed = newUsers.filter((newItem) => {
      const oldItem = users.find((old) => old.uid === newItem.uid);
      return !oldItem || !isEqual(oldItem, newItem);
    });
    setUsers(newUsers);
    for (const item of changed) {
      await saveUserToFirestore(item);
    }
  };

  const handleUpdateCategories = async (newCategories: CompanyCategory[]) => {
    const changed = newCategories.filter((newItem) => {
      const oldItem = categories.find((old) => old.id === newItem.id);
      return !oldItem || !isEqual(oldItem, newItem);
    });
    setCategories(newCategories);
    for (const item of changed) {
      await saveCategoryToFirestore(item);
    }
  };

  const handleUpdateTasks = async (newTasks: CompanyTask[]) => {
    const changed = newTasks.filter((newItem) => {
      const oldItem = tasks.find((old) => old.id === newItem.id);
      return !oldItem || !isEqual(oldItem, newItem);
    });
    setTasks(newTasks);
    for (const item of changed) {
      await saveTaskToFirestore(item);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTaskFromFirestore(id);
  };

  const handleUpdateExpenses = async (newExpenses: CompanyExpense[]) => {
    const changed = newExpenses.filter((newItem) => {
      const oldItem = expenses.find((old) => old.id === newItem.id);
      return !oldItem || !isEqual(oldItem, newItem);
    });
    setExpenses(newExpenses);
    for (const item of changed) {
      await saveExpenseToFirestore(item);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await deleteExpenseFromFirestore(id);
  };

  const handleUpdateNotification = async (updatedNotif: CompanyNotification) => {
    setNotifications((prev) => prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n)));
    await saveNotificationToFirestore(updatedNotif);
  };

  const handleUpdateNotifications = async (newNotifications: CompanyNotification[]) => {
    const changed = newNotifications.filter((newItem) => {
      const oldItem = notifications.find((old) => old.id === newItem.id);
      return !oldItem || !isEqual(oldItem, newItem);
    });
    setNotifications(newNotifications);
    for (const item of changed) {
      await saveNotificationToFirestore(item);
    }
  };

  const handleLoginSuccess = async (user: AppUser) => {
    setCurrentUser(user);
    await setStoredData('auth_user', user);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    await setStoredData('auth_user', null);
  };

  // State mutation actions passed down
  const handleUpdateAttendance = async (record: AttendanceRecord) => {
    setAttendance((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) {
        return prev.map((r) => (r.id === record.id ? record : r));
      } else {
        return [record, ...prev];
      }
    });
    await saveAttendanceToFirestore(record);
  };

  const handleAddChatMessage = async (msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
    await saveChatToFirestore(msg);
  };

  const handleAddExpense = (newExpense: CompanyExpense) => {
    const updated = [newExpense, ...expenses];
    handleUpdateExpenses(updated);
  };

  // Helper to send real native device push notifications (like WhatsApp/Snapchat)
  const sendNativeSystemNotification = async (title: string, body: string) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: Math.floor(Math.random() * 2000000) + 1,
              // Use 1 second delay — enough for Android to process it
              schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
              // Link to the FBM channel we created at startup
              channelId: 'fbm-main-channel',
              smallIcon: 'ic_launcher',
              iconColor: '#76BC21',
              sound: 'default',
              actionTypeId: '',
              extra: { source: 'fbm-erp' },
            },
          ],
        });
      } catch (e) {
        console.error('[FBM] Failed to schedule native notification:', e);
      }
      return;
    }

    // Web fallback
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg
            .showNotification(title, {
              body: body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              vibrate: [200, 100, 200],
              tag: `fbm-notif-${Date.now()}`,
            } as any)
            .catch(() => {
              new Notification(title, { body });
            });
        });
      } else {
        new Notification(title, { body });
      }
    }
  };

  const handleAddNotification = (newNotif: CompanyNotification) => {
    const updated = [newNotif, ...notifications];
    handleUpdateNotifications(updated);

    // Trigger real native OS push alert!
    sendNativeSystemNotification(newNotif.title, newNotif.body);
  };

  const handleUpdateTaskStatus = (
    taskId: string,
    status: 'in_progress' | 'done',
    timestamp: string,
    signatureImage?: string | null,
    locationGPS?: { lat: number; lng: number } | null,
  ) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        if (status === 'in_progress') {
          return { ...t, status, startedAt: timestamp };
        } else if (status === 'done') {
          return {
            ...t,
            status,
            completedAt: timestamp,
            signatureImage: signatureImage || null,
            locationGPS: locationGPS || null,
          };
        }
      }
      return t;
    });
    handleUpdateTasks(updated);

    // Automatically notify admins and assigned workers about progress
    const updatedTask = updated.find((t) => t.id === taskId);
    if (updatedTask) {
      const statusText = status === 'in_progress' ? 'بدء العمل الميداني على' : 'إنجاز وإتمام';
      
      let targetUids: string[] = [];
      if (status === 'done') {
        // Task completion notification goes to management only (admin, supervisor, general_manager)
        targetUids = users
          .filter((u) => u.uid !== currentUser?.uid && (u.role === 'admin' || u.subRole === 'supervisor' || u.subRole === 'general_manager'))
          .map((u) => u.uid);
      } else {
        // Work-start notification goes to management + other workers assigned to this task (excluding current user)
        const managementUids = users
          .filter((u) => u.uid !== currentUser?.uid && (u.role === 'admin' || u.subRole === 'supervisor' || u.subRole === 'general_manager'))
          .map((u) => u.uid);
        const assignedOtherUids = updatedTask.assignedToUids?.filter((uid) => uid !== currentUser?.uid) || [];
        targetUids = Array.from(new Set([...managementUids, ...assignedOtherUids]));
      }

      handleAddNotification({
        id: `notif_sys_${Date.now()}`,
        title: `تحديث تشغيلي: ${statusText} المهمة`,
        body: `قام ${currentUser?.fullName.split(' ')[0]} للتو بتسجيل ${statusText} للمهمة: "${updatedTask.title}"`,
        targetType: targetUids.length > 0 ? 'specific' : 'all',
        targetUids: targetUids.length > 0 ? targetUids : null,
        readByUids: [],
        createdByUid: currentUser?.uid,
        createdAt: new Date().toISOString(),
      });
    }
  };

  // Mutators for StockTransfers
  const handleAddTransfer = async (t: StockTransfer) => {
    setTransfers((prev) => [t, ...prev]);
    await saveTransferToFirestore(t);
  };
  const handleUpdateTransfer = async (t: StockTransfer) => {
    setTransfers((prev) => prev.map((item) => (item.id === t.id ? t : item)));
    await saveTransferToFirestore(t);
  };
  const handleDeleteTransfer = async (id: string) => {
    setTransfers((prev) => prev.filter((item) => item.id !== id));
    await deleteTransferFromFirestore(id);
  };

  // Mutators for ClientOrders
  const handleAddClientOrder = async (o: ClientOrder) => {
    setClientOrders((prev) => [o, ...prev]);
    await saveClientOrderToFirestore(o);
  };
  const handleUpdateClientOrder = async (o: ClientOrder) => {
    setClientOrders((prev) => prev.map((item) => (item.id === o.id ? o : item)));
    await saveClientOrderToFirestore(o);
  };
  const handleDeleteClientOrder = async (id: string) => {
    setClientOrders((prev) => prev.filter((item) => item.id !== id));
    await deleteClientOrderFromFirestore(id);
  };

  // Mutators for ClientDebts
  const handleAddClientDebt = async (d: ClientDebt) => {
    setClientDebts((prev) => [d, ...prev]);
    await saveClientDebtToFirestore(d);
  };
  const handleUpdateClientDebt = async (d: ClientDebt) => {
    setClientDebts((prev) => prev.map((item) => (item.id === d.id ? d : item)));
    await saveClientDebtToFirestore(d);
  };
  const handleDeleteClientDebt = async (id: string) => {
    setClientDebts((prev) => prev.filter((item) => item.id !== id));
    await deleteClientDebtFromFirestore(id);
  };

  // Mutators for CamionRoutes
  const handleAddCamionRoute = async (r: CamionRoute) => {
    setCamionRoutes((prev) => [r, ...prev]);
    await saveCamionRouteToFirestore(r);
  };
  const handleUpdateCamionRoute = async (r: CamionRoute) => {
    setCamionRoutes((prev) => prev.map((item) => (item.id === r.id ? r : item)));
    await saveCamionRouteToFirestore(r);
  };
  const handleDeleteCamionRoute = async (id: string) => {
    setCamionRoutes((prev) => prev.filter((item) => item.id !== id));
    await deleteCamionRouteFromFirestore(id);
  };

  // Mutators for SupplierAlerts
  const handleAddSupplierAlert = async (s: SupplierAlert) => {
    setSupplierAlerts((prev) => [s, ...prev]);
    await saveSupplierAlertToFirestore(s);
  };
  const handleUpdateSupplierAlert = async (s: SupplierAlert) => {
    setSupplierAlerts((prev) => prev.map((item) => (item.id === s.id ? s : item)));
    await saveSupplierAlertToFirestore(s);
  };
  const handleDeleteSupplierAlert = async (id: string) => {
    setSupplierAlerts((prev) => prev.filter((item) => item.id !== id));
    await deleteSupplierAlertFromFirestore(id);
  };

  if (isInitializing || !isUsersLoaded) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-fbm-blue flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Spinning ring */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-24 h-24 border-4 border-fbm-green/20 rounded-full" />
          <div className="absolute w-24 h-24 border-4 border-transparent border-t-[#76BC21] rounded-full animate-spin" />
          <div
            className="absolute w-16 h-16 border-2 border-transparent border-b-[#76BC21]/40 rounded-full animate-spin"
            style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
          />
        </div>
        <p className="text-slate-900 dark:text-white font-black text-xl tracking-widest">FBM</p>
        <p className="text-slate-500 text-[10px] mt-1 font-medium tracking-widest uppercase">LES FRÈRES BENAMAR · V1.1</p>
        <div className="mt-6 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-fbm-green hover:bg-fbm-green-hover text-white dark:text-fbm-blue rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-fbm-blue">
      <ToasterSetup />
      {currentUser === null ? (
        <SmartLogin users={users} onLogin={handleLoginSuccess} />
      ) : currentUser.role === 'worker' || adminViewMode === 'worker' ? (
        <WorkerDashboard
          currentUser={currentUser}
          users={users}
          categories={categories}
          tasks={tasks}
          expenses={expenses}
          notifications={notifications}
          attendance={attendance}
          chatMessages={chatMessages}
          onLogout={handleLogout}
          onAddExpense={handleAddExpense}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onUpdateNotifications={handleUpdateNotifications}
          onUpdateNotification={handleUpdateNotification}
          
          onUpdateAttendance={handleUpdateAttendance}
          onAddChatMessage={handleAddChatMessage}
          transfers={transfers}
          clientOrders={clientOrders}
          clientDebts={clientDebts}
          camionRoutes={camionRoutes}
          supplierAlerts={supplierAlerts}
          onAddTransfer={handleAddTransfer}
          onUpdateTransfer={handleUpdateTransfer}
          onDeleteTransfer={handleDeleteTransfer}
          onAddClientOrder={handleAddClientOrder}
          onUpdateClientOrder={handleUpdateClientOrder}
          onDeleteClientOrder={handleDeleteClientOrder}
          onAddClientDebt={handleAddClientDebt}
          onUpdateClientDebt={handleUpdateClientDebt}
          onDeleteClientDebt={handleDeleteClientDebt}
          onAddCamionRoute={handleAddCamionRoute}
          onUpdateCamionRoute={handleUpdateCamionRoute}
          onDeleteCamionRoute={handleDeleteCamionRoute}
          onAddSupplierAlert={handleAddSupplierAlert}
          onUpdateSupplierAlert={handleUpdateSupplierAlert}
          onDeleteSupplierAlert={handleDeleteSupplierAlert}
          isPrivileged={currentUser.role === 'admin' || currentUser.subRole === 'supervisor'}
          adminViewMode={adminViewMode}
          onToggleViewMode={() => setAdminViewMode((prev) => (prev === 'admin' ? 'worker' : 'admin'))}
          onToggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          onDeleteExpense={handleDeleteExpense}
          sectionsVisibility={sectionsVisibility}
        />
      ) : (
        <AdminDashboard
          currentUser={currentUser}
          users={users}
          categories={categories}
          tasks={tasks}
          expenses={expenses}
          notifications={notifications}
          attendance={attendance}
          chatMessages={chatMessages}
          transfers={transfers}
          clientOrders={clientOrders}
          clientDebts={clientDebts}
          camionRoutes={camionRoutes}
          supplierAlerts={supplierAlerts}
          onLogout={handleLogout}
          onUpdateExpenses={handleUpdateExpenses}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
          onUpdateTasks={handleUpdateTasks}
          onDeleteTask={handleDeleteTask}
          onUpdateCategories={handleUpdateCategories}
          onAddNotification={handleAddNotification}
          onUpdateNotifications={handleUpdateNotifications}
          onUpdateNotification={handleUpdateNotification}
          sectionsVisibility={sectionsVisibility}
          
          onUpdateUsers={handleUpdateUsers}
          onAddChatMessage={handleAddChatMessage}
          onAddTransfer={handleAddTransfer}
          onUpdateTransfer={handleUpdateTransfer}
          onDeleteTransfer={handleDeleteTransfer}
          onAddClientOrder={handleAddClientOrder}
          onUpdateClientOrder={handleUpdateClientOrder}
          onDeleteClientOrder={handleDeleteClientOrder}
          onAddClientDebt={handleAddClientDebt}
          onUpdateClientDebt={handleUpdateClientDebt}
          onDeleteClientDebt={handleDeleteClientDebt}
          onAddCamionRoute={handleAddCamionRoute}
          onUpdateCamionRoute={handleUpdateCamionRoute}
          onDeleteCamionRoute={handleDeleteCamionRoute}
          onAddSupplierAlert={handleAddSupplierAlert}
          onUpdateSupplierAlert={handleUpdateSupplierAlert}
          onDeleteSupplierAlert={handleDeleteSupplierAlert}
          onUpdateAttendance={handleUpdateAttendance}
          adminViewMode={adminViewMode}
          onToggleViewMode={() => setAdminViewMode((prev) => (prev === 'admin' ? 'worker' : 'admin'))}
          onToggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
        />
      )}

      {/* ── Premium iOS-style Heads-Up Toast Notification ── */}
      {activeToast && (
        <div
          className="fixed top-0 left-0 right-0 z-[9999] flex justify-center px-3 pt-2 safe-top notif-toast"
          dir="rtl"
        >
          <div className="w-full max-w-sm bg-white/97 dark:bg-fbm-blue-card/97 backdrop-blur-xl border border-fbm-green/20 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Top accent bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#76BC21] to-transparent" />

            <div className="flex items-start gap-3 p-3.5">
              {/* App Icon */}
              <div className="shrink-0 w-10 h-10 bg-fbm-green hover:bg-fbm-green-hover text-white dark:text-fbm-blue rounded-xl flex items-center justify-center shadow-lg shadow-[#76BC21]/30">
                <Bell className="w-5 h-5 text-zinc-950" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-[10px] font-black text-fbm-green uppercase tracking-wider">FBM ERP</p>
                  <button
                    onClick={() => setActiveToast(null)}
                    className="text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 -mr-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{activeToast.title}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5 line-clamp-2">{activeToast.body}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-slate-100 dark:bg-fbm-blue-card">
              <div className="bg-fbm-green hover:bg-fbm-green-hover text-white dark:text-fbm-blue h-full animate-toastProgress" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
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
  SupplierAlert
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
  deleteSupplierAlertFromFirestore
} from './firebase';
import SmartLogin from './components/SmartLogin';
import AdminDashboard from './components/AdminDashboard';
import WorkerDashboard from './components/WorkerDashboard';
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
  
  // New States for auto spare parts wholesale business operations
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [clientOrders, setClientOrders] = useState<ClientOrder[]>([]);
  const [clientDebts, setClientDebts] = useState<ClientDebt[]>([]);
  const [camionRoutes, setCamionRoutes] = useState<CamionRoute[]>([]);
  const [supplierAlerts, setSupplierAlerts] = useState<SupplierAlert[]>([]);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'worker'>('admin');

  // Audio and Toast Notification alerts
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());
  const isFirstNotificationsLoadRef = useRef(true);
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; body: string } | null>(null);

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

    const initAndSync = async () => {
      // Seed initial admin if needed
      await seedFirestoreIfNeeded();

      // Subscribe to real-time updates from Cloud Firestore
      unsubUsers = subscribeToCollection<AppUser>('users', (data) => {
        // Keep active users first, or sorted as needed
        setUsers(data);
      });
      unsubCategories = subscribeToCollection<CompanyCategory>('categories', setCategories);
      unsubTasks = subscribeToCollection<CompanyTask>('tasks', setTasks);
      unsubExpenses = subscribeToCollection<CompanyExpense>('expenses', setExpenses);
      unsubNotifications = subscribeToCollection<CompanyNotification>('notifications', setNotifications, 'createdAt');
      unsubAttendance = subscribeToCollection<AttendanceRecord>('attendance', setAttendance, 'clockInTime');
      unsubChat = subscribeToCollection<ChatMessage>('chat', (msgs) => {
        // Sort by oldest first so chat displays linearly
        const sorted = [...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setChatMessages(sorted);
      }, 'createdAt');

      // Real-time subscriptions for auto parts enterprise features
      unsubTransfers = subscribeToCollection<StockTransfer>('transfers', setTransfers, 'createdAt');
      unsubClientOrders = subscribeToCollection<ClientOrder>('client_orders', setClientOrders, 'createdAt');
      unsubClientDebts = subscribeToCollection<ClientDebt>('client_debts', setClientDebts, 'createdAt');
      unsubCamionRoutes = subscribeToCollection<CamionRoute>('camion_routes', setCamionRoutes);
      unsubSupplierAlerts = subscribeToCollection<SupplierAlert>('supplier_alerts', setSupplierAlerts, 'createdAt');

      // Keep login session stored locally for smooth UX
      const storedAuth = getStoredData<AppUser | null>('auth_user', null);
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
    };
  }, []);

  // Sync / monitor notifications to trigger real-time audio chime and high-visibility visual Toast
  useEffect(() => {
    if (notifications.length === 0) return;

    // On initial notifications load, just record the existing IDs and return (avoid chiming on old history)
    if (isFirstNotificationsLoadRef.current) {
      notifications.forEach(n => knownNotificationIdsRef.current.add(n.id));
      isFirstNotificationsLoadRef.current = false;
      return;
    }

    // Find new notifications
    const newNotifications = notifications.filter(n => !knownNotificationIdsRef.current.has(n.id));

    // Update the set of known IDs
    notifications.forEach(n => knownNotificationIdsRef.current.add(n.id));

    if (newNotifications.length === 0) return;

    // Check if any of these new ones target the logged in user
    if (!currentUser) return;

    const relevantNotification = newNotifications.find(n => {
      if (currentUser.role === 'admin') {
        return true; // Admins monitor all system updates/expenses
      } else {
        // Workers see broadcast (all) or target specifically to them
        return n.targetType === 'all' || n.targetUid === currentUser.uid;
      }
    });

    if (relevantNotification) {
      // Play a premium high-quality soft notification chime
      playNotificationChime();

      // Set active toast to display on top of the UI
      setActiveToast({
        id: relevantNotification.id,
        title: relevantNotification.title,
        body: relevantNotification.body
      });
    }
  }, [notifications, currentUser]);

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
          const alreadyAlerted = notifications.some(n => n.id === alertId);
          if (!alreadyAlerted) {
            const formattedDate = new Date(task.dueDate).toLocaleString('ar-DZ', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            handleAddNotification({
              id: alertId,
              title: 'تنبيه اقتراب الموعد النهائي ⚠️',
              body: `المهمة: "${task.title}" المكلف بها (${task.assignedToName}) يتبقى على موعدها النهائي أقل من 24 ساعة (الموعد: ${formattedDate}).`,
              targetType: 'all',
              isRead: false,
              createdAt: new Date().toISOString()
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
    setUsers(newUsers);
    
    // Save/update any new or modified users
    for (const u of newUsers) {
      await saveUserToFirestore(u);
    }
    
    // Delete any users removed from the list
    const removed = users.filter(curr => !newUsers.some(nu => nu.uid === curr.uid));
    for (const ru of removed) {
      await deleteUserFromFirestore(ru.uid);
    }
  };

  const handleUpdateCategories = async (newCategories: CompanyCategory[]) => {
    setCategories(newCategories);
    
    for (const c of newCategories) {
      await saveCategoryToFirestore(c);
    }
    
    const removed = categories.filter(curr => !newCategories.some(nc => nc.id === curr.id));
    for (const rc of removed) {
      await deleteCategoryFromFirestore(rc.id);
    }
  };

  const handleUpdateTasks = async (newTasks: CompanyTask[]) => {
    setTasks(newTasks);
    
    for (const t of newTasks) {
      await saveTaskToFirestore(t);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteTaskFromFirestore(id);
  };

  const handleUpdateExpenses = async (newExpenses: CompanyExpense[]) => {
    setExpenses(newExpenses);
    
    for (const e of newExpenses) {
      await saveExpenseToFirestore(e);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await deleteExpenseFromFirestore(id);
  };

  const handleUpdateNotifications = async (newNotifications: CompanyNotification[]) => {
    setNotifications(newNotifications);
    
    for (const n of newNotifications) {
      await saveNotificationToFirestore(n);
    }
    
    const removed = notifications.filter(curr => !newNotifications.some(nn => nn.id === curr.id));
    for (const rn of removed) {
      await deleteNotificationFromFirestore(rn.id);
    }
  };

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setStoredData('auth_user', user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStoredData('auth_user', null);
  };

  // State mutation actions passed down
  const handleUpdateAttendance = async (record: AttendanceRecord) => {
    setAttendance(prev => {
      const exists = prev.some(r => r.id === record.id);
      if (exists) {
        return prev.map(r => r.id === record.id ? record : r);
      } else {
        return [record, ...prev];
      }
    });
    await saveAttendanceToFirestore(record);
  };

  const handleAddChatMessage = async (msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg]);
    await saveChatToFirestore(msg);
  };

  const handleAddExpense = (newExpense: CompanyExpense) => {
    const updated = [newExpense, ...expenses];
    handleUpdateExpenses(updated);
  };

  // Helper to send real native device/PC push notifications (like Facebook)
  const sendNativeSystemNotification = (title: string, body: string) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body: body,
            icon: 'https://img.icons8.com/color/192/delivery.png',
            badge: 'https://img.icons8.com/color/192/delivery.png',
            vibrate: [200, 100, 200],
            tag: 'fbm-erp-notification'
          } as any).catch(() => {
            new Notification(title, { body, icon: 'https://img.icons8.com/color/192/delivery.png' });
          });
        });
      } else {
        new Notification(title, { body, icon: 'https://img.icons8.com/color/192/delivery.png' });
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
    locationGPS?: { lat: number; lng: number } | null
  ) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        if (status === 'in_progress') {
          return { ...t, status, startedAt: timestamp };
        } else if (status === 'done') {
          return { 
            ...t, 
            status, 
            completedAt: timestamp, 
            signatureImage: signatureImage || null, 
            locationGPS: locationGPS || null 
          };
        }
      }
      return t;
    });
    handleUpdateTasks(updated);

    // Automatically notify admins about progress
    const updatedTask = updated.find(t => t.id === taskId);
    if (updatedTask) {
      const statusText = status === 'in_progress' ? 'بدء العمل الميداني على' : 'إنجاز وإتمام';
      handleAddNotification({
        id: `notif_sys_${Date.now()}`,
        title: `تحديث تشغيلي: ${statusText} المهمة`,
        body: `الموظف ${currentUser?.fullName.split(' ')[0]} قام بتسجيل ${statusText} المهمة: "${updatedTask.title}"`,
        targetType: 'all',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  };

  // Mutators for StockTransfers
  const handleAddTransfer = async (t: StockTransfer) => {
    setTransfers(prev => [t, ...prev]);
    await saveTransferToFirestore(t);
  };
  const handleUpdateTransfer = async (t: StockTransfer) => {
    setTransfers(prev => prev.map(item => item.id === t.id ? t : item));
    await saveTransferToFirestore(t);
  };
  const handleDeleteTransfer = async (id: string) => {
    setTransfers(prev => prev.filter(item => item.id !== id));
    await deleteTransferFromFirestore(id);
  };

  // Mutators for ClientOrders
  const handleAddClientOrder = async (o: ClientOrder) => {
    setClientOrders(prev => [o, ...prev]);
    await saveClientOrderToFirestore(o);
  };
  const handleUpdateClientOrder = async (o: ClientOrder) => {
    setClientOrders(prev => prev.map(item => item.id === o.id ? o : item));
    await saveClientOrderToFirestore(o);
  };
  const handleDeleteClientOrder = async (id: string) => {
    setClientOrders(prev => prev.filter(item => item.id !== id));
    await deleteClientOrderFromFirestore(id);
  };

  // Mutators for ClientDebts
  const handleAddClientDebt = async (d: ClientDebt) => {
    setClientDebts(prev => [d, ...prev]);
    await saveClientDebtToFirestore(d);
  };
  const handleUpdateClientDebt = async (d: ClientDebt) => {
    setClientDebts(prev => prev.map(item => item.id === d.id ? d : item));
    await saveClientDebtToFirestore(d);
  };
  const handleDeleteClientDebt = async (id: string) => {
    setClientDebts(prev => prev.filter(item => item.id !== id));
    await deleteClientDebtFromFirestore(id);
  };

  // Mutators for CamionRoutes
  const handleAddCamionRoute = async (r: CamionRoute) => {
    setCamionRoutes(prev => [r, ...prev]);
    await saveCamionRouteToFirestore(r);
  };
  const handleUpdateCamionRoute = async (r: CamionRoute) => {
    setCamionRoutes(prev => prev.map(item => item.id === r.id ? r : item));
    await saveCamionRouteToFirestore(r);
  };
  const handleDeleteCamionRoute = async (id: string) => {
    setCamionRoutes(prev => prev.filter(item => item.id !== id));
    await deleteCamionRouteFromFirestore(id);
  };

  // Mutators for SupplierAlerts
  const handleAddSupplierAlert = async (s: SupplierAlert) => {
    setSupplierAlerts(prev => [s, ...prev]);
    await saveSupplierAlertToFirestore(s);
  };
  const handleUpdateSupplierAlert = async (s: SupplierAlert) => {
    setSupplierAlerts(prev => prev.map(item => item.id === s.id ? s : item));
    await saveSupplierAlertToFirestore(s);
  };
  const handleDeleteSupplierAlert = async (id: string) => {
    setSupplierAlerts(prev => prev.filter(item => item.id !== id));
    await deleteSupplierAlertFromFirestore(id);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#000839] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#76BC21] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs mt-4 font-bold tracking-wider">جاري تشغيل نظام بن عمر ERP...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000839]">
      {currentUser === null ? (
        <SmartLogin 
          users={users} 
          onLoginSuccess={handleLoginSuccess} 
        />
      ) : (currentUser.role === 'worker' || adminViewMode === 'worker') ? (
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
          onToggleViewMode={() => setAdminViewMode(prev => prev === 'admin' ? 'worker' : 'admin')}
          onDeleteExpense={handleDeleteExpense}
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
          onToggleViewMode={() => setAdminViewMode(prev => prev === 'admin' ? 'worker' : 'admin')}
        />
      )}

      {/* Floating Premium Toast Notification */}
      {activeToast && (
        <div 
          className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[9999] max-w-sm w-full bg-[#050E46]/95 backdrop-blur border border-slate-700/80 rounded-2xl shadow-2xl p-4 flex gap-3 text-right animate-slideIn"
          dir="rtl"
        >
          {/* Bell Icon & Glow */}
          <div className="shrink-0">
            <div className="w-10 h-10 bg-[#76BC21]/10 text-[#76BC21] rounded-xl flex items-center justify-center relative shadow-inner animate-pulse">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex justify-between items-start gap-2">
              <h4 className="text-xs font-black text-white">{activeToast.title}</h4>
              <button 
                onClick={() => setActiveToast(null)}
                className="text-slate-400 hover:text-white transition-all cursor-pointer p-0.5 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{activeToast.body}</p>
            
            {/* Visual Progress Bar Timer indicator */}
            <div className="pt-2">
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div className="bg-[#76BC21] h-full rounded-full animate-toastProgress"></div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

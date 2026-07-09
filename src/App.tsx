import { useState, useEffect } from 'react';
import { AppUser, CompanyCategory, CompanyTask, CompanyExpense, CompanyNotification } from './types';
import { getStoredData, setStoredData } from './data';
import { 
  seedFirestoreIfNeeded,
  subscribeToCollection,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  saveTaskToFirestore,
  saveExpenseToFirestore,
  saveNotificationToFirestore,
  deleteNotificationFromFirestore
} from './firebase';
import SmartLogin from './components/SmartLogin';
import AdminDashboard from './components/AdminDashboard';
import WorkerDashboard from './components/WorkerDashboard';

export default function App() {
  // Database states persisted in Cloud Firestore
  const [users, setUsers] = useState<AppUser[]>([]);
  const [categories, setCategories] = useState<CompanyCategory[]>([]);
  const [tasks, setTasks] = useState<CompanyTask[]>([]);
  const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
  const [notifications, setNotifications] = useState<CompanyNotification[]>([]);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    let unsubUsers = () => {};
    let unsubCategories = () => {};
    let unsubTasks = () => {};
    let unsubExpenses = () => {};
    let unsubNotifications = () => {};

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
    };
  }, []);

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

  const handleUpdateExpenses = async (newExpenses: CompanyExpense[]) => {
    setExpenses(newExpenses);
    
    for (const e of newExpenses) {
      await saveExpenseToFirestore(e);
    }
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

  const handleUpdateTaskStatus = (taskId: string, status: 'in_progress' | 'done', timestamp: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        if (status === 'in_progress') {
          return { ...t, status, startedAt: timestamp };
        } else if (status === 'done') {
          return { ...t, status, completedAt: timestamp };
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
      ) : currentUser.role === 'admin' ? (
        <AdminDashboard
          currentUser={currentUser}
          users={users}
          categories={categories}
          tasks={tasks}
          expenses={expenses}
          notifications={notifications}
          onLogout={handleLogout}
          onUpdateExpenses={handleUpdateExpenses}
          onUpdateTasks={handleUpdateTasks}
          onUpdateCategories={handleUpdateCategories}
          onAddNotification={handleAddNotification}
          onUpdateNotifications={handleUpdateNotifications}
          onUpdateUsers={handleUpdateUsers}
        />
      ) : (
        <WorkerDashboard
          currentUser={currentUser}
          users={users}
          categories={categories}
          tasks={tasks}
          expenses={expenses}
          notifications={notifications}
          onLogout={handleLogout}
          onAddExpense={handleAddExpense}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onUpdateNotifications={handleUpdateNotifications}
        />
      )}
    </div>
  );
}

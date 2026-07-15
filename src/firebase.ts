import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  AppUser,
  CompanyCategory,
  CompanyTask,
  CompanyExpense,
  CompanyNotification,
  AttendanceRecord,
  ChatMessage,
  SectionVisibility,
} from './types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCBoD-WuzL4ZoicKk4tFEU8khaYxy7Krlg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ben-amar-erp.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ben-amar-erp',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ben-amar-erp.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '446005687299',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:446005687299:web:6e942db6c53cf7376e4a36',
};

console.log('FIREBASE CONFIG:', firebaseConfig, 'DB ID:', import.meta.env.VITE_FIREBASE_DB_ID);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID and durable offline persistent local cache
export const auth = getAuth(app);
export const db = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  import.meta.env.VITE_FIREBASE_DB_ID || 'ai-studio-benamarenterpris-2e411b1f-045e-4b8e-a5fc-9161d68cf384',
);

// Collection Names
const COLL_USERS = 'users';
const COLL_CATEGORIES = 'categories';
const COLL_TASKS = 'tasks';
const COLL_EXPENSES = 'expenses';
const COLL_NOTIFICATIONS = 'notifications';
const COLL_ATTENDANCE = 'attendance';
const COLL_CHAT = 'chat';

// Admin Account Requested
export const ADMIN_USER: AppUser = {
  uid: 'admin_yacine',
  email: 'yacine@fbm.local',
  role: 'admin',
  fullName: 'YACINE',
  isActive: true,
};

// Clean undefined properties from Firestore payloads
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  const cleaned = Array.isArray(obj) ? [] : {};

  for (const key of Object.keys(obj as any)) {
    const value = (obj as any)[key];
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null) {
        (cleaned as any)[key] = cleanUndefined(value);
      } else {
        (cleaned as any)[key] = value;
      }
    }
  }
  return cleaned as T;
}

// Wrapper around setDoc that cleans undefined fields
async function setDocSafe(ref: any, data: any, options?: any) {
  const cleaned = cleanUndefined(data);
  if (options) {
    await setDoc(ref, cleaned, options);
  } else {
    await setDoc(ref, cleaned);
  }
}

// Initialize default data if firestore is empty
export async function seedFirestoreIfNeeded() {
  try {
    // Always guarantee admin user YACINE is present and active
    await setDocSafe(doc(db, COLL_USERS, ADMIN_USER.uid), ADMIN_USER, { merge: true });

    const catSnap = await getDocs(collection(db, COLL_CATEGORIES));
    if (catSnap.empty) {
      // Minimal categories without "experimental names" or with standard empty ones
      const initialCategories: CompanyCategory[] = [
        { id: 'cat_exp_1', name: 'وقود ونقل', type: 'expense' },
        { id: 'cat_exp_2', name: 'شراء بضاعة', type: 'expense' },
        { id: 'cat_exp_3', name: 'صيانة المعدات', type: 'expense' },
        { id: 'cat_task_1', name: 'عمليات ميدانية', type: 'task' },
        { id: 'cat_task_2', name: 'ترتيب المستودع', type: 'task' },
      ];
      for (const cat of initialCategories) {
        await setDocSafe(doc(db, COLL_CATEGORIES, cat.id), cat);
      }
    }

    // Seed stock transfers if empty
    const transferSnap = await getDocs(collection(db, COLL_TRANSFERS));
    if (transferSnap.empty) {
      const initialTransfers = [
        {
          id: 'tr_1',
          itemName: 'براطفورس / Pratforce',
          quantity: 50,
          fromLocation: 'المستودع الثاني',
          toLocation: 'المحل',
          movedByUid: 'worker_said',
          movedByName: 'العامل سعيد',
          isEnteredInSalesSystem: false,
          createdAt: new Date().toISOString(),
          status: 'pending',
        },
        {
          id: 'tr_2',
          itemName: 'ممتص صدمات خلفي / Shock Absorber',
          quantity: 20,
          fromLocation: 'المستودع الأول',
          toLocation: 'المحل',
          movedByUid: 'admin_yacine',
          movedByName: 'ياسين',
          isEnteredInSalesSystem: true,
          enteredByUid: 'admin_yacine',
          enteredByName: 'ياسين',
          enteredAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          status: 'verified',
        },
      ];
      for (const tr of initialTransfers) {
        await setDocSafe(doc(db, COLL_TRANSFERS, tr.id), tr);
      }
    }

    // Seed client orders if empty
    const orderSnap = await getDocs(collection(db, COLL_CLIENT_ORDERS));
    if (orderSnap.empty) {
      // Tuesday scheduled order
      const nextTuesday = new Date();
      nextTuesday.setDate(nextTuesday.getDate() + ((2 + 7 - nextTuesday.getDay()) % 7 || 7));
      const tuesdayStr = nextTuesday.toISOString().split('T')[0];

      const initialOrders = [
        {
          id: 'ord_1',
          clientName: 'علي للترقية (Ali)',
          bonNo: '00123/2026',
          deliveryDate: tuesdayStr,
          status: 'pending',
          items: '50 براطفورس، 10 ممتص صدمات، 30 تيل فرامل هندي',
          createdAt: new Date().toISOString(),
          notes: 'يرجى التنبيه وتجهيز الطلب قبل يوم الثلاثاء!',
        },
        {
          id: 'ord_2',
          clientName: 'محل الأخوة بوزريعة',
          bonNo: '00124/2026',
          deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
          status: 'preparing',
          items: '15 فلتر زيت، 10 طقم دبرياج صيني',
          createdAt: new Date().toISOString(),
          notes: 'الزبون مستعجل جداً',
        },
      ];
      for (const ord of initialOrders) {
        await setDocSafe(doc(db, COLL_CLIENT_ORDERS, ord.id), ord);
      }
    }

    // Seed client debts if empty
    const debtSnap = await getDocs(collection(db, COLL_CLIENT_DEBTS));
    if (debtSnap.empty) {
      const initialDebts = [
        {
          id: 'debt_1',
          clientName: 'أحمد البويرة',
          amount: 150000,
          dueDate: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], // 5 days overdue
          status: 'unpaid',
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
          notes: 'فاتورة قطع الغيار لشهر جوان - تأخر في السداد',
        },
        {
          id: 'debt_2',
          clientName: 'محل الرضا قسنطينة',
          amount: 85000,
          dueDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0], // 10 days in future
          status: 'unpaid',
          createdAt: new Date().toISOString(),
          notes: 'باقي بون طلبيات هندي',
        },
      ];
      for (const d of initialDebts) {
        await setDocSafe(doc(db, COLL_CLIENT_DEBTS, d.id), d);
      }
    }

    // Seed camion routes if empty
    const routeSnap = await getDocs(collection(db, COLL_CAMION_ROUTES));
    if (routeSnap.empty) {
      const initialRoutes = [
        {
          id: 'route_1',
          dayOfWeek: 'الأحد',
          routePath: 'البليدة - الجزائر العاصمة',
          driverName: 'عمي عيسى',
          clients: [
            {
              id: 'c_1',
              name: 'محل النور - البليدة',
              location: 'البليدة وسط',
              phone: '0550123456',
              calledStatus: 'not_called',
              notes: 'يأخذ طلبيات زيت وفلاتر',
            },
            {
              id: 'c_2',
              name: 'قطع غيار السلام - الحراش',
              location: 'الحراش',
              phone: '0661223344',
              calledStatus: 'order_taken',
              notes: 'تم أخذ الطلبية بنجاح',
            },
          ],
        },
        {
          id: 'route_2',
          dayOfWeek: 'الإثنين',
          routePath: 'المدية - عين بوسيف',
          driverName: 'عمي عيسى',
          clients: [
            {
              id: 'c_3',
              name: 'شاب شينوا - المدية',
              location: 'المدية وسط',
              phone: '0770987654',
              calledStatus: 'not_called',
              notes: 'يتطلب الاتصال الأحد مساءً',
            },
          ],
        },
        {
          id: 'route_3',
          dayOfWeek: 'الثلاثاء',
          routePath: 'بومرداس - رغاية',
          driverName: 'عمي عيسى',
          clients: [
            {
              id: 'c_4',
              name: 'محل الأخوة رغاية',
              location: 'رغاية',
              phone: '0555998877',
              calledStatus: 'called_no_answer',
              notes: 'إعادة الاتصال لتأكيد الطلب صباح الاثنين',
            },
          ],
        },
      ];
      for (const r of initialRoutes) {
        await setDocSafe(doc(db, COLL_CAMION_ROUTES, r.id), r);
      }
    }

    // Seed supplier alerts if empty
    const supplierSnap = await getDocs(collection(db, COLL_SUPPLIER_ALERTS));
    if (supplierSnap.empty) {
      const initialSuppliers = [
        {
          id: 'sup_1',
          supplierName: 'مستورد الشينوا الذهبي',
          type: 'merchandise_error',
          description: 'نقص 5 علب تيل فرامل في الحاوية الأخيرة المستلمة',
          isResolved: false,
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        },
        {
          id: 'sup_2',
          supplierName: 'قطع غيار الاتحاد (مستورد)',
          type: 'debt',
          description: 'تسديد دفعة فاتورة الاستيراد بقيمة 800,000 دج',
          isResolved: false,
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        },
      ];
      for (const s of initialSuppliers) {
        await setDocSafe(doc(db, COLL_SUPPLIER_ALERTS, s.id), s);
      }
    }

    // Seed section visibility if empty
    const settingsDocRef = doc(db, COLL_APP_SETTINGS, 'sections_visibility');
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      const defaultVisibility: SectionVisibility[] = [
        { id: 'expenses', name: 'المصاريف', workerState: 'active', supervisorState: 'active' },
        { id: 'tasks', name: 'المهام', workerState: 'active', supervisorState: 'active' },
        { id: 'transfers', name: 'التحويلات (السلع)', workerState: 'active', supervisorState: 'active' },
        { id: 'orders', name: 'الطلبيات والبونات', workerState: 'active', supervisorState: 'active' },
        { id: 'debts', name: 'الديون والمستحقات', workerState: 'hidden', supervisorState: 'active' },
        { id: 'camion', name: 'خطوط التوزيع والمسار', workerState: 'active', supervisorState: 'active' },
        { id: 'attendance', name: 'تسجيل الحضور', workerState: 'active', supervisorState: 'active' },
        { id: 'chat', name: 'دردشة الفريق', workerState: 'active', supervisorState: 'active' },
      ];
      await setDocSafe(settingsDocRef, { list: defaultVisibility });
    }
  } catch (error) {
    console.error('Error seeding firestore:', error);
  }
}

// Generic Firestore Sync Helpers
export function subscribeToCollection<T>(collectionName: string, onUpdate: (data: T[]) => void, sortField?: string) {
  let q = collection(db, collectionName);
  if (sortField) {
    q = query(q, orderBy(sortField, 'desc')) as any;
  }
  return onSnapshot(
    q,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as any);
      });
      onUpdate(items);
    },
    (error) => {
      console.error(`Error syncing collection ${collectionName}:`, error);
    },
  );
}

// Individual Set/Delete helpers to make syncing seamless
export async function saveUserToFirestore(user: AppUser) {
  const userDoc = doc(db, COLL_USERS, user.uid);
  await setDocSafe(userDoc, user, { merge: true });
}

export async function deleteUserFromFirestore(uid: string) {
  await deleteDoc(doc(db, COLL_USERS, uid));
}

export async function saveCategoryToFirestore(category: CompanyCategory) {
  await setDocSafe(doc(db, COLL_CATEGORIES, category.id), category, { merge: true });
}

export async function deleteCategoryFromFirestore(id: string) {
  await deleteDoc(doc(db, COLL_CATEGORIES, id));
}

export async function saveTaskToFirestore(task: CompanyTask) {
  await setDocSafe(doc(db, COLL_TASKS, task.id), task, { merge: true });
}

export async function deleteTaskFromFirestore(id: string) {
  await deleteDoc(doc(db, COLL_TASKS, id));
}

export async function saveExpenseToFirestore(expense: CompanyExpense) {
  await setDocSafe(doc(db, COLL_EXPENSES, expense.id), expense, { merge: true });
}

export async function deleteExpenseFromFirestore(id: string) {
  await deleteDoc(doc(db, COLL_EXPENSES, id));
}

export async function saveNotificationToFirestore(notification: CompanyNotification) {
  await setDocSafe(doc(db, COLL_NOTIFICATIONS, notification.id), notification, { merge: true });
}

export async function deleteNotificationFromFirestore(id: string) {
  await deleteDoc(doc(db, COLL_NOTIFICATIONS, id));
}

export async function saveAttendanceToFirestore(attendance: AttendanceRecord) {
  await setDocSafe(doc(db, COLL_ATTENDANCE, attendance.id), attendance, { merge: true });
}

export async function saveChatToFirestore(chat: ChatMessage) {
  await setDocSafe(doc(db, COLL_CHAT, chat.id), chat, { merge: true });
}

// Collections for specialized wholesale auto parts operations
export const COLL_TRANSFERS = 'transfers';
export const COLL_CLIENT_ORDERS = 'client_orders';
export const COLL_CLIENT_DEBTS = 'client_debts';
export const COLL_CAMION_ROUTES = 'camion_routes';
export const COLL_SUPPLIER_ALERTS = 'supplier_alerts';

export async function saveTransferToFirestore(transfer: any) {
  await setDocSafe(doc(db, COLL_TRANSFERS, transfer.id), transfer, { merge: true });
}

export async function deleteTransferFromFirestore(id: string) {
  await deleteDoc(doc(db, COLL_TRANSFERS, id));
}

export async function saveClientOrderToFirestore(order: any) {
  await setDocSafe(doc(db, COLL_CLIENT_ORDERS, order.id), order, { merge: true });
}

export async function deleteClientOrderFromFirestore(id: string) {
  await deleteDoc(doc(db, COLL_CLIENT_ORDERS, id));
}

export async function saveClientDebtToFirestore(debt: any) {
  await setDocSafe(doc(db, COLL_CLIENT_DEBTS, debt.id), debt, { merge: true });
}

export async function deleteClientDebtFromFirestore(id: string) {
  await deleteDoc(doc(db, COLL_CLIENT_DEBTS, id));
}

export async function saveCamionRouteToFirestore(route: any) {
  await setDocSafe(doc(db, COLL_CAMION_ROUTES, route.id), route, { merge: true });
}

export async function deleteCamionRouteFromFirestore(id: string) {
  await deleteDoc(doc(db, COLL_CAMION_ROUTES, id));
}

export async function saveSupplierAlertToFirestore(alert: any) {
  await setDocSafe(doc(db, COLL_SUPPLIER_ALERTS, alert.id), alert, { merge: true });
}

export async function deleteSupplierAlertFromFirestore(id: string) {
  await deleteDoc(doc(db, COLL_SUPPLIER_ALERTS, id));
}

// App Settings & Section Visibility
export const COLL_APP_SETTINGS = 'app_settings';

export async function saveSectionsVisibilityToFirestore(visibilityList: SectionVisibility[]) {
  const docRef = doc(db, COLL_APP_SETTINGS, 'sections_visibility');
  await setDocSafe(docRef, { list: visibilityList }, { merge: true });
}

export function subscribeToSectionsVisibility(onUpdate: (data: SectionVisibility[]) => void) {
  const docRef = doc(db, COLL_APP_SETTINGS, 'sections_visibility');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.list)) {
          onUpdate(data.list);
          return;
        }
      }
      onUpdate([]);
    },
    (error) => {
      console.error('Error syncing sections visibility:', error);
    }
  );
}


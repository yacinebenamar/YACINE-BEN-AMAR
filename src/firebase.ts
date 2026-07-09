import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { AppUser, CompanyCategory, CompanyTask, CompanyExpense, CompanyNotification } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyCBoD-WuzL4ZoicKk4tFEU8khaYxy7Krlg",
  authDomain: "ben-amar-erp.firebaseapp.com",
  projectId: "ben-amar-erp",
  storageBucket: "ben-amar-erp.firebasestorage.app",
  messagingSenderId: "446005687299",
  appId: "1:446005687299:web:6e942db6c53cf7376e4a36"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config
export const db = getFirestore(app, "ai-studio-benamarenterpris-2e411b1f-045e-4b8e-a5fc-9161d68cf384");

// Collection Names
const COLL_USERS = 'users';
const COLL_CATEGORIES = 'categories';
const COLL_TASKS = 'tasks';
const COLL_EXPENSES = 'expenses';
const COLL_NOTIFICATIONS = 'notifications';

// Admin Account Requested
export const ADMIN_USER: AppUser = {
  uid: 'admin_yacine',
  email: 'yacine@benamar.local',
  role: 'admin',
  fullName: 'YACINE',
  isActive: true,
  password: 'Benamor62'
};

// Initialize default data if firestore is empty
export async function seedFirestoreIfNeeded() {
  try {
    // Always guarantee admin user YACINE is present and active
    await setDoc(doc(db, COLL_USERS, ADMIN_USER.uid), ADMIN_USER, { merge: true });

    const catSnap = await getDocs(collection(db, COLL_CATEGORIES));
    if (catSnap.empty) {
      console.log('Seeding initial empty categories...');
      // Minimal categories without "experimental names" or with standard empty ones
      const initialCategories: CompanyCategory[] = [
        { id: 'cat_exp_1', name: 'وقود ونقل', type: 'expense' },
        { id: 'cat_exp_2', name: 'شراء بضاعة', type: 'expense' },
        { id: 'cat_exp_3', name: 'صيانة المعدات', type: 'expense' },
        { id: 'cat_task_1', name: 'عمليات ميدانية', type: 'task' },
        { id: 'cat_task_2', name: 'ترتيب المستودع', type: 'task' }
      ];
      for (const cat of initialCategories) {
        await setDoc(doc(db, COLL_CATEGORIES, cat.id), cat);
      }
    }
  } catch (error) {
    console.error('Error seeding firestore:', error);
  }
}

// Generic Firestore Sync Helpers
export function subscribeToCollection<T>(
  collectionName: string, 
  onUpdate: (data: T[]) => void,
  sortField?: string
) {
  let q = collection(db, collectionName);
  if (sortField) {
    q = query(q, orderBy(sortField, 'desc')) as any;
  }
  return onSnapshot(q, (snapshot) => {
    const items: T[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as any);
    });
    onUpdate(items);
  }, (error) => {
    console.error(`Error syncing collection ${collectionName}:`, error);
  });
}

// Individual Set/Delete helpers to make syncing seamless
export async function saveUserToFirestore(user: AppUser) {
  const userDoc = doc(db, COLL_USERS, user.uid);
  await setDoc(userDoc, user, { merge: true });
}

export async function deleteUserFromFirestore(uid: string) {
  await deleteDoc(doc(db, COLL_USERS, uid));
}

export async function saveCategoryToFirestore(category: CompanyCategory) {
  await setDoc(doc(db, COLL_CATEGORIES, category.id), category, { merge: true });
}

export async function deleteCategoryFromFirestore(id: string) {
  await deleteDoc(doc(db, COLL_CATEGORIES, id));
}

export async function saveTaskToFirestore(task: CompanyTask) {
  await setDoc(doc(db, COLL_TASKS, task.id), task, { merge: true });
}

export async function saveExpenseToFirestore(expense: CompanyExpense) {
  await setDoc(doc(db, COLL_EXPENSES, expense.id), expense, { merge: true });
}

export async function saveNotificationToFirestore(notification: CompanyNotification) {
  await setDoc(doc(db, COLL_NOTIFICATIONS, notification.id), notification, { merge: true });
}

export async function deleteNotificationFromFirestore(id: string) {
  await deleteDoc(doc(db, COLL_NOTIFICATIONS, id));
}

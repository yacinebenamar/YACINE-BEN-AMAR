import { AppUser, CompanyCategory, CompanyTask, CompanyExpense, CompanyNotification } from './types';

// Clear all default users so we only seed the active admin user on Firestore
export const DEFAULT_USERS: AppUser[] = [
  {
    uid: 'admin_yacine',
    email: 'yacine@benamar.local',
    role: 'admin',
    fullName: 'YACINE',
    isActive: true,
    password: 'Benamor62'
  }
];

export const DEFAULT_CATEGORIES: CompanyCategory[] = [
  { id: 'cat_exp_1', name: 'وقود ونقل', type: 'expense' },
  { id: 'cat_exp_2', name: 'شراء بضاعة', type: 'expense' },
  { id: 'cat_exp_3', name: 'صيانة المعدات', type: 'expense' },
  { id: 'cat_task_1', name: 'عمليات ميدانية', type: 'task' },
  { id: 'cat_task_2', name: 'ترتيب المستودع', type: 'task' }
];

export const DEFAULT_TASKS: CompanyTask[] = [];

export const DEFAULT_EXPENSES: CompanyExpense[] = [];

export const DEFAULT_NOTIFICATIONS: CompanyNotification[] = [];

// Local Storage Helper for session storage
const STORAGE_PREFIX = 'benamar_erp_';

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error loading stored data for key: ' + key, error);
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving stored data for key: ' + key, error);
  }
}

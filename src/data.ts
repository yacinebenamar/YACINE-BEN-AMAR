import { AppUser, CompanyCategory, CompanyTask, CompanyExpense, CompanyNotification } from './types';
import { Preferences } from '@capacitor/preferences';
import { safeStringify } from './utils/safeStringify';

// Clear all default users so we only seed the active admin user on Firestore
export const DEFAULT_USERS: AppUser[] = [
  {
    uid: 'admin_yacine',
    email: 'yacine@fbm.local',
    role: 'admin',
    fullName: 'YACINE',
    isActive: true,
  },
];

export const DEFAULT_CATEGORIES: CompanyCategory[] = [
  { id: 'cat_exp_1', name: 'وقود ونقل', type: 'expense' },
  { id: 'cat_exp_2', name: 'شراء بضاعة', type: 'expense' },
  { id: 'cat_exp_3', name: 'صيانة المعدات', type: 'expense' },
  { id: 'cat_task_1', name: 'عمليات ميدانية', type: 'task' },
  { id: 'cat_task_2', name: 'ترتيب المستودع', type: 'task' },
];

export const DEFAULT_TASKS: CompanyTask[] = [];

export const DEFAULT_EXPENSES: CompanyExpense[] = [];

export const DEFAULT_NOTIFICATIONS: CompanyNotification[] = [];

// Local Storage Helper for session storage
const STORAGE_PREFIX = 'benamar_erp_';

export async function getStoredData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_PREFIX + key });
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error('Error loading stored data for key: ' + key, error);
    return defaultValue;
  }
}

export async function setStoredData<T>(key: string, value: T): Promise<void> {
  try {
    await Preferences.set({
      key: STORAGE_PREFIX + key,
      value: safeStringify(value),
    });
  } catch (error) {
    console.error('Error saving stored data for key: ' + key, error);
  }
}

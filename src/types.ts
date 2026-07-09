export interface AppUser {
  uid: string;
  email: string;
  role: 'admin' | 'worker';
  fullName: string;
  isActive: boolean;
  password?: string;
}

export interface CompanyCategory {
  id: string;
  name: string;
  type: 'expense' | 'task';
}

export interface CompanyTask {
  id: string;
  title: string;
  description: string;
  categoryName: string;
  assignedToUid: string;
  assignedToName: string;
  status: 'pending' | 'in_progress' | 'done';
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface CompanyExpense {
  id: string;
  workerUid: string;
  workerName: string;
  amount: number;
  category: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  receiptImage?: string | null;
}

export interface CompanyNotification {
  id: string;
  title: string;
  body: string;
  targetType: 'all' | 'specific';
  targetUid?: string | null;
  isRead: boolean;
  createdAt: string;
}

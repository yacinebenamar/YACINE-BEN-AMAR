export interface AppUser {
  uid: string;
  email: string;
  role: 'admin' | 'worker';
  fullName: string;
  isActive: boolean;
  password?: string;
  subRole?: 'worker' | 'supervisor' | 'driver' | 'accountant' | string;
  departments?: string[];
  fcmToken?: string;
  permissions?: {
    canAccessAdminDashboard?: boolean;
    canViewAllExpenses?: boolean;
    canAuditExpenses?: boolean;
    canEditExpenses?: boolean;
    canApproveExpenses?: boolean;
    canViewFinancialReports?: boolean;
    canManageUsers?: boolean;
    canManageTasks?: boolean;
    canManageTransfers?: boolean;
    canManageOrders?: boolean;
    canManageDebts?: boolean;
    canManageCamion?: boolean;
    canManageAttendance?: boolean;
  };
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
  assignedToUids: string[];
  assignedToNames: string[];
  status: 'pending' | 'in_progress' | 'done';
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  signatureImage?: string | null;
  locationGPS?: { lat: number; lng: number } | null;
  archived?: boolean;
  archivedAt?: string | null;
  dueDate?: string | null;
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
  originalAmount?: number;
  auditedBy?: string;
  isAudited?: boolean;
  auditDate?: string;
}

export interface CompanyNotification {
  id: string;
  title: string;
  body: string;
  targetType: 'all' | 'specific';
  targetUids?: string[] | null;
  readByUids: string[];
  createdByUid?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  workerUid: string;
  workerName: string;
  clockInTime: string;
  clockOutTime: string | null;
  clockInGPS: { lat: number; lng: number } | null;
  clockOutGPS: { lat: number; lng: number } | null;
  selfieImage: string | null; // Base64 data URL simulated selfie/biometric scan
  date: string; // YYYY-MM-DD
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderRole: 'admin' | 'worker';
  text: string;
  createdAt: string;
}

export interface StockTransfer {
  id: string;
  itemName: string;
  partName: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  movedByUid: string;
  movedByName: string;
  carriedOutBy?: string;
  carriedOutAt?: string;
  isEnteredInSalesSystem: boolean; // GSA/PC System sync check
  isEnteredIntoPcSalesSystem?: boolean;
  enteredByUid?: string | null;
  enteredByName?: string | null;
  enteredByPc?: string | null;
  enteredByPcName?: string | null;
  enteredAt?: string | null;
  enteredAtPc?: string | null;
  createdAt: string;
  status: 'pending' | 'verified' | 'entered';
}

export interface ClientOrder {
  id: string;
  clientName: string;
  bonNo?: string;
  deliveryDate: string; // YYYY-MM-DD
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'prepared';
  items: string[]; // List of parts to prepare
  createdAt: string;
  notes?: string;
  assignedRouteId?: string;
}

export interface ClientDebt {
  id: string;
  clientName: string;
  amount?: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string; // YYYY-MM-DD
  status: 'unpaid' | 'paid' | 'overdue' | 'partial';
  createdAt: string;
  notes?: string;
}

export interface CamionRoute {
  id: string;
  dayOfWeek: string; // e.g. "الأحد", "الإثنين"
  routePath: string; // e.g. "البليدة - المدية"
  driverName: string;
  camionName?: string;
  date?: string;
  status?: 'planned' | 'in_progress' | 'completed';
  clientsToCall?: string[];
  createdAt?: string;
  clients: {
    id: string;
    name: string;
    location: string;
    phone?: string;
    calledStatus: 'not_called' | 'called_no_answer' | 'order_taken' | 'no_order';
    notes?: string;
  }[];
}

export interface SupplierAlert {
  id: string;
  supplierName: string;
  type: 'debt' | 'merchandise_error' | 'call_reason';
  description?: string;
  isResolved?: boolean;
  createdAt: string;
  dueDate?: string | null;
  severity?: 'critical' | 'warning' | 'info';
  partName?: string;
  qtyNeeded?: number;
  notes?: string;
  quantityIssue?: number;
}

export interface SectionVisibility {
  id: string;
  name: string;
  workerState: 'active' | 'hidden' | 'soon';
  supervisorState: 'active' | 'hidden' | 'soon';
}


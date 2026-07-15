import { toast } from 'react-hot-toast';

export interface OfflineOperation {
  id: string;
  actionType: string;
  payload: any;
  timestamp: number;
  description: string;
}

// Get the full queue from localStorage
export function getOfflineQueue(): OfflineOperation[] {
  try {
    const queue = localStorage.getItem('fbm_offline_queue');
    return queue ? JSON.parse(queue) : [];
  } catch (e) {
    console.error('Error reading offline queue:', e);
    return [];
  }
}

// Save the full queue to localStorage
export function saveOfflineQueue(queue: OfflineOperation[]) {
  try {
    localStorage.setItem('fbm_offline_queue', JSON.stringify(queue));
    // Dispatch a custom event to notify listeners (e.g., UI component)
    window.dispatchEvent(new Event('fbm_offline_queue_changed'));
  } catch (e) {
    console.error('Error saving offline queue:', e);
  }
}

// Generate an Arabic description based on operation type and payload
export function getOperationDescription(actionType: string, payload: any): string {
  switch (actionType) {
    case 'ADD_EXPENSE':
      return `إضافة مصروف بقيمة ${payload.amount || 0} دج (${payload.description || ''})`;
    case 'DELETE_EXPENSE':
      return `حذف مصروف`;
    case 'SAVE_TASK':
      return `إضافة/تعديل مهمة: "${payload.title || ''}"`;
    case 'DELETE_TASK':
      return `حذف مهمة`;
    case 'ADD_NOTIFICATION':
      return `إرسال إشعار: "${payload.title || ''}"`;
    case 'SAVE_ATTENDANCE':
      return `تسجيل حضور وانصراف للموظف`;
    case 'ADD_CHAT_MESSAGE':
      return `إرسال رسالة: "${payload.text || ''}"`;
    case 'ADD_TRANSFER':
      return `تحويل مخزني لـ: "${payload.itemName || ''}"`;
    case 'UPDATE_TRANSFER':
      return `تعديل تحويل لـ: "${payload.itemName || ''}"`;
    case 'DELETE_TRANSFER':
      return `حذف تحويل مخزني`;
    case 'ADD_CLIENT_ORDER':
      return `طلبية جديدة للزبون: "${payload.clientName || ''}"`;
    case 'UPDATE_CLIENT_ORDER':
      return `تعديل طلبية الزبون: "${payload.clientName || ''}"`;
    case 'DELETE_CLIENT_ORDER':
      return `حذف طلبية الزبون`;
    case 'ADD_CLIENT_DEBT':
      return `تسجيل دين على الزبون: "${payload.clientName || ''}"`;
    case 'UPDATE_CLIENT_DEBT':
      return `تعديل دين الزبون: "${payload.clientName || ''}"`;
    case 'DELETE_CLIENT_DEBT':
      return `حذف دين زبون`;
    case 'ADD_CAMION_ROUTE':
      return `إضافة خط سير للسائق: "${payload.driverName || ''}"`;
    case 'UPDATE_CAMION_ROUTE':
      return `تحديث خط سير السائق: "${payload.driverName || ''}"`;
    case 'DELETE_CAMION_ROUTE':
      return `حذف خط سير سائق`;
    case 'ADD_SUPPLIER_ALERT':
      return `تنبيه مورد: "${payload.supplierName || ''}"`;
    case 'UPDATE_SUPPLIER_ALERT':
      return `تعديل تنبيه مورد: "${payload.supplierName || ''}"`;
    case 'DELETE_SUPPLIER_ALERT':
      return `حذف تنبيه مورد`;
    case 'UPDATE_SECTIONS_VISIBILITY':
      return `تعديل صلاحيات رؤية الأقسام`;
    case 'UPDATE_USER':
      return `تعديل ملف الموظف: "${payload.fullName || ''}"`;
    case 'DELETE_USER':
      return `حذف موظف`;
    case 'SAVE_CATEGORY':
      return `إضافة/تعديل فئة: "${payload.name || ''}"`;
    case 'DELETE_CATEGORY':
      return `حذف فئة`;
    default:
      return `عملية تشغيلية (${actionType})`;
  }
}

// Add an operation to the offline queue
export function queueOfflineOperation(actionType: string, payload: any) {
  const queue = getOfflineQueue();
  const id = `${actionType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const description = getOperationDescription(actionType, payload);
  
  const newOp: OfflineOperation = {
    id,
    actionType,
    payload,
    timestamp: Date.now(),
    description
  };
  
  queue.push(newOp);
  saveOfflineQueue(queue);
  
  toast.success(`تم حفظ العملية محلياً مؤقتاً: ${description}`, {
    duration: 4000,
    icon: '💾'
  });
  
  return id;
}

// Sync all pending offline operations against Firebase/Firestore
export async function syncPendingOperations(apiMap: { [actionType: string]: (payload: any) => Promise<void> }): Promise<{ success: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };
  
  let successCount = 0;
  let failedCount = 0;
  const remainingQueue: OfflineOperation[] = [];
  
  toast.loading('جاري مزامنة العمليات المحفوظة غير المتصلة...', { id: 'fbm-syncing' });
  
  for (const op of queue) {
    const fn = apiMap[op.actionType];
    if (fn) {
      try {
        await fn(op.payload);
        successCount++;
      } catch (err) {
        console.error(`Failed to sync operation ${op.id} (${op.actionType}):`, err);
        failedCount++;
        // Keep in queue to retry later
        remainingQueue.push(op);
      }
    } else {
      console.warn(`No sync handler found for action type: ${op.actionType}`);
      successCount++; // Skip or count as processed
    }
  }
  
  saveOfflineQueue(remainingQueue);
  
  toast.dismiss('fbm-syncing');
  if (successCount > 0 && failedCount === 0) {
    toast.success(`تمت مزامنة جميع العمليات المعلقة بنجاح (${successCount} عمليات) 🎉`);
  } else if (successCount > 0 && failedCount > 0) {
    toast.success(`تمت مزامنة ${successCount} عمليات بنجاح، وفشلت ${failedCount} عمليات. ستتم إعادة المحاولة لاحقاً.`);
  } else if (failedCount > 0) {
    toast.error(`فشلت مزامنة ${failedCount} عمليات معلقة. يرجى التحقق من جودة الاتصال بالإنترنت.`);
  }
  
  return { success: successCount, failed: failedCount };
}

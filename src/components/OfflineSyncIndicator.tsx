import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, RefreshCw, Layers, Check, Trash2, X } from 'lucide-react';
import { getOfflineQueue, syncPendingOperations, saveOfflineQueue, OfflineOperation } from '../utils/offlineManager';

interface OfflineSyncIndicatorProps {
  apiMap: { [actionType: string]: (payload: any) => Promise<void> };
}

export default function OfflineSyncIndicator({ apiMap }: OfflineSyncIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<OfflineOperation[]>(getOfflineQueue());
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [lastState, setLastState] = useState<'online' | 'offline'>(navigator.onLine ? 'online' : 'offline');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (lastState === 'offline') {
        setShowNotification(true);
        setLastState('online');
        // Auto sync when back online
        handleSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (lastState === 'online') {
        setShowNotification(true);
        setLastState('offline');
      }
    };

    const handleQueueChanged = () => {
      setQueue(getOfflineQueue());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('fbm_offline_queue_changed', handleQueueChanged);

    // Initial load check
    setQueue(getOfflineQueue());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('fbm_offline_queue_changed', handleQueueChanged);
    };
  }, [lastState]);

  // Auto-hide the connection change notification banner after 5 seconds
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const handleSync = async () => {
    if (!navigator.onLine) {
      return;
    }
    setIsSyncing(true);
    await syncPendingOperations(apiMap);
    setQueue(getOfflineQueue());
    setIsSyncing(false);
  };

  const handleClearQueueItem = (id: string) => {
    const updated = queue.filter((item) => item.id !== id);
    saveOfflineQueue(updated);
    setQueue(updated);
  };

  const handleClearAllQueue = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح قائمة الانتظار بالكامل؟ سيتم فقدان هذه العمليات.')) {
      saveOfflineQueue([]);
      setQueue([]);
    }
  };

  return (
    <>
      {/* Floating Pill Connection Status on Top Right */}
      <div className="fixed top-4 left-4 md:left-24 z-[100] flex items-center gap-2" dir="rtl">
        <button
          onClick={() => {
            if (queue.length > 0) {
              setShowQueueModal(true);
            }
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black shadow-lg backdrop-blur-md border transition-all cursor-pointer ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse hover:bg-amber-500/20'
          }`}
        >
          {isOnline ? (
            <Wifi className="w-4 h-4 text-emerald-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-500" />
          )}
          <span>{isOnline ? 'متصل' : 'الوضع غير المتصل نشط'}</span>

          {queue.length > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-bounce">
              <Layers className="w-3 h-3" />
              {queue.length} معلقة
            </span>
          )}
        </button>
      </div>

      {/* Network State Notification Banner */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[101] w-[90%] max-w-md p-4 rounded-2xl shadow-xl border backdrop-blur-md flex items-center justify-between gap-3 text-right"
            dir="rtl"
            style={{
              backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.95)' : 'rgba(245, 158, 11, 0.95)',
              borderColor: isOnline ? '#059669' : '#d97706',
              color: '#ffffff',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
                {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
              <div>
                <h5 className="font-bold text-sm">
                  {isOnline ? 'تمت استعادة الاتصال بالإنترنت! ⚡' : 'انقطع الاتصال بالإنترنت ⚠️'}
                </h5>
                <p className="text-xs text-white/90 mt-0.5">
                  {isOnline
                    ? 'جاري مزامنة العمليات المعلقة واستعادة التحديثات المباشرة.'
                    : 'تم تفعيل الحفظ التلقائي محلياً لحماية بياناتك من الضياع.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-white hover:text-white/80 p-1 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Queue Modal */}
      <AnimatePresence>
        {showQueueModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQueueModal(false)}
              className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[999]"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-20 md:top-32 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-white dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-3xl overflow-hidden shadow-2xl z-[1000] text-right"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-fbm-blue-border bg-slate-50 dark:bg-fbm-blue-card">
                <div>
                  <h3 className="font-black text-base text-slate-950 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-fbm-green" />
                    العمليات المعلقة في وضع الأوفلاين 💾
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    العمليات المخزنة محلياً بانتظار إرسالها للخادم
                  </p>
                </div>
                <button
                  onClick={() => setShowQueueModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-fbm-blue flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Operations List */}
              <div className="max-h-80 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                {queue.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Check className="w-12 h-12 text-fbm-green mx-auto mb-2 opacity-55" />
                    <p className="font-bold text-sm">قائمة الانتظار فارغة!</p>
                    <p className="text-xs mt-1 text-slate-500">لا توجد عمليات بانتظار المزامنة.</p>
                  </div>
                ) : (
                  queue.map((op) => (
                    <div
                      key={op.id}
                      className="p-3.5 rounded-2xl border border-slate-100 dark:border-fbm-blue-border/40 bg-slate-50 dark:bg-fbm-blue-card/30 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-fbm-green/10 text-fbm-green">
                          {op.actionType}
                        </span>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {op.description}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(op.timestamp).toLocaleString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleClearQueueItem(op.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-1.5 rounded-xl transition-all cursor-pointer"
                        title="حذف هذه العملية"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 dark:border-fbm-blue-border bg-slate-50 dark:bg-fbm-blue-card flex items-center justify-between gap-3">
                {queue.length > 0 && (
                  <button
                    onClick={handleClearAllQueue}
                    className="px-4 py-2 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-500/10 cursor-pointer"
                  >
                    مسح الكل
                  </button>
                )}

                <div className="flex gap-2 mr-auto">
                  <button
                    onClick={() => setShowQueueModal(false)}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-fbm-blue-border cursor-pointer"
                  >
                    إغلاق
                  </button>

                  {queue.length > 0 && (
                    <button
                      onClick={handleSync}
                      disabled={!isOnline || isSyncing}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-zinc-950 bg-fbm-green hover:bg-fbm-green-hover transition-all cursor-pointer shadow-lg shadow-fbm-green/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{!isOnline ? 'مغلق (أوفلاين)' : isSyncing ? 'جاري المزامنة...' : 'مزامنة العمليات الآن'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

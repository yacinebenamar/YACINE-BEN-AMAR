import React, { useState, useRef, useEffect } from 'react';
import { CompanyNotification, AppUser } from '../types';
import {
  Bell,
  Check,
  Trash2,
  Inbox,
  Clock,
  X,
  ClipboardList,
  Receipt,
  CreditCard,
  Sparkles,
  AlertTriangle,
  Volume2,
  Search,
  Info,
  ChevronLeft,
} from 'lucide-react';
import { playNotificationChime } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationPopoverProps {
  notifications: CompanyNotification[];
  onUpdateNotifications: (newNotifications: CompanyNotification[]) => void;
  onUpdateNotification?: (notification: CompanyNotification) => Promise<void>;
  currentUser: AppUser;
  align?: 'left' | 'right';
}

type TabType = 'all' | 'unread' | 'urgent';

export default function NotificationPopover({
  notifications,
  onUpdateNotifications,
  onUpdateNotification,
  currentUser,
  align = 'left',
}: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTestSoundToast, setShowTestSoundToast] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Filter notifications for current user with 3-day auto-archive/hiding
  const threeDaysAgoMs = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const userNotifications = notifications.filter((n) => {
    // 1. Prevent self-notifications (whoever made the action shouldn't receive the alert)
    if (n.createdByUid === currentUser.uid) return false;

    // 2. Hide older than 3 days
    try {
      const notifTimeMs = new Date(n.createdAt).getTime();
      if (notifTimeMs < threeDaysAgoMs) return false;
    } catch (e) {}

    if (currentUser.role === 'admin') {
      // Admins see all notifications/logs
      return true;
    } else {
      // Workers see broadcast (all) or target specifically to them
      return n.targetType === 'all' || (n.targetUids && n.targetUids.includes(currentUser.uid));
    }
  });

  const unreadCount = userNotifications.filter((n) => !n.readByUids?.includes(currentUser.uid)).length;

  // Handle click outside to close popover (desktop only)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't close on click outside if we are in mobile view (handled via backdrop)
      if (window.innerWidth < 768) return;

      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = notifications.map((n) => {
      if (n.id === id) {
        return { ...n, readByUids: [...(n.readByUids || []), currentUser.uid] };
      }
      return n;
    });
    onUpdateNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => {
      const isVisible =
        currentUser.role === 'admin' ||
        n.targetType === 'all' ||
        (n.targetUids && n.targetUids.includes(currentUser.uid));
      if (isVisible) {
        return { ...n, readByUids: [...(n.readByUids || []), currentUser.uid] };
      }
      return n;
    });
    onUpdateNotifications(updated);
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    onUpdateNotifications(updated);
  };

  const handleTestSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    playNotificationChime();
    setShowTestSoundToast(true);
    setTimeout(() => {
      setShowTestSoundToast(false);
    }, 2200);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} د`;
      if (diffHours < 24) return `منذ ${diffHours} سا`;
      return date.toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  // Extract type, icon, and colors for notification mapping
  const getNotificationTypeInfo = (title: string, body: string) => {
    const text = (title + ' ' + body).toLowerCase();
    if (
      text.includes('مهمة') ||
      text.includes('عملية') ||
      text.includes('كلفك') ||
      text.includes('إسناد') ||
      text.includes('أرشفة')
    ) {
      return {
        icon: ClipboardList,
        colorClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
        glowClass: 'shadow-sky-500/5',
        badgeText: 'عملية ميدانية 📋',
      };
    }
    if (
      text.includes('مصروف') ||
      text.includes('فواتير') ||
      text.includes('فاتورة') ||
      text.includes('تم قبول') ||
      text.includes('تم رفض') ||
      text.includes('تقييد')
    ) {
      return {
        icon: Receipt,
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        glowClass: 'shadow-amber-500/5',
        badgeText: 'مصاريف مالية 💵',
      };
    }
    if (
      text.includes('دين') ||
      text.includes('ديون') ||
      text.includes('مستحق') ||
      text.includes('زبون') ||
      text.includes('الاستحقاق')
    ) {
      return {
        icon: CreditCard,
        colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        glowClass: 'shadow-rose-500/5',
        badgeText: 'دين / استحقاق 💳',
      };
    }
    if (text.includes('ترحيب') || text.includes('زميل') || text.includes('تهاني') || text.includes('مبارك')) {
      return {
        icon: Sparkles,
        colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        glowClass: 'shadow-purple-500/5',
        badgeText: 'ترحيب ونظام 🎉',
      };
    }
    if (
      text.includes('تنبيه') ||
      text.includes('ميعاد') ||
      text.includes('متبقي') ||
      text.includes('أقل من 24') ||
      text.includes('الموعد النهائي')
    ) {
      return {
        icon: AlertTriangle,
        colorClass: 'text-red-400 bg-red-500/10 border-red-500/20',
        glowClass: 'shadow-red-500/5',
        badgeText: 'موعد نهائي ⚠️',
      };
    }
    return {
      icon: Bell,
      colorClass: 'text-[#76BC21] bg-[#76BC21]/10 border-[#76BC21]/20',
      glowClass: 'shadow-[#76BC21]/5',
      badgeText: 'إشعار عام 🔔',
    };
  };

  // Perform active filtering & search
  const filteredNotifications = userNotifications.filter((notif) => {
    // 1. Tab filtering
    const isRead = notif.readByUids && notif.readByUids.includes(currentUser.uid);
    if (activeTab === 'unread' && isRead) return false;
    if (activeTab === 'urgent') {
      const text = (notif.title + ' ' + notif.body).toLowerCase();
      const isUrgent =
        text.includes('تنبيه') ||
        text.includes('طارئ') ||
        text.includes('عاجل') ||
        text.includes('أقل من 24') ||
        text.includes('دين') ||
        text.includes('الاستحقاق') ||
        text.includes('مرفوض') ||
        text.includes('مستحق');
      if (!isUrgent) return false;
    }

    // 2. Search query filtering
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const titleMatch = notif.title.toLowerCase().includes(query);
      const bodyMatch = notif.body.toLowerCase().includes(query);
      return titleMatch || bodyMatch;
    }

    return true;
  });

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl border transition-all relative cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-[#76BC21]/10 border-[#76BC21] text-[#76BC21] shadow-lg shadow-[#76BC21]/5'
            : 'bg-[#f8fafc] dark:bg-[#000839] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
        }`}
        id="notification-bell-btn"
        title="الإشعارات والتنبيهات"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />

        {/* Unread Indicator Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-white font-mono text-[10px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-[#000839] shadow-lg shadow-red-500/20 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating sound test local confirmation */}
      <AnimatePresence>
        {showTestSoundToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed md:absolute bottom-6 md:bottom-auto md:top-full md:mt-16 left-1/2 md:left-auto md:right-0 -translate-x-1/2 md:translate-x-0 bg-emerald-500 text-[#000839] text-xs font-bold px-3.5 py-2 rounded-xl shadow-xl z-50 flex items-center gap-1.5 border border-emerald-400 whitespace-nowrap"
          >
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>تم إطلاق رنين اختباري ناعم! 🔊</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER NOTIFICATION WRAPPER */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 1. MOBILE BACKDROP OVERLAY (Fixed screen on mobile, absolute popup on desktop) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 md:hidden"
            />

            {/* 2. THE DRAWER (Mobile) / POPOVER (Desktop) CONTAINER */}
            <motion.div
              // Responsive animation styles
              initial={
                window.innerWidth < 768
                  ? { x: align === 'left' ? '-100%' : '100%', opacity: 0.9 }
                  : { opacity: 0, y: 15, scale: 0.95 }
              }
              animate={window.innerWidth < 768 ? { x: 0, opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={
                window.innerWidth < 768
                  ? { x: align === 'left' ? '-100%' : '100%', opacity: 0.9 }
                  : { opacity: 0, y: 15, scale: 0.95 }
              }
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`
                fixed inset-y-0 z-50 w-[88vw] max-w-sm bg-white dark:bg-[#050E46] border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden
                md:absolute md:inset-y-auto md:top-full md:mt-3 md:w-100 md:max-w-md md:rounded-2xl md:border md:shadow-2xl
                ${
                  align === 'left'
                    ? 'left-0 border-r md:left-auto md:right-0 md:border md:origin-top-right'
                    : 'right-0 border-l md:right-auto md:left-0 md:border md:origin-top-left'
                }
              `}
              dir="rtl"
            >
              {/* Header section with Actions */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-[#f8fafc]/60 dark:bg-[#000839]/60 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#76BC21] shadow shadow-[#76BC21]/50"></span>
                    الإشعارات والتنبيهات
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-red-500/10">
                      {unreadCount} جديد
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Test speaker button */}
                  <button
                    onClick={handleTestSound}
                    className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800/60 hover:bg-[#76BC21]/15 text-slate-500 dark:text-slate-400 hover:text-[#76BC21] transition-all cursor-pointer"
                    title="تجربة رنين الإشعار"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  {/* Close button (Highly visible on mobile, toggle action) */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800/60 hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-400 transition-all cursor-pointer md:hidden"
                    title="إغلاق القائمة"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Utility Action Bar (Mark all read & test speaker) */}
              <div className="px-4 py-2.5 bg-[#f8fafc]/30 dark:bg-[#000839]/30 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs shrink-0">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className={`font-bold flex items-center gap-1 transition-all ${
                    unreadCount > 0
                      ? 'text-[#76BC21] hover:text-[#62a118] cursor-pointer'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>قراءة كافة الإشعارات</span>
                </button>

                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-500" />
                  <span>مزامنة مباشرة مع السحابة</span>
                </div>
              </div>

              {/* Search Bar - High end feeling */}
              <div className="p-3 bg-[#f8fafc]/20 dark:bg-[#000839]/20 border-b border-slate-200/40 dark:border-slate-800/40 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في الإشعارات والتنبيهات..."
                    className="w-full bg-[#f8fafc]/80 dark:bg-[#000839]/80 border border-slate-200/80 dark:border-slate-800/80 focus:border-[#76BC21]/60 focus:ring-1 focus:ring-[#76BC21]/30 rounded-xl pr-9 pl-3 py-1.5 text-xs text-right text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tab Navigation Menu */}
              <div className="px-3 pt-2 bg-[#f8fafc]/10 dark:bg-[#000839]/10 border-b border-slate-200/30 dark:border-slate-800/30 flex gap-1 shrink-0">
                {(['all', 'unread', 'urgent'] as TabType[]).map((tab) => {
                  const label = tab === 'all' ? 'الكل' : tab === 'unread' ? 'غير المقروءة' : 'تنبيهات طارئة ⚠️';
                  const count =
                    tab === 'all'
                      ? userNotifications.length
                      : tab === 'unread'
                        ? unreadCount
                        : userNotifications.filter((n) => {
                            const t = (n.title + ' ' + n.body).toLowerCase();
                            return (
                              t.includes('تنبيه') ||
                              t.includes('طارئ') ||
                              t.includes('عاجل') ||
                              t.includes('أقل من 24') ||
                              t.includes('دين') ||
                              t.includes('الاستحقاق')
                            );
                          }).length;

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 text-center text-xs font-bold transition-all border-b-2 cursor-pointer relative ${
                        activeTab === tab
                          ? 'border-[#76BC21] text-[#76BC21]'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{label}</span>
                        {count > 0 && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                              activeTab === tab ? 'bg-[#76BC21]/20 text-[#76BC21]' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Notifications List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 custom-scrollbar p-3 space-y-2">
                {filteredNotifications.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center px-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-3">
                      <Inbox className="w-6 h-6 text-slate-600" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">القائمة نظيفة وفارغة</p>
                    <p className="text-[10px] text-slate-500 mt-1.5 max-w-[240px] leading-relaxed">
                      {searchQuery
                        ? 'لم يتم العثور على أي تنبيهات تطابق كلمة البحث.'
                        : activeTab === 'unread'
                          ? 'لقد قمت بقراءة جميع التنبيهات الموجهة إليك.'
                          : activeTab === 'urgent'
                            ? 'لا توجد تنبيهات طارئة أو تواريخ استحقاق قريبة حالياً.'
                            : 'ستظهر هنا قرارات الإدارة والتقارير الميدانية فور صدورها.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notif) => {
                      const typeInfo = getNotificationTypeInfo(notif.title, notif.body);
                      const IconComponent = typeInfo.icon;
                      const isUnread = !notif.readByUids?.includes(currentUser.uid);

                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`group p-3 rounded-xl border transition-all cursor-pointer relative text-right flex gap-3 ${
                            isUnread
                              ? 'bg-[#f8fafc]/65 dark:bg-[#000839]/65 border-slate-300/80 dark:border-slate-700/80 shadow-md shadow-[#76BC21]/2'
                              : 'bg-slate-100/15 dark:bg-slate-900/15 hover:bg-slate-100/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60'
                          }`}
                        >
                          {/* Glowing vertical sidebar on unread */}
                          {isUnread && (
                            <span className="absolute inset-y-2 right-0 w-1 bg-[#76BC21] rounded-l-md"></span>
                          )}

                          {/* Beautiful Leftside Graphic Type Indicator */}
                          <div className="shrink-0 mt-0.5">
                            <div
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${typeInfo.colorClass} ${typeInfo.glowClass} shadow-lg`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Message details */}
                          <div className="flex-1 min-w-0 space-y-1 relative">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[9px] font-bold text-slate-500 tracking-tight">
                                {typeInfo.badgeText}
                              </span>

                              <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1 shrink-0 mt-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {formatTime(notif.createdAt)}
                              </span>
                            </div>

                            <h4
                              className={`text-xs leading-snug break-words ${
                                isUnread ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {notif.title}
                            </h4>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed break-words">{notif.body}</p>

                            {/* Footer panel inside each card */}
                            <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-200/30 dark:border-slate-800/30">
                              <span
                                className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full ${
                                  notif.targetType === 'all'
                                    ? 'bg-[#76BC21]/10 text-[#76BC21]'
                                    : 'bg-sky-500/10 text-sky-400'
                                }`}
                              >
                                {notif.targetType === 'all' ? 'بث عام' : 'موجه لك خصيصاً'}
                              </span>

                              {/* Action buttons on card hover */}
                              <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-all">
                                {isUnread && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                    className="text-[9px] font-bold text-[#76BC21] hover:underline cursor-pointer"
                                    title="تحديد كمقروء"
                                  >
                                    علامة مقروء
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleDeleteNotification(notif.id, e)}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                                  title="حذف التنبيه"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom footer drawer hint */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-[#f8fafc]/40 dark:bg-[#000839]/40 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
                <span>تنبيهات FBM الذكية v2.0</span>
                <span className="flex items-center gap-1">
                  <span>تم التحديث تلقائياً</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

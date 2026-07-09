import React, { useState, useRef, useEffect } from 'react';
import { CompanyNotification, AppUser } from '../types';
import { Bell, Check, Trash2, Inbox, Clock, X } from 'lucide-react';

interface NotificationPopoverProps {
  notifications: CompanyNotification[];
  onUpdateNotifications: (newNotifications: CompanyNotification[]) => void;
  currentUser: AppUser;
  align?: 'left' | 'right';
}

export default function NotificationPopover({
  notifications,
  onUpdateNotifications,
  currentUser,
  align = 'left'
}: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Filter notifications for current user
  const userNotifications = notifications.filter(n => {
    if (currentUser.role === 'admin') {
      // Admins see all notifications/logs
      return true;
    } else {
      // Workers see broadcast (all) or target specifically to them
      return n.targetType === 'all' || n.targetUid === currentUser.uid;
    }
  });

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  // Handle click outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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
    const updated = notifications.map(n => {
      if (n.id === id) {
        return { ...n, isRead: true };
      }
      return n;
    });
    onUpdateNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => {
      // Mark as read if it is visible to this user
      const isVisible = currentUser.role === 'admin' || n.targetType === 'all' || n.targetUid === currentUser.uid;
      if (isVisible) {
        return { ...n, isRead: true };
      }
      return n;
    });
    onUpdateNotifications(updated);
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    onUpdateNotifications(updated);
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

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl border transition-all relative cursor-pointer flex items-center justify-center ${
          isOpen 
            ? 'bg-[#76BC21]/10 border-[#76BC21] text-[#76BC21]' 
            : 'bg-[#000839] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
        }`}
        id="notification-bell-btn"
        title="الإشعارات والتنبيهات"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-white font-mono text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#000839] shadow-lg animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Menu Dropdown */}
      {isOpen && (
        <div 
          className={`absolute top-full mt-2.5 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-[#050E46] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden left-1/2 -translate-x-1/2 animate-fadeIn ${
            align === 'left' 
              ? 'sm:left-0 sm:right-auto sm:translate-x-0' 
              : 'sm:right-0 sm:left-auto sm:translate-x-0'
          }`}
          dir="rtl"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#000839]/40">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm">الإشعارات والتنبيهات</span>
              {unreadCount > 0 && (
                <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} جديد
                </span>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-[#76BC21] hover:text-[#62a118] font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>قراءة الكل</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 md:max-h-[400px] overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
            {userNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <Inbox className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 font-bold">لا توجد إشعارات حالياً</p>
                <p className="text-[10px] text-slate-500 mt-1">ستظهر هنا قرارات الإدارة والتقارير الميدانية فور صدورها.</p>
              </div>
            ) : (
              userNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className={`p-4 flex gap-3 transition-all cursor-pointer relative group text-right ${
                    !notif.isRead 
                      ? 'bg-[#76BC21]/5 border-r-4 border-[#76BC21]' 
                      : 'bg-transparent hover:bg-slate-900/40 border-r-4 border-transparent'
                  }`}
                >
                  {/* Notification Icon & Status */}
                  <div className="relative mt-0.5 shrink-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      !notif.isRead 
                        ? 'bg-[#76BC21]/10 text-[#76BC21]' 
                        : 'bg-slate-900 text-slate-500'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    {/* Glowing status circle */}
                    {!notif.isRead && (
                      <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#050E46]"></span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`text-xs leading-snug truncate ${
                        !notif.isRead ? 'font-black text-white' : 'font-bold text-slate-300'
                      }`}>
                        {notif.title}
                      </h4>
                      <span className="text-[9px] text-slate-500 shrink-0 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed break-words">
                      {notif.body}
                    </p>

                    <div className="flex justify-between items-center pt-1.5 opacity-80">
                      {/* Target Audience label */}
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                        notif.targetType === 'all' 
                          ? 'bg-[#76BC21]/10 text-[#76BC21]' 
                          : 'bg-sky-500/10 text-sky-400'
                      }`}>
                        {notif.targetType === 'all' ? 'بث عام' : 'موجه شخصي'}
                      </span>

                      {/* Small Quick Actions (Delete) */}
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        {!notif.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            className="text-[9px] font-bold text-[#76BC21] hover:underline cursor-pointer"
                            title="تحديد كمقروء"
                          >
                            ميز كمقروء
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteNotification(notif.id, e)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                          title="حذف التنبيه"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

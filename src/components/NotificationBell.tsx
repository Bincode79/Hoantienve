import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time?: string;
  isRead?: boolean;
}

interface NotificationBellProps {
  notifications: AppNotification[];
  onMarkAllAsRead?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onMarkAllAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 transition-colors rounded-full ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-gray-50'}`}
      >
        <Bell size={22} className={unreadCount > 0 ? 'animate-pulse' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">Thông báo</h3>
              {unreadCount > 0 && onMarkAllAsRead && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-[11px] text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1"
                >
                  <Check size={12} /> Đánh dấu đã đọc
                </button>
              )}
            </div>
            
            <div className="max-h-[360px] overflow-y-auto overscroll-contain">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <Bell size={20} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium">Bạn chưa có thông báo nào</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 transition-colors hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-0.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            <Info size={16} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] ${!notification.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                            {notification.title}
                          </p>
                          <p className="text-[12px] text-gray-600 mt-0.5 leading-snug">
                            {notification.message}
                          </p>
                          {notification.time && (
                            <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                              {notification.time}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
              <button className="text-[12px] font-bold text-gray-500 hover:text-gray-800 w-full py-1.5 transition-colors">
                Xem tất cả thông báo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { NotificationBell } from '../NotificationBell';

interface GreetingBannerProps {
  currentTime: Date;
  displayName: string;
  isAdmin: boolean;
  notificationCount: number;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const GreetingBanner: React.FC<GreetingBannerProps> = ({
  currentTime,
  displayName,
  isAdmin,
  notificationCount,
  isDarkMode,
  toggleDarkMode
}) => {
  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="container-safe py-2 flex flex-col sm:flex-row items-center justify-between text-[11px] md:text-[13px] gap-2 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
          <span className="text-gray-600 font-semibold">
            {new Intl.DateTimeFormat('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(currentTime)}
          </span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="text-red-500 font-bold">Xin chào, {displayName} ({isAdmin ? 'Q.Trị' : 'Đại lý'})</span>
        </div>
        <div className="flex items-center gap-4">
           <NotificationBell unreadCount={notificationCount} onClick={() => { }} />
           <button onClick={toggleDarkMode} className="text-gray-500 hover:text-orange-500 transition-colors bg-gray-100 p-1.5 rounded-full">
             {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
           </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  LayoutDashboard, Users, TicketCheck, ShieldCheck, Database, 
  Settings, User as UserIcon, LogOut, Menu, X 
} from 'lucide-react';
import { cn } from '../../utils';

interface AppNavbarProps {
  isAdmin: boolean;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  displayName: string;
  signOut: () => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  isAdmin,
  activeTab,
  setActiveTab,
  isMenuOpen,
  setIsMenuOpen,
  displayName,
  signOut
}) => {
  return (
    <div className="w-full bg-[#113C85] shadow-md border-b-2 border-orange-500 sticky top-0 z-40">
      <div className="container-safe flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }}
            className="min-w-[42px] h-[42px] px-4 flex items-center justify-center bg-gradient-to-b from-blue-300 to-[#113C85] border-r border-[#1a4a9c] flex-shrink-0"
          >
            <LayoutDashboard size={20} className="text-white" />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex text-[13px] font-bold text-white uppercase tracking-tight leading-none whitespace-nowrap">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={cn("h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c]", activeTab === 'dashboard' && "bg-[#0d2e66] text-amber-400")}
                >
                  <LayoutDashboard size={14} className="mr-1.5" /> Tổng quan
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={cn("h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c]", activeTab === 'users' && "bg-[#0d2e66] text-amber-400")}
                >
                  <Users size={14} className="mr-1.5" /> Người dùng
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={cn("h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c]", activeTab === 'requests' && "bg-[#0d2e66] text-amber-400")}
                >
                  <TicketCheck size={14} className="mr-1.5" /> Hoàn vé
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={cn("h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c]", activeTab === 'audit' && "bg-[#0d2e66] text-amber-400")}
                >
                  <ShieldCheck size={14} className="mr-1.5" /> Nhật ký Admin
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={cn("h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c]", activeTab === 'bookings' && "bg-[#0d2e66] text-amber-400")}
                >
                  <Database size={14} className="mr-1.5" /> Quản lý PNR
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={cn("h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c]", activeTab === 'dashboard' && "bg-[#0d2e66] text-amber-400")}
              >
                <TicketCheck size={14} className="mr-1.5" /> Quản lý hoàn vé
              </button>
            )}
            <button
              onClick={() => setActiveTab('settings')}
              className={cn("h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c]", activeTab === 'settings' && "bg-[#0d2e66] text-amber-400")}
            >
              <Settings size={14} className="mr-1.5" /> Cài đặt
            </button>
          </nav>
          
          {/* Mobile Navigation Title */}
          <div className="md:hidden px-3 text-white font-bold text-[13px] uppercase tracking-wide">
            {activeTab === 'dashboard' && 'Tổng quan'}
            {activeTab === 'users' && 'Người dùng'}
            {activeTab === 'requests' && 'Hoàn vé'}
            {activeTab === 'audit' && 'Nhật ký'}
            {activeTab === 'bookings' && 'PNR'}
            {activeTab === 'settings' && 'Cài đặt'}
          </div>
        </div>

        {/* User Info & Hamburger */}
        <div className="flex items-center h-[42px]">
          <div className="hidden sm:flex h-full items-center border-x border-[#1a4a9c]">
            <div className="px-3 flex items-center gap-2 text-amber-300">
              <UserIcon size={14} />
              <span className="text-white max-w-[80px] md:max-w-[120px] truncate">{displayName}</span>
            </div>
          </div>
          <button onClick={signOut} className="hidden sm:flex h-full px-4 hover:bg-red-700 bg-red-600 transition-colors items-center text-white gap-1.5 font-black uppercase text-[12px]">
            <LogOut size={14} /> Thoát
          </button>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden h-full px-4 flex items-center justify-center text-white bg-[#0d2e66] border-l border-[#1a4a9c]"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#0d2e66] border-t border-blue-800 overflow-hidden"
          >
            <div className="flex flex-col py-2">
              {isAdmin ? (
                <>
                  <button onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }} className={cn("px-6 py-3 text-left font-bold text-white border-b border-blue-900/50 flex items-center gap-2", activeTab === 'dashboard' && "text-amber-400 bg-blue-900")}>
                    <LayoutDashboard size={16} /> Tổng quan
                  </button>
                  <button onClick={() => { setActiveTab('users'); setIsMenuOpen(false); }} className={cn("px-6 py-3 text-left font-bold text-white border-b border-blue-900/50 flex items-center gap-2", activeTab === 'users' && "text-amber-400 bg-blue-900")}>
                    <Users size={16} /> Người dùng
                  </button>
                  <button onClick={() => { setActiveTab('requests'); setIsMenuOpen(false); }} className={cn("px-6 py-3 text-left font-bold text-white border-b border-blue-900/50 flex items-center gap-2", activeTab === 'requests' && "text-amber-400 bg-blue-900")}>
                    <TicketCheck size={16} /> Hoàn vé
                  </button>
                  <button onClick={() => { setActiveTab('audit'); setIsMenuOpen(false); }} className={cn("px-6 py-3 text-left font-bold text-white border-b border-blue-900/50 flex items-center gap-2", activeTab === 'audit' && "text-amber-400 bg-blue-900")}>
                    <ShieldCheck size={16} /> Nhật ký Admin
                  </button>
                  <button onClick={() => { setActiveTab('bookings'); setIsMenuOpen(false); }} className={cn("px-6 py-3 text-left font-bold text-white border-b border-blue-900/50 flex items-center gap-2", activeTab === 'bookings' && "text-amber-400 bg-blue-900")}>
                    <Database size={16} /> Quản lý PNR
                  </button>
                </>
              ) : (
                <button onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }} className={cn("px-6 py-3 text-left font-bold text-white border-b border-blue-900/50 flex items-center gap-2", activeTab === 'dashboard' && "text-amber-400 bg-blue-900")}>
                  <TicketCheck size={16} /> Quản lý hoàn vé
                </button>
              )}
              <button onClick={() => { setActiveTab('settings'); setIsMenuOpen(false); }} className={cn("px-6 py-3 text-left font-bold text-white border-b border-blue-900/50 flex items-center gap-2", activeTab === 'settings' && "text-amber-400 bg-blue-900")}>
                <Settings size={16} /> Cài đặt
              </button>
              <button onClick={signOut} className="px-6 py-4 text-left font-bold text-red-400 flex items-center gap-2 mt-2">
                <LogOut size={16} /> Đăng xuất hệ thống
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

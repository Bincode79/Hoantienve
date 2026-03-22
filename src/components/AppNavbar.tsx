import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  LayoutDashboard, Users, TicketCheck, Database,
  ShieldCheck, Settings, LogOut, Menu, X,
  User as UserIcon, Bell
} from 'lucide-react';
import { cn } from '../utils';
import { capitalizeName } from '../utils';
import type { UserProfile } from '../types';

type TabType = 'dashboard' | 'users' | 'requests' | 'settings' | 'audit' | 'bookings';

interface AppNavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isAdmin: boolean;
  profile: UserProfile;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  onLogout: () => void;
}

const adminTabs: { key: TabType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'users', label: 'Người dùng', icon: Users },
  { key: 'requests', label: 'Quản lý hoàn vé', icon: TicketCheck },
  { key: 'audit', label: 'Nhật ký hệ thống', icon: ShieldCheck },
  { key: 'bookings', label: 'Dữ liệu PNR', icon: Database },
];

const userTabs: { key: TabType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: 'dashboard', label: 'Yêu cầu hoàn vé', icon: TicketCheck },
];

export const AppNavbar: React.FC<AppNavbarProps> = ({
  activeTab, setActiveTab, isAdmin, profile,
  isMenuOpen, setIsMenuOpen, onLogout
}) => {
  const tabs = isAdmin ? adminTabs : userTabs;

  return (
    <div className="w-full bg-[#005cad] shadow-lg sticky top-0 z-40 border-b border-white/10">
      <div className="container-premium flex items-center justify-between h-14">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center h-full">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative h-full px-6 flex items-center gap-2 font-display font-semibold text-[13px] uppercase tracking-wider transition-all duration-300",
                  "text-white/70 hover:text-white hover:bg-white/10",
                  isActive && "text-white bg-white/15"
                )}
              >
                <Icon size={16} className={cn("transition-transform duration-300", isActive && "scale-110")} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-accent-400"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile Navbar Title */}
        <div className="md:hidden flex items-center px-4 font-display font-bold text-white uppercase tracking-tight">
          Hàng không 365
        </div>

        {/* User Actions */}
        <div className="flex items-center h-full gap-2 px-4">
          <div className="hidden sm:flex items-center gap-3 px-4 border-l border-white/10 h-8">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-white/50 font-bold uppercase leading-none mb-1">
                {isAdmin ? 'Quản trị viên' : 'Đại lý'}
              </span>
              <span className="text-white font-bold text-sm leading-none">
                {capitalizeName(profile.displayName)}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/5">
              <UserIcon size={14} />
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="hidden sm:flex h-9 px-4 items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase rounded-lg transition-all active:scale-95 shadow-md shadow-rose-900/20"
          >
            <LogOut size={14} />
            Thoát
          </button>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#004a8d] border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setIsMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-display font-semibold text-sm transition-all",
                      isActive ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
              <div className="pt-4 mt-4 border-t border-white/10 flex flex-col gap-2">
                <button
                  onClick={() => { setActiveTab('settings'); setIsMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-display font-semibold text-sm transition-all",
                    activeTab === 'settings' ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Settings size={18} />
                  Cài đặt tài khoản
                </button>
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-4 text-rose-300 font-bold">
                  <LogOut size={18} />
                  Đăng xuất hệ thống
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


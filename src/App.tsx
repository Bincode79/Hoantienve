import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  TicketCheck,
  Database,
  ShieldCheck,
  Ticket,
  MessageCircle,
  Shield,
  LogOut,
  Settings,
  Sun,
  Moon,
  User as UserIcon,
  PhoneCall,
  Mail,
  Clock
} from 'lucide-react';

// Hooks
import { useAuth } from './features/auth/useAuth';
import { useDashboardData } from './hooks/useDashboardData';

// Components
import { LoadingSpinner } from './components/LoadingSpinner';
import { NotificationBell } from './components/NotificationBell';
import { LoginForm } from './features/auth/LoginForm';
import { RegisterForm } from './features/auth/RegisterForm';
import { AuthLayout } from './features/auth/AuthLayout';
import { UserDashboard } from './features/user/UserDashboard';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { UserManagement } from './features/admin/components/UserManagement';
import { RefundRequestManagement } from './features/admin/components/RefundRequestManagement';
import { AuditLogView } from './features/admin/components/AuditLogView';
import { AdminBookingManagement } from './features/admin/components/AdminBookingManagement';
import { ProfileSettings } from './features/shared/components/ProfileSettings';
import { AbayHomePage } from './features/public/AbayHomePage';

// Utils & Types
import { cn } from './utils';

export default function App() {
  const { user, profile, loading, isLoading: authIsLoading, loginError, loginSuccess, login, register, logout: signOut } = useAuth();
  const {
    requests,
    allRequests,
    users,
    auditLogs,
    bookingCodes,
    messages,
    conversations,
    isLoading: dataLoading
  } = useDashboardData(profile);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'requests' | 'settings' | 'audit' | 'bookings'>('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const refreshDbStats = useCallback(() => {
    const collections = ['users', 'refundRequests', 'basedata', 'chats', 'adminAuditLog'];
    const newStats: Record<string, number> = {};
    collections.forEach(col => {
      try {
        const data = JSON.parse(localStorage.getItem('col_' + col) || '[]');
        newStats[col] = Array.isArray(data) ? data.length : 0;
      } catch { newStats[col] = 0; }
    });
    try {
      const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      newStats['mockUsers'] = Array.isArray(mockUsers) ? mockUsers.length : 0;
    } catch { newStats['mockUsers'] = 0; }
    setDbStats(newStats);
  }, []);

  useEffect(() => {
    if (profile?.role === 'admin') refreshDbStats();
  }, [profile, allRequests, users, refreshDbStats]);

  const handleResetCollection = (type: string) => {
    if (type === 'all') {
      const keysToRemove = ['col_users', 'col_refundRequests', 'col_basedata', 'col_chats', 'col_adminAuditLog', 'mockUsers', 'mockUser'];
      keysToRemove.forEach(k => localStorage.removeItem(k));
      window.location.reload();
    } else if (type === 'mockUsers') {
      const admins = [
        { uid: 'admin_123', email: 'admin@aerorefund.com', password: 'Matkhau1', displayName: 'Admin' },
        { uid: 'admin_0968686868', email: 'hotro@aerorefund.com', password: 'Admin123', displayName: 'Admin 0968686868' },
        { uid: 'user_0356812812', email: 'nguyenvana@aerorefund.com', password: '0356812812', displayName: 'Nguyễn Văn A', phoneNumber: '0356812812' },
      ];
      localStorage.setItem('mockUsers', JSON.stringify(admins));
      localStorage.removeItem('col_users');
      localStorage.removeItem('mockUser');
      window.location.reload();
    } else {
      localStorage.removeItem('col_' + type);
      refreshDbStats();
    }
  };

  const dbCollections = useMemo(() => [
    { key: 'users', label: 'Hồ sơ người dùng', icon: <UserIcon size={16} className="text-blue-600" /> },
    { key: 'mockUsers', label: 'Tài khoản đăng nhập', icon: <Shield size={16} className="text-violet-600" /> },
    { key: 'refundRequests', label: 'Yêu cầu hoàn vé', icon: <TicketCheck size={16} className="text-amber-600" /> },
    { key: 'basedata', label: 'Mã đặt chỗ (PNR)', icon: <Ticket size={16} className="text-emerald-600" /> },
    { key: 'chats', label: 'Tin nhắn chat', icon: <MessageCircle size={16} className="text-sky-600" /> },
    { key: 'adminAuditLog', label: 'Nhật ký Admin', icon: <ShieldCheck size={16} className="text-rose-600" /> },
  ], []);

  const adminStats = useMemo(() => ({
    pendingCount: allRequests.filter(r => r.status === 'pending').length,
    processingCount: allRequests.filter(r => r.status === 'processing').length,
    completedCount: allRequests.filter(r => r.status === 'completed').length,
    userCount: users.length,
    recentRequests: allRequests.slice(0, 5)
  }), [allRequests, users]);

  if (loading) return <LoadingSpinner />;

  if (!user || !profile) {
    if (!showLogin) {
      return <AbayHomePage onLoginClick={() => setShowLogin(true)} />;
    }
    return (
      <AuthLayout
        title="Đăng Nhập Hội Viên "
        subtitle="Hệ thống quản lý đặt chỗ và hoàn tiền tự động 365"
      >
        <LoginForm
          onLogin={login}
          isLoading={authIsLoading}
          error={loginError}
          success={loginSuccess}
          onSwitchToRegister={() => {}}
        />
      </AuthLayout>
    );
  }

  const isAdmin = profile.role === 'admin';

  return (
    <div className="bg-[#f0f2f5] min-h-[100dvh] font-sans text-gray-800 antialiased selection:bg-orange-200">
      
      {/* Top Header - Sourced from AbayHomePage */}
      <div className="w-full max-w-[1020px] mx-auto px-4 py-3 flex justify-between items-center bg-transparent relative z-10">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black text-amber-500 italic tracking-tighter shadow-sm flex items-end">
            <span className="text-blue-900 text-5xl">365</span><span className="text-sm font-bold text-gray-600 no-italic ml-1 mb-1">.vn</span>
          </h1>
          <p className="text-xs text-orange-600 font-bold ml-1 mt-1 uppercase">HỆ THỐNG {isAdmin ? 'QUẢN TRỊ' : 'ĐẠI LÝ'} VÉ MÁY BAY</p>
        </div>
        
        <div className="flex items-center gap-2 text-right">
          <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-800">
             <PhoneCall size={24} strokeWidth={2} />
          </div>
          <div>
            <div className="text-sm text-gray-600 font-bold">Tổng đài hỗ trợ: <span className="text-xl font-black text-red-600 tracking-tight">1900 6091</span></div>
            <div className="text-xs text-gray-500 font-semibold bg-gray-200/50 px-2 py-0.5 mt-0.5 rounded italic">Giờ làm việc: 0h - 24h</div>
          </div>
        </div>
      </div>

      {/* Main Navigation Menu - Abay Style */}
      <div className="w-full bg-[#113C85] shadow-md border-b-2 border-orange-500 sticky top-0 z-40">
        <div className="w-full max-w-[1020px] mx-auto flex items-center overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('dashboard')} className="min-w-[42px] h-[42px] px-4 flex items-center justify-center bg-gradient-to-b from-blue-300 to-[#113C85] border-r border-[#1a4a9c] flex-shrink-0">
            <LayoutDashboard size={20} className="text-white" />
          </button>
          
          <nav className="flex-1 flex text-[13px] font-bold text-white uppercase tracking-tight leading-none whitespace-nowrap">
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
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={cn("h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c]", activeTab === 'dashboard' && "bg-[#0d2e66] text-amber-400")}
                >
                  <TicketCheck size={14} className="mr-1.5" /> Quản lý hoàn vé
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('settings')}
              className={cn("h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c]", activeTab === 'settings' && "bg-[#0d2e66] text-amber-400")}
            >
              <Settings size={14} className="mr-1.5" /> Cài đặt
            </button>
            
            <div className="h-[42px] flex items-center border-x border-[#1a4a9c] ml-auto">
              <div className="px-3 flex items-center gap-2 text-amber-300">
                <UserIcon size={14} />
                <span className="text-white max-w-[120px] truncate">{profile.displayName}</span>
              </div>
              <button onClick={signOut} className="h-full px-4 hover:bg-red-700 bg-red-600 transition-colors flex items-center text-white gap-1.5 font-black uppercase text-[12px]">
                <LogOut size={14} /> Thoát
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Greeting Banner */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="w-full max-w-[1020px] mx-auto py-2 flex items-center justify-between px-4 text-[13px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-semibold">{new Intl.DateTimeFormat('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(currentTime)}</span>
            <span className="text-gray-300">|</span>
            <span className="text-red-500 font-bold">Xin chào, {profile.displayName} ({isAdmin ? 'Quản trị viên' : 'Đại lý vé'})</span>
          </div>
          <div className="flex items-center gap-4">
             <NotificationBell count={isAdmin ? adminStats.pendingCount : requests.filter(r => r.status === 'processing').length} onClick={() => { }} />
             <button onClick={toggleDarkMode} className="text-gray-500 hover:text-orange-500 transition-colors">
               {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
             </button>
          </div>
        </div>
      </div>

      {/* Dynamic Content Area */}
      <main className="w-full max-w-[900px] mx-auto py-6 px-4 md:px-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              isAdmin ? (
                <AdminDashboard
                  stats={adminStats}
                  users={users}
                  dbStats={dbStats}
                  dbCollections={dbCollections}
                  handleResetCollection={handleResetCollection}
                />
              ) : (
                <UserDashboard requests={requests} profile={profile} />
              )
            )}

            {activeTab === 'users' && isAdmin && (
              <UserManagement
                users={users}
                allRequests={allRequests}
                profile={profile}
                isLoading={dataLoading}
              />
            )}

            {activeTab === 'requests' && isAdmin && (
              <RefundRequestManagement
                requests={allRequests}
                isLoading={dataLoading}
              />
            )}

            {activeTab === 'audit' && isAdmin && (
              <AuditLogView logs={auditLogs} />
            )}

            {activeTab === 'bookings' && isAdmin && (
              <AdminBookingManagement codes={bookingCodes} />
            )}

            {activeTab === 'settings' && (
              <ProfileSettings profile={profile} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Dark Blue Wide Footer - Abay Style */}
      <div className="w-full bg-[#113C85] border-t-4 border-[#FFAA00] py-8 mt-10 relative z-10 overflow-hidden">
        {/* Wave decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FFAA00] to-transparent"></div>
        </div>

        <div className="w-full max-w-[1020px] mx-auto px-4 md:px-0 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

            {/* Brand */}
            <div>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-2xl font-black text-amber-400 italic tracking-tighter">365</span>
                <span className="text-sm font-bold text-blue-300 no-italic mb-0.5">.vn</span>
              </div>
              <p className="text-[11px] text-blue-200 leading-relaxed">
                Hệ thống quản lý đại lý<br/>
                & hoàn vé máy bay tự động
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2">Liên hệ hỗ trợ</h4>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[11px] text-blue-200">
                  <PhoneCall size={12} className="text-amber-400 shrink-0" />
                  <span>Tổng đài: <span className="text-white font-bold">1900 6091</span></span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-blue-200">
                  <Mail size={12} className="text-amber-400 shrink-0" />
                  <span>hotro@aerorefund.com</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-blue-200">
                  <Clock size={12} className="text-amber-400 shrink-0" />
                  <span>Giờ làm việc: 0h - 24h</span>
                </div>
              </div>
            </div>

            {/* Policies */}
            <div>
              <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2">Chính sách</h4>
              <div className="flex flex-col gap-1">
                {['Điều khoản sử dụng', 'Chính sách bảo mật', 'Quy trình hoàn vé', 'Phí dịch vụ'].map(item => (
                  <div key={item} className="text-[11px] text-blue-200 cursor-pointer hover:text-amber-400 transition-colors">
                    {item}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Divider */}
          <div className="border-t border-blue-700 pt-3">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
              <div className="text-[10px] text-blue-300 text-center md:text-left leading-relaxed">
                © 2026 <span className="text-amber-400 font-bold">365.vn</span> — Hệ thống quản lý đại lý &amp; hoàn vé tự động.<br/>
                <span className="text-blue-400">Mọi hành vi sao chép, phát hành nội dung mà không có sự đồng ý đều bị nghiêm cấm.</span>
              </div>
              <div className="flex items-center gap-3">
                {['Facebook', 'Zalo', 'YouTube'].map(social => (
                  <div key={social} className="text-[10px] text-blue-300 bg-blue-800/50 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-700 hover:text-amber-400 transition-colors">
                    {social}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}


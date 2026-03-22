import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// Hooks
import { useAuth } from './features/auth/useAuth';
import { useDashboardData } from './hooks/useDashboardData';
import { useToast } from './components/Toast';

// Components
import { LoadingSpinner } from './components/LoadingSpinner';
import { LoginForm } from './features/auth/LoginForm';
import { AuthLayout } from './features/auth/AuthLayout';
import { UserDashboard } from './features/user/UserDashboard';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { UserManagement } from './features/admin/components/UserManagement';
import { RefundRequestManagement } from './features/admin/components/RefundRequestManagement';
import { AuditLogView } from './features/admin/components/AuditLogView';
import { AdminBookingManagement } from './features/admin/components/AdminBookingManagement';
import { ProfileSettings } from './features/shared/components/ProfileSettings';
import { AbayHomePage } from './features/public/AbayHomePage';

// Layout Components
import { AppHeader } from './components/layout/AppHeader';
import { AppNavbar } from './components/layout/AppNavbar';
import { GreetingBanner } from './components/layout/GreetingBanner';
import { AppFooter } from './components/layout/AppFooter';

// Utils & Types
import { db, collection, query, getDocs } from './mockFirebase';
import { User as UserIcon, Shield, TicketCheck, Ticket, MessageCircle, ShieldCheck, Settings } from 'lucide-react';

export default function App() {
  const { user, profile, loading, isLoading: authIsLoading, loginError, loginSuccess, login, logout: signOut } = useAuth();
  const {
    requests,
    allRequests,
    users,
    auditLogs,
    bookingCodes,
    isLoading: dataLoading
  } = useDashboardData(profile);
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'requests' | 'settings' | 'audit' | 'bookings'>('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  const [config, setConfig] = useState<any>({
    brandName: 'TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆV NAM',
    supportPhone: '1900 6091',
    supportEmail: 'hotro@aerorefund.com',
    workingHours: '0h - 24h',
    copyright: '© 2026 TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆT NAM. All Rights Reserved.'
  });
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

  const refreshDbStats = useCallback(async () => {
    const collections = ['users', 'refundRequests', 'basedata', 'chats', 'adminAuditLog'];
    const newStats: Record<string, number> = {};
    
    for (const col of collections) {
      try {
        const q = query(collection(db, col));
        const snapshot = await getDocs(q);
        newStats[col] = snapshot.size;
      } catch (err) {
        console.warn(`Error fetching stats for ${col}:`, err);
        newStats[col] = 0;
      }
    }
    
    setDbStats(newStats);

    try {
      const qConfig = query(collection(db, 'config'));
      const snapshot = await getDocs(qConfig);
      if (!snapshot.empty) {
        setConfig(snapshot.docs[0].data());
      }
    } catch { }
  }, []);

  useEffect(() => {
    refreshDbStats();
  }, [profile, allRequests, users, refreshDbStats]);

  const handleResetCollection = async (type: string) => {
    if (type === 'all') {
      const keysToRemove = ['mockUser', 'theme', 'aerorefund-auth-token', 'auth_user'];
      keysToRemove.forEach(k => localStorage.removeItem(k));
      success('Hệ thống', 'Đã xóa dữ liệu cục bộ. Hệ thống sẽ tải lại.');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      try {
        const q = query(collection(db, type));
        const snapshot = await getDocs(q);
        const { deleteDoc, doc } = await import('./mockFirebase');
        for (const d of snapshot.docs) {
          await deleteDoc(doc(db, type, d.id));
        }
        await refreshDbStats();
        success('Thành công', `Đã xóa bộ sưu tập ${type}`);
      } catch (err) {
        console.error('Reset error:', err);
        error('Lỗi', 'Không thể xóa dữ liệu Cloud.');
      }
    }
  };

  const handleExportDb = () => {
    const data: Record<string, any> = {};
    const keys = ['col_users', 'col_refundRequests', 'col_basedata', 'col_chats', 'col_adminAuditLog', 'mockUsers'];
    keys.forEach(k => {
      try {
        data[k] = JSON.parse(localStorage.getItem(k) || '[]');
      } catch { data[k] = []; }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aerorefund_db_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    success('Xuất dữ liệu', 'Đã tải xuống file sao lưu dữ liệu.');
  };

  const handleImportDb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        Object.entries(data).forEach(([key, val]) => {
          localStorage.setItem(key, JSON.stringify(val));
        });
        success('Import thành công', 'Hệ thống sẽ tải lại sau giây lát.');
        setTimeout(() => window.location.reload(), 2000);
      } catch (err) {
        error('Lỗi Import', 'Định dạng file không hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveConfig = async (newConfig: any) => {
    try {
      const { setDoc, doc, collection } = await import('./mockFirebase');
      await setDoc(doc(db, 'config', 'main'), newConfig, { merge: true });
      setConfig(newConfig);
      success('Thành công', 'Đã cập nhật cấu hình hệ thống.');
    } catch (err) {
      console.error('Save config error:', err);
      error('Lỗi', 'Không thể lưu cấu hình mới.');
    }
  };

  const handleSeedData = async () => {
    const pnrCodes = ['ABCXYZ', 'DEF123', 'VNA456', 'QWERTY', 'JET789'];
    const { addDoc, collection, serverTimestamp } = await import('./mockFirebase');
    
    try {
      for (const [index, code] of pnrCodes.entries()) {
        await addDoc(collection(db, 'refundRequests'), {
          userId: 'user_0356812812', 
          userSdt: '0356812812',
          userEmail: 'nguyenvana@aerorefund.com',
          bankName: 'Vietcombank',
          accountNumber: '123456789' + index,
          accountHolder: 'NGUYEN VAN A',
          amount: 1500000 + (index * 100000),
          orderCode: code,
          status: index === 0 ? 'pending' : (index === 1 ? 'processing' : 'completed'),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await refreshDbStats();
      success('Seed dữ liệu', 'Đã thêm dữ liệu mẫu vào Cloud Database!');
    } catch (err) {
      console.error('Seed error:', err);
      error('Lỗi Seed', 'Không thể khởi tạo dữ liệu mẫu.');
    }
  };

  const dbCollections = useMemo(() => [
    { key: 'users', label: 'Hồ sơ người dùng', icon: <UserIcon size={16} className="text-blue-600" /> },
    { key: 'mockUsers', label: 'Tài khoản đăng nhập', icon: <Shield size={16} className="text-violet-600" /> },
    { key: 'refundRequests', label: 'Yêu cầu hoàn vé', icon: <TicketCheck size={16} className="text-amber-600" /> },
    { key: 'basedata', label: 'Mã đặt chỗ (PNR)', icon: <Ticket size={16} className="text-emerald-600" /> },
    { key: 'chats', label: 'Tin nhắn chat', icon: <MessageCircle size={16} className="text-sky-600" /> },
    { key: 'adminAuditLog', label: 'Nhật ký Admin', icon: <ShieldCheck size={16} className="text-rose-600" /> },
    { key: 'config', label: 'Cấu hình hệ thống', icon: <Settings size={16} className="text-gray-600" /> },
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
        title="Đăng Nhập Hệ Thống"
        subtitle="Hệ thống hoàn tiền vé & tra cứu kết quả hàng không Việt Nam"
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
      
      <AppHeader isAdmin={isAdmin} config={config} />

      <AppNavbar 
        isAdmin={isAdmin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        displayName={profile.displayName}
        signOut={signOut}
      />

      <GreetingBanner 
        currentTime={currentTime}
        displayName={profile.displayName}
        isAdmin={isAdmin}
        notificationCount={isAdmin ? adminStats.pendingCount : requests.filter(r => r.status === 'processing').length}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

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
                  handleExportDb={handleExportDb}
                  handleImportDb={handleImportDb}
                  handleSeedData={handleSeedData}
                  config={config}
                  onUpdateConfig={refreshDbStats}
                  handleSaveConfig={handleSaveConfig}
                />
              ) : (
                <UserDashboard requests={requests} profile={profile} isDashboard={true} />
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
      
      <AppFooter config={config} />

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  auth, db, messaging 
} from './firebase';
import { 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getToken } from 'firebase/messaging';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  orderBy,
  Timestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users, 
  TicketCheck, 
  LogOut, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CreditCard, 
  User as UserIcon,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Settings,
  Plane,
  Ticket,
  Trash2,
  Info,
  Bell,
  BellOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type UserRole = 'admin' | 'user';
type RefundStatus = 'pending' | 'approved' | 'rejected' | 'completed';

interface UserProfile {
  uid: string;
  sdt: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: any;
  fcmToken?: string;
  notificationsEnabled?: boolean;
}

interface RefundRequest {
  id: string;
  userId: string;
  userSdt: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  orderCode: string;
  status: RefundStatus;
  createdAt: any;
  updatedAt: any;
  adminNote?: string;
  processingTime?: any;
}

// --- Components ---

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-stone-50">
    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) => {
  const variants = {
    primary: 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm',
    secondary: 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 shadow-sm',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
    ghost: 'bg-transparent text-stone-600 hover:bg-stone-100',
  };

  return (
    <button 
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden', className)}>
    {children}
  </div>
);

const Badge = ({ status }: { status: RefundStatus | 'active' | 'inactive' | UserRole }) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-sky-50 text-sky-700 border-sky-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-sky-50 text-sky-700 border-sky-200',
    inactive: 'bg-stone-100 text-stone-600 border-stone-200',
    admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    user: 'bg-stone-50 text-stone-700 border-stone-200',
  };

  const labels = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    completed: 'Hoàn tất',
    active: 'Hoạt động',
    inactive: 'Khóa',
    admin: 'Quản trị',
    user: 'Người dùng',
  };

  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold border', styles[status as keyof typeof styles])}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'requests' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data states
  const [allRequests, setAllRequests] = useState<RefundRequest[]>([]);
  const [myRequests, setMyRequests] = useState<RefundRequest[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Get or create profile
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            sdt: firebaseUser.phoneNumber || '',
            displayName: firebaseUser.displayName || 'Anonymous',
            role: firebaseUser.email === 'jacksaybin@gmail.com' ? 'admin' : 'user',
            status: 'active',
            createdAt: serverTimestamp(),
          };
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Listeners
  useEffect(() => {
    if (!profile) return;

    let unsubRequests: () => void;
    let unsubUsers: () => void;

    if (profile.role === 'admin') {
      // Admin: Listen to all requests
      const q = query(collection(db, 'refundRequests'), orderBy('createdAt', 'desc'));
      unsubRequests = onSnapshot(q, (snapshot) => {
        setAllRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RefundRequest)));
      });

      // Admin: Listen to all users
      const uq = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      unsubUsers = onSnapshot(uq, (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
      });
    } else {
      // User: Listen to own requests
      const q = query(
        collection(db, 'refundRequests'), 
        where('userId', '==', profile.uid),
        orderBy('createdAt', 'desc')
      );
      unsubRequests = onSnapshot(q, (snapshot) => {
        setMyRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RefundRequest)));
      });
    }

    return () => {
      unsubRequests?.();
      unsubUsers?.();
    };
  }, [profile]);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (user && messaging) {
      const requestPermission = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const token = await getToken(messaging, { 
              vapidKey: import.meta.env.VITE_FCM_VAPID_KEY
            });
            if (token) {
              await updateDoc(doc(db, 'users', user.uid), { fcmToken: token });
            }
          }
        } catch (error) {
          console.error('Error getting FCM token:', error);
        }
      };
      requestPermission();
    }
  }, [user]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setLoginError('Email hoặc mật khẩu không chính xác.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setLoginError('Phương thức đăng nhập Email/Mật khẩu chưa được bật. Vui lòng vào Firebase Console > Authentication > Sign-in method để bật Email/Password.');
      } else {
        setLoginError('Có lỗi xảy ra khi đăng nhập.');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError('Email không hợp lệ.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      // Profile creation is handled by the onAuthStateChanged listener
    } catch (error: any) {
      console.error('Register error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setLoginError('Email này đã được sử dụng.');
      } else if (error.code === 'auth/weak-password') {
        setLoginError('Mật khẩu quá yếu (tối thiểu 6 ký tự).');
      } else if (error.code === 'auth/invalid-email') {
        setLoginError('Email không hợp lệ.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setLoginError('Phương thức đăng ký Email/Mật khẩu chưa được bật. Vui lòng vào Firebase Console > Authentication > Sign-in method để bật Email/Password.');
      } else {
        setLoginError('Có lỗi xảy ra khi đăng ký.');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error: any) {
      console.error('Reset error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        setLoginError('Tính năng khôi phục mật khẩu chưa được bật. Vui lòng vào Firebase Console > Authentication > Sign-in method để bật Email/Password.');
      } else {
        setLoginError('Không thể gửi email khôi phục. Vui lòng kiểm tra lại email.');
      }
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) return <LoadingSpinner />;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-2">
            <div className="w-20 h-20 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-sky-200">
              <Plane className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">AeroRefund</h1>
            <p className="text-stone-500">Hệ thống hoàn vé máy bay nhanh chóng và minh bạch.</p>
          </div>

          <Card className="p-8 space-y-6">
            {loginError && (
              <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
                {loginError}
              </div>
            )}

            {authMode === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-stone-500 uppercase">Số điện thoại</label>
                  <input 
                    type="tel" 
                    required
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-stone-500 uppercase">Mật khẩu</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full py-3">Đăng nhập</Button>
                <div className="flex items-center justify-between text-xs font-medium">
                  <button type="button" onClick={() => setAuthMode('forgot')} className="text-sky-600 hover:underline">Quên mật khẩu?</button>
                  <button type="button" onClick={() => setAuthMode('register')} className="text-stone-500 hover:underline">Tạo tài khoản mới</button>
                </div>
              </form>
            )}

            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-stone-500 uppercase">Họ và tên</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-stone-500 uppercase">Số điện thoại</label>
                  <input 
                    type="tel" 
                    required
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-stone-500 uppercase">Mật khẩu</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full py-3">Đăng ký</Button>
                <button type="button" onClick={() => setAuthMode('login')} className="text-xs font-medium text-stone-500 hover:underline">Đã có tài khoản? Đăng nhập</button>
              </form>
            )}

            {authMode === 'forgot' && (
              <div className="space-y-4">
                {resetSent ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl text-sky-700 text-sm">
                      Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.
                    </div>
                    <Button onClick={() => { setAuthMode('login'); setResetSent(false); }} className="w-full">Quay lại đăng nhập</Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-bold text-stone-500 uppercase">Số điện thoại của bạn</label>
                      <input 
                        type="tel" 
                        required
                        className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full py-3">Gửi tin nhắn khôi phục</Button>
                    <button type="button" onClick={() => setAuthMode('login')} className="text-xs font-medium text-stone-500 hover:underline w-full">Quay lại đăng nhập</button>
                  </form>
                )}
              </div>
            )}

            <p className="text-xs text-stone-400">
              Bằng cách đăng nhập, bạn đồng ý với các điều khoản và chính sách của chúng tôi.
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-stone-300 transition-transform duration-300 lg:relative lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-900/20">
              <Plane className="text-white w-5 h-5" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">AeroRefund</span>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <SidebarItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            {profile?.role === 'admin' && (
              <>
                <SidebarItem 
                  icon={<Users size={20} />} 
                  label="Quản lý User" 
                  active={activeTab === 'users'} 
                  onClick={() => setActiveTab('users')} 
                />
                <SidebarItem 
                  icon={<Ticket size={20} />} 
                  label="Yêu cầu hoàn vé" 
                  active={activeTab === 'requests'} 
                  onClick={() => setActiveTab('requests')} 
                />
              </>
            )}
            <SidebarItem 
              icon={<Settings size={20} />} 
              label="Cài đặt tài khoản" 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
            />
          </nav>

          <div className="p-4 border-t border-stone-800">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700">
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-full h-full rounded-full" alt="Avatar" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{profile?.displayName}</p>
                <p className="text-xs text-stone-500 truncate capitalize">{profile?.role}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-stone-400 hover:text-white" onClick={handleLogout}>
              <LogOut size={18} />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-stone-500" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-lg font-semibold text-stone-900 capitalize">
              {activeTab === 'dashboard' ? 'Tổng quan chuyến bay' : 
               activeTab === 'users' ? 'Quản lý người dùng' : 
               activeTab === 'requests' ? 'Yêu cầu hoàn vé' : 
               'Cài đặt tài khoản'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-full text-xs font-medium text-stone-600">
              <Clock size={14} />
              {format(new Date(), 'dd/MM/yyyy')}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {profile?.role === 'admin' ? (
                  <AdminDashboard requests={allRequests} users={allUsers} />
                ) : (
                  <UserDashboard requests={myRequests} profile={profile!} />
                )}
              </motion.div>
            )}

            {activeTab === 'users' && profile?.role === 'admin' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <UserManagement users={allUsers} />
              </motion.div>
            )}

            {activeTab === 'requests' && profile?.role === 'admin' && (
              <motion.div 
                key="requests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <RefundRequestManagement requests={allRequests} />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ProfileSettings profile={profile!} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Sub-components ---

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
        active 
          ? "bg-sky-600 text-white" 
          : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

// --- User Components ---

function UserDashboard({ requests, profile }: { requests: RefundRequest[]; profile: UserProfile }) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Chào mừng, {profile.displayName}</h1>
          <p className="text-stone-500">Theo dõi và tạo yêu cầu hoàn tiền vé máy bay của bạn.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus size={20} />
          Tạo yêu cầu mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Tổng yêu cầu" value={requests.length} icon={<Ticket className="text-sky-600" />} />
        <StatCard label="Đang chờ xử lý" value={requests.filter(r => r.status === 'pending').length} icon={<Clock className="text-amber-600" />} />
        <StatCard label="Đã hoàn thành" value={requests.filter(r => r.status === 'approved').length} icon={<CheckCircle2 className="text-sky-600" />} />
      </div>

      <Card>
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-stone-900">Lịch sử yêu cầu</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Mã PNR</th>
                <th className="px-6 py-4 font-semibold">Ngân hàng nhận</th>
                <th className="px-6 py-4 font-semibold">Số tiền hoàn</th>
                <th className="px-6 py-4 font-semibold">Ngày yêu cầu</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">Chưa có yêu cầu nào.</td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-stone-900">{req.orderCode}</td>
                    <td className="px-6 py-4 text-stone-600">
                      <div className="flex flex-col">
                        <span className="font-medium">{req.bankName}</span>
                        <span className="text-xs text-stone-400">{req.accountNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-stone-900">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(req.amount)}
                    </td>
                    <td className="px-6 py-4 text-stone-500 text-sm">
                      {req.createdAt ? format(req.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Badge status={req.status} />
                        {req.adminNote && (
                          <span className="mt-1 text-[10px] text-stone-400 italic leading-tight max-w-[150px]">
                            {req.adminNote}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {isFormOpen && (
          <RefundRequestForm onClose={() => setIsFormOpen(false)} profile={profile} />
        )}
      </AnimatePresence>
    </div>
  );
}

function RefundRequestForm({ onClose, profile }: { onClose: () => void; profile: UserProfile }) {
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    amount: '',
    orderCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // Validate against basedata in Firestore
      const q = query(collection(db, 'basedata'), where('orderCode', '==', formData.orderCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Mã đặt chỗ (PNR) không tồn tại trong hệ thống. Vui lòng kiểm tra lại.');
        setIsSubmitting(false);
        return;
      }

      const baseData = querySnapshot.docs[0].data();
      if (baseData.status === 'refunded') {
        setError('Mã đặt chỗ này đã được hoàn tiền trước đó.');
        setIsSubmitting(false);
        return;
      }

      if (Number(formData.amount) > baseData.amount) {
        setError(`Số tiền yêu cầu vượt quá số tiền vé gốc (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baseData.amount)}).`);
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'refundRequests'), {
        userId: profile.uid,
        userEmail: profile.email,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountHolder: formData.accountHolder,
        amount: Number(formData.amount),
        orderCode: formData.orderCode,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <h3 className="text-xl font-bold text-stone-900">Yêu cầu hoàn vé máy bay</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex items-center gap-2">
              <XCircle size={14} />
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-stone-700">Ngân hàng nhận tiền hoàn</label>
              <input 
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                placeholder="Ví dụ: Vietcombank, Techcombank..."
                value={formData.bankName}
                onChange={e => setFormData({...formData, bankName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Số tài khoản</label>
                <input 
                  required
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  placeholder="Nhập số tài khoản"
                  value={formData.accountNumber}
                  onChange={e => setFormData({...formData, accountNumber: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Chủ tài khoản</label>
                <input 
                  required
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  placeholder="Tên in trên thẻ"
                  value={formData.accountHolder}
                  onChange={e => setFormData({...formData, accountHolder: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Số tiền (VND)</label>
                <input 
                  required
                  type="number"
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  placeholder="0"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Mã đặt chỗ (PNR)</label>
                <input 
                  required
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  placeholder="Ví dụ: ABCXYZ"
                  value={formData.orderCode}
                  onChange={e => setFormData({...formData, orderCode: e.target.value.toUpperCase()})}
                />
              </div>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Hủy</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu hoàn vé'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// --- Admin Components ---

function AdminDashboard({ requests, users }: { requests: RefundRequest[]; users: UserProfile[] }) {
  const [isSeeding, setIsSeeding] = useState(false);
  const stats = useMemo(() => ({
    totalAmount: requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0),
    pendingCount: requests.filter(r => r.status === 'pending').length,
    userCount: users.length,
    recentRequests: requests.slice(0, 5)
  }), [requests, users]);

  const handleSeedBaseData = async () => {
    setIsSeeding(true);
    try {
      const mockData = [
        { orderCode: 'ABCXYZ', amount: 2500000, passengerName: 'NGUYEN VAN A', flightNumber: 'VN123', status: 'valid' },
        { orderCode: 'DEF456', amount: 1800000, passengerName: 'TRAN THI B', flightNumber: 'VJ456', status: 'valid' },
        { orderCode: 'GHI789', amount: 3200000, passengerName: 'LE VAN C', flightNumber: 'QH789', status: 'valid' },
        { orderCode: 'JKL012', amount: 1500000, passengerName: 'PHAM THI D', flightNumber: 'VN456', status: 'refunded' }
      ];

      for (const item of mockData) {
        const q = query(collection(db, 'basedata'), where('orderCode', '==', item.orderCode));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          await addDoc(collection(db, 'basedata'), item);
        }
      }
      alert('Đã khởi tạo dữ liệu mẫu thành công!');
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Có lỗi xảy ra khi khởi tạo dữ liệu.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Quản trị hệ thống</h1>
        <Button 
          variant="secondary" 
          onClick={handleSeedBaseData} 
          disabled={isSeeding}
          className="text-xs py-2"
        >
          {isSeeding ? 'Đang khởi tạo...' : 'Khởi tạo dữ liệu mẫu (BaseData)'}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Tổng tiền đã hoàn" 
          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalAmount)} 
          icon={<CreditCard className="text-sky-600" />} 
        />
        <StatCard label="Yêu cầu chờ duyệt" value={stats.pendingCount} icon={<Clock className="text-amber-600" />} />
        <StatCard label="Tổng người dùng" value={stats.userCount} icon={<Users className="text-indigo-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-bold text-stone-900">Yêu cầu mới nhất</h3>
            <ChevronRight size={18} className="text-stone-400" />
          </div>
          <div className="divide-y divide-stone-100">
            {stats.recentRequests.length === 0 ? (
              <div className="p-8 text-center text-stone-400">Chưa có yêu cầu nào.</div>
            ) : (
              stats.recentRequests.map(req => (
                <div key={req.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
                      <Ticket size={20} className="text-stone-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900">{req.orderCode}</p>
                      <p className="text-xs text-stone-500">{req.userEmail}</p>
                    </div>
                  </div>
                  <Badge status={req.status} />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-bold text-stone-900">Người dùng mới</h3>
            <ChevronRight size={18} className="text-stone-400" />
          </div>
          <div className="divide-y divide-stone-100">
            {users.slice(0, 5).map(u => (
              <div key={u.uid} className="p-4 flex items-center justify-between hover:bg-stone-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200">
                    <UserIcon size={20} className="text-stone-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{u.displayName}</p>
                    <p className="text-xs text-stone-500">{u.email}</p>
                  </div>
                </div>
                <Badge status={u.role} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function UserManagement({ users }: { users: UserProfile[] }) {
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
    try {
      await updateDoc(doc(db, 'users', uid), data);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Không thể cập nhật thông tin người dùng.');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      // In a real app, you might also want to delete the user from Firebase Auth via a cloud function
      // For now, we just remove the Firestore document
      await updateDoc(doc(db, 'users', uid), { status: 'inactive' }); // Soft delete/Deactivate
      // Or hard delete: await deleteDoc(doc(db, 'users', uid));
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Không thể xóa người dùng.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-stone-900">Danh sách người dùng</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input 
              placeholder="Tìm kiếm user..." 
              className="pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Người dùng</th>
                <th className="px-6 py-4 font-semibold">Vai trò</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">Ngày đăng ký</th>
                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map(u => (
                <tr key={u.uid} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200 text-stone-400">
                        <UserIcon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{u.displayName}</p>
                        <p className="text-xs text-stone-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><Badge status={u.role} /></td>
                  <td className="px-6 py-4"><Badge status={u.status} /></td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {u.createdAt ? format(u.createdAt.toDate(), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingUser(u)}>Chỉnh sửa</Button>
                      <button 
                        onClick={() => setUserToDelete(u)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Xóa người dùng"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
              onClick={() => setEditingUser(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <h3 className="text-xl font-bold text-stone-900">Chỉnh sửa User</h3>
                <button onClick={() => setEditingUser(null)} className="text-stone-400 hover:text-stone-600"><X size={24} /></button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-stone-700">Vai trò</label>
                    <select 
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                      value={editingUser.role}
                      onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-stone-700">Trạng thái</label>
                    <select 
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                      value={editingUser.status}
                      onChange={e => setEditingUser({...editingUser, status: e.target.value as 'active' | 'inactive'})}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Tạm khóa</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setEditingUser(null)}>Hủy</Button>
                  <Button className="flex-1" onClick={() => handleUpdateUser(editingUser.uid, { role: editingUser.role, status: editingUser.status })}>Lưu thay đổi</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {userToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
              onClick={() => setUserToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Xác nhận xóa?</h3>
              <p className="text-stone-500 mb-6">
                Bạn có chắc chắn muốn xóa người dùng <span className="font-bold text-stone-900">{userToDelete.displayName}</span>? Hành động này sẽ chuyển trạng thái người dùng thành "Khóa".
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setUserToDelete(null)}>Hủy</Button>
                <Button variant="danger" className="flex-1" onClick={() => handleDeleteUser(userToDelete.uid)}>Xác nhận xóa</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RefundRequestManagement({ requests }: { requests: RefundRequest[] }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [filter, setFilter] = useState<RefundStatus | 'all'>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [pnrSearch, setPnrSearch] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'none'>('none');
  const [actionToConfirm, setActionToConfirm] = useState<{ id: string, status: RefundStatus } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);

  const handleBulkAction = async (status: 'approved' | 'rejected' | 'completed') => {
    const batch = writeBatch(db);
    selectedRequests.forEach(id => {
      const reqRef = doc(db, 'refundRequests', id);
      batch.update(reqRef, { status, processingTime: serverTimestamp() });
    });
    await batch.commit();
    setSelectedRequests([]);
    setNotes({});
  };

  const toggleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedRequests.includes(id)) {
      setSelectedRequests(selectedRequests.filter(r => r !== id));
    } else {
      setSelectedRequests([...selectedRequests, id]);
    }
  };

  const filteredRequests = useMemo(() => {
    let result = requests.filter(r => {
      const statusMatch = filter === 'all' || r.status === filter;
      const bankMatch = bankFilter === 'all' || r.bankName === bankFilter;
      const pnrMatch = pnrSearch === '' || r.orderCode.toLowerCase().includes(pnrSearch.toLowerCase());
      return statusMatch && bankMatch && pnrMatch;
    });

    if (sortOrder !== 'none') {
      result = [...result].sort((a, b) => {
        const timeA = a.processingTime?.toDate()?.getTime() || 0;
        const timeB = b.processingTime?.toDate()?.getTime() || 0;
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
    }
    return result;
  }, [requests, filter, bankFilter, pnrSearch, sortOrder]);

  const handleUpdateStatus = async (id: string, status: RefundStatus) => {
    try {
      const request = requests.find(r => r.id === id);
      if (!request) return;

      await updateDoc(doc(db, 'refundRequests', id), { 
        status, 
        adminNote: notes[id] || '',
        updatedAt: serverTimestamp(),
        processingTime: serverTimestamp()
      });

      // Send Notification
      const userDoc = await getDoc(doc(db, 'users', request.userId));
      const userData = userDoc.data() as UserProfile | undefined;

      if (userData?.fcmToken && userData.notificationsEnabled !== false) {
        let title = '';
        let body = '';

        if (status === 'approved') {
          title = 'Yêu cầu hoàn vé được duyệt';
          body = `Yêu cầu cho mã PNR ${request.orderCode} đã được duyệt. Số tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(request.amount)}`;
        } else if (status === 'rejected') {
          title = 'Yêu cầu hoàn vé bị từ chối';
          body = `Yêu cầu cho mã PNR ${request.orderCode} đã bị từ chối. Ghi chú: ${notes[id] || 'Không có'}`;
        } else if (status === 'completed') {
          title = 'Yêu cầu hoàn vé đã hoàn tất';
          body = `Yêu cầu cho mã PNR ${request.orderCode} đã được xử lý hoàn tất. Vui lòng kiểm tra tài khoản của bạn.`;
        }

        if (title && body) {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: userData.fcmToken,
              title,
              body
            })
          });
        }
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Không thể cập nhật trạng thái yêu cầu.');
    }
  };

  return (
    <Card>
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
              onClick={() => setSelectedRequest(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6"
            >
              <h3 className="text-xl font-bold text-stone-900 mb-4">Chi tiết yêu cầu hoàn vé</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-stone-500 uppercase">Mã PNR</p>
                    <p className="font-bold text-stone-900">{selectedRequest.orderCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase">Ngày tạo</p>
                    <p className="font-medium text-stone-900">{selectedRequest.createdAt ? format(selectedRequest.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Khách hàng</p>
                  <p className="font-medium text-stone-900">{selectedRequest.userEmail}</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-stone-500 uppercase">Thông tin nhận tiền</p>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Ngân hàng:</span>
                    <span className="font-medium">{selectedRequest.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Số tài khoản:</span>
                    <span className="font-medium">{selectedRequest.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Chủ tài khoản:</span>
                    <span className="font-medium uppercase">{selectedRequest.accountHolder}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Số tiền hoàn</p>
                  <p className="text-lg font-bold text-sky-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedRequest.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase">Ghi chú Admin</p>
                  <p className="text-stone-900">{selectedRequest.adminNote || 'Không có'}</p>
                </div>
              </div>
              <div className="mt-6">
                <Button variant="secondary" className="w-full" onClick={() => setSelectedRequest(null)}>Đóng</Button>
              </div>
            </motion.div>
          </div>
        )}
        {actionToConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
              onClick={() => setActionToConfirm(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info size={32} />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Xác nhận hành động?</h3>
              <p className="text-stone-500 mb-6">
                Bạn có chắc chắn muốn chuyển trạng thái yêu cầu sang <span className="font-bold text-stone-900 capitalize">{actionToConfirm.status}</span>?
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setActionToConfirm(null)}>Hủy</Button>
                <Button className="flex-1" onClick={() => {
                  handleUpdateStatus(actionToConfirm.id, actionToConfirm.status);
                  setActionToConfirm(null);
                }}>Xác nhận</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-bold text-stone-900">Danh sách yêu cầu hoàn vé máy bay</h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Tìm theo mã PNR..."
            value={pnrSearch}
            onChange={(e) => setPnrSearch(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-white outline-none focus:ring-1 focus:ring-sky-500 w-40"
          />
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-white outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">Tất cả ngân hàng</option>
            {uniqueBanks.map(bank => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-white outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="none">Sắp xếp theo ngày</option>
            <option value="newest">Mới nhất trước</option>
            <option value="oldest">Cũ nhất trước</option>
          </select>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chờ duyệt' },
            { id: 'approved', label: 'Đã duyệt' },
            { id: 'completed', label: 'Hoàn tất' },
            { id: 'rejected', label: 'Từ chối' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                filter === f.id 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        {selectedRequests.length > 0 && (
          <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
            <span className="text-sm font-medium">Đã chọn {selectedRequests.length} yêu cầu</span>
            <div className="flex gap-2">
              <button onClick={() => handleBulkAction('approved')} className="px-3 py-1 text-xs bg-sky-600 rounded">Duyệt</button>
              <button onClick={() => handleBulkAction('completed')} className="px-3 py-1 text-xs bg-emerald-600 rounded">Hoàn tất</button>
              <button onClick={() => handleBulkAction('rejected')} className="px-3 py-1 text-xs bg-rose-600 rounded">Từ chối</button>
            </div>
          </div>
        )}
        <table className="w-full text-left">
          <thead>
            <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">
                <input type="checkbox" checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0} onChange={toggleSelectAll} />
              </th>
              <th className="px-6 py-4 font-semibold">Mã PNR / Ngày đặt</th>
              <th className="px-6 py-4 font-semibold">Khách hàng</th>
              <th className="px-6 py-4 font-semibold">Thông tin nhận tiền</th>
              <th className="px-6 py-4 font-semibold">Số tiền hoàn</th>
              <th className="px-6 py-4 font-semibold">Ghi chú Admin</th>
              <th className="px-6 py-4 font-semibold">Thời gian xử lý</th>
              <th className="px-6 py-4 font-semibold">Trạng thái</th>
              <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredRequests.length > 0 ? (
              filteredRequests.map(req => (
            <tr 
                  key={req.id} 
                  className={cn("hover:bg-stone-50 transition-colors group/row cursor-pointer", selectedRequests.includes(req.id) && "bg-sky-50")}
                  onClick={() => setSelectedRequest(req)}
                >
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selectedRequests.includes(req.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(req.id); }} />
                  </td>
                  <td className="px-6 py-4 relative">
                    <div className="group/pnr inline-block">
                      <p className="text-sm font-bold text-stone-900 cursor-help flex items-center gap-1">
                        {req.orderCode}
                        <Info size={12} className="text-stone-400" />
                      </p>
                      <p className="text-xs text-stone-400">{req.createdAt ? format(req.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '-'}</p>
                      
                      {/* Tooltip */}
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 z-50 invisible group-hover/row:visible opacity-0 group-hover/row:opacity-100 transition-all duration-200 pointer-events-none">
                        <div className="bg-stone-900 text-white text-[11px] p-3 rounded-xl shadow-2xl w-56 border border-stone-700/50 backdrop-blur-md">
                          <div className="space-y-1.5">
                            <p className="font-bold text-sky-400 border-b border-stone-700/50 pb-1.5 mb-1.5 uppercase tracking-wider">Thông tin nhận tiền</p>
                            <div className="flex justify-between gap-2">
                              <span className="text-stone-400">Ngân hàng:</span>
                              <span className="font-medium text-right">{req.bankName}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-stone-400">Số tài khoản:</span>
                              <span className="font-medium text-right">{req.accountNumber}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-stone-400">Chủ tài khoản:</span>
                              <span className="font-medium text-right uppercase">{req.accountHolder}</span>
                            </div>
                          </div>
                          {/* Arrow */}
                          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-stone-900 rotate-45 border-l border-b border-stone-700/50"></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-600">{req.userEmail}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-stone-900">{req.bankName}</span>
                      <span className="text-xs text-stone-500">{req.accountNumber} - {req.accountHolder}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-stone-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(req.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <textarea 
                      className="w-full px-2 py-1 text-xs border border-stone-200 rounded focus:ring-1 focus:ring-sky-500 outline-none resize-y"
                      placeholder="Nhập ghi chú..."
                      value={notes[req.id] !== undefined ? notes[req.id] : (req.adminNote || '')}
                      onClick={(e) => e.stopPropagation()}
                      onChange={e => setNotes({...notes, [req.id]: e.target.value})}
                      disabled={req.status !== 'pending' && req.status !== 'approved'}
                      rows={1}
                    />
                  </td>
                  <td className="px-6 py-4 text-xs text-stone-500">
                    {req.processingTime ? format(req.processingTime.toDate(), 'dd/MM/yyyy HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-4"><Badge status={req.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {req.status === 'pending' && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionToConfirm({ id: req.id, status: 'approved' });
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Duyệt"
                          >
                            <CheckCircle2 size={16} />
                            <span className="text-xs font-medium">Duyệt</span>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionToConfirm({ id: req.id, status: 'completed' });
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Hoàn tất"
                          >
                            <ShieldCheck size={16} />
                            <span className="text-xs font-medium">Hoàn tất</span>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionToConfirm({ id: req.id, status: 'rejected' });
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Từ chối"
                          >
                            <XCircle size={16} />
                            <span className="text-xs font-medium">Từ chối</span>
                          </button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionToConfirm({ id: req.id, status: 'completed' });
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Hoàn tất"
                        >
                          <ShieldCheck size={16} />
                          <span className="text-xs font-medium">Hoàn tất</span>
                        </button>
                      )}
                      {(req.status === 'completed' || req.status === 'rejected') && (
                        <span className="text-xs text-stone-400 italic">Đã xử lý</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-stone-400 italic">
                  Không có yêu cầu nào trong danh sách này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center border border-stone-100">
          {icon}
        </div>
      </div>
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <h3 className="text-2xl font-bold text-stone-900 mt-1">{value}</h3>
    </Card>
  );
}

function ProfileSettings({ profile }: { profile: UserProfile }) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile.notificationsEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        displayName,
        notificationsEnabled,
        updatedAt: serverTimestamp()
      });
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (error) {
      console.error('Update profile error:', error);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật thông tin.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center text-sky-600">
            <UserIcon size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">Cài đặt tài khoản</h3>
            <p className="text-sm text-stone-500">Quản lý thông tin cá nhân của bạn</p>
          </div>
        </div>

        {message && (
          <div className={cn(
            "p-4 rounded-lg mb-6 text-sm font-medium border",
            message.type === 'success' ? "bg-sky-50 text-sky-700 border-sky-100" : "bg-rose-50 text-rose-700 border-rose-100"
          )}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-stone-700">Số điện thoại</label>
              <input 
                type="tel" 
                disabled 
                className="w-full px-4 py-2 bg-stone-100 border border-stone-200 rounded-lg text-stone-500 cursor-not-allowed"
                value={profile.email}
              />
              <p className="text-xs text-stone-400">Số điện thoại không thể thay đổi.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-stone-700">Họ và tên</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Vai trò</label>
                <div className="px-4 py-2 bg-stone-100 border border-stone-200 rounded-lg text-stone-500 capitalize">
                  {profile.role}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Trạng thái</label>
                <div className="px-4 py-2 bg-stone-100 border border-stone-200 rounded-lg text-stone-500 capitalize">
                  {profile.status}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
                <Bell size={16} className="text-sky-600" />
                Thông báo
              </h4>
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <p className="text-sm font-semibold text-stone-900">Thông báo đẩy (FCM)</p>
                  <p className="text-xs text-stone-500">Nhận thông báo về trạng thái hoàn vé và tin tức mới nhất.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    notificationsEnabled ? "bg-sky-600" : "bg-stone-300"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      notificationsEnabled ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <Button type="submit" disabled={isSaving || (displayName === profile.displayName && notificationsEnabled === (profile.notificationsEnabled ?? true))}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

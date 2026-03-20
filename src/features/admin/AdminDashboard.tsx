import React, { useState } from 'react';
import { 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  Users, 
  ChevronRight, 
  Ticket, 
  User as UserIcon, 
  Database, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { UserProfile, RefundRequest } from '../../types';

interface AdminDashboardProps {
  stats: {
    pendingCount: number;
    processingCount: number;
    completedCount: number;
    userCount: number;
    recentRequests: RefundRequest[];
  };
  users: UserProfile[];
  dbStats: Record<string, number>;
  dbCollections: { key: string; label: string; icon: React.ReactNode }[];
  handleResetCollection: (type: string) => void;
}

export function AdminDashboard({ 
  stats, 
  users, 
  dbStats, 
  dbCollections, 
  handleResetCollection 
}: AdminDashboardProps) {
  const [resetConfirm, setResetConfirm] = useState<{ type: string; label: string } | null>(null);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#FF8800] shadow-sm rounded flex items-center p-3 gap-3">
          <div className="w-10 h-10 bg-orange-100 flex items-center justify-center rounded-full text-[#FF8800]">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">Chờ duyệt</div>
            <div className="text-xl font-black text-orange-600">{stats.pendingCount}</div>
          </div>
        </div>
        <div className="bg-white border border-purple-400 shadow-sm rounded flex items-center p-3 gap-3">
          <div className="w-10 h-10 bg-purple-100 flex items-center justify-center rounded-full text-purple-600">
            <RefreshCw size={20} />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">Đang chuyển tiền</div>
            <div className="text-xl font-black text-purple-700">{stats.processingCount}</div>
          </div>
        </div>
        <div className="bg-white border border-emerald-500 shadow-sm rounded flex items-center p-3 gap-3">
          <div className="w-10 h-10 bg-emerald-100 flex items-center justify-center rounded-full text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">Hoàn tất</div>
            <div className="text-xl font-black text-emerald-700">{stats.completedCount}</div>
          </div>
        </div>
        <div className="bg-white border border-[#0A73D1] shadow-sm rounded flex items-center p-3 gap-3">
          <div className="w-10 h-10 bg-blue-100 flex items-center justify-center rounded-full text-blue-700">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">Người dùng</div>
            <div className="text-xl font-black text-blue-900">{stats.userCount}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-md overflow-hidden shadow-md border border-[#06427D]">
          <div className="bg-[#06427D] py-2.5 px-4 flex items-center justify-between border-b border-[#0A73D1]">
            <h3 className="text-white font-bold text-[14px] uppercase tracking-wide flex items-center gap-2">
               <Ticket size={16}/> Yêu cầu mới nhất
            </h3>
            <ChevronRight size={16} className="text-white opacity-70" />
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-[13px]">
                <EmptyState message="Chưa có yêu cầu nào" icon={<Ticket size={24} />} />
              </div>
            ) : (
              stats.recentRequests.map((req, i) => (
                <div key={`${req.id}-${i}`} className="p-3 flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <Ticket size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-black">{req.orderCode}</p>
                      <p className="text-[11px] text-gray-500">{req.userEmail}</p>
                    </div>
                  </div>
                  <Badge status={req.status} className="!text-[10px] !px-1.5 !py-0.5" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-md overflow-hidden shadow-md border border-[#06427D]">
          <div className="bg-[#06427D] py-2.5 px-4 flex items-center justify-between border-b border-[#0A73D1]">
            <h3 className="text-white font-bold text-[14px] uppercase tracking-wide flex items-center gap-2">
               <Users size={16}/> Người dùng mới
            </h3>
            <ChevronRight size={16} className="text-white opacity-70" />
          </div>
          <div className="divide-y divide-gray-200">
            {users.slice(0, 5).map((u, i) => (
              <div key={`${u.uid}-${i}`} className="p-3 flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <UserIcon size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-black">{u.displayName}</p>
                    <p className="text-[11px] text-gray-500">{u.email}</p>
                  </div>
                </div>
                <Badge status={u.role} className="!text-[10px] !px-1.5 !py-0.5" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quản lý Database */}
      {import.meta.env.DEV && (
        <div className="bg-white rounded-md overflow-hidden shadow-md border border-rose-300 mt-2">
          <div className="bg-rose-50 py-3 px-4 flex items-center justify-between border-b border-rose-200">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-rose-600" />
              <div>
                <h3 className="font-bold text-rose-800 text-[14px] uppercase">Quản lý Database (LocalStorage)</h3>
              </div>
            </div>
            <button
              onClick={() => setResetConfirm({ type: 'all', label: 'TOÀN BỘ dữ liệu' })}
              className="px-3 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1.5 uppercase"
            >
              <Trash2 size={12} /> Reset toàn bộ
            </button>
          </div>
          <div className="p-4 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dbCollections.map(col => (
                <div key={col.key} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:border-rose-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-600">
                      {col.icon}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-gray-800">{col.label}</p>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                        {dbStats[col.key] !== undefined ? `${dbStats[col.key]} bản ghi` : '...'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setResetConfirm({ type: col.key, label: col.label })}
                    className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 transition-colors"
                    title={`Xóa ${col.label}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận Reset */}
      {resetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white border border-gray-200 shadow-2xl p-6 text-center rounded-md">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-[16px] font-black tracking-tight text-gray-900 mb-2 uppercase">Xác nhận xóa dữ liệu</h3>
            <p className="text-[13px] text-gray-600 mb-6 leading-relaxed">
              Bạn sắp xóa <span className="font-bold text-red-600">{resetConfirm.label}</span>.
              {resetConfirm.type === 'all' && ' Tất cả dữ liệu sẽ bị xóa và trang sẽ được tải lại.'}
              {resetConfirm.type === 'mockUsers' && ' Chỉ giữ lại tài khoản Admin mặc định.'}
              <br/><span className="text-xs italic text-gray-400 mt-2 block">Hành động này không thể hoàn tác.</span>
            </p>
            <div className="flex gap-3">
              <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[13px] py-2 rounded transition-colors" onClick={() => setResetConfirm(null)}>HỦY</button>
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] py-2 rounded shadow-md transition-colors" onClick={() => {
                handleResetCollection(resetConfirm.type);
                setResetConfirm(null);
              }}>XÓA DỮ LIỆU</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

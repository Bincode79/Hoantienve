/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { X, TicketCheck, Clock, CheckCircle2, CreditCard, XCircle, ShieldAlert, AlertTriangle, Info, UserCog } from 'lucide-react';
import { format } from 'date-fns';
import { RefundRequest } from '../../../types';
import { Button } from '../../../components/Button';

interface UserRequestDetailModalProps {
  request: RefundRequest;
  onClose: () => void;
}

export const UserRequestDetailModal: React.FC<UserRequestDetailModalProps> = ({ request, onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-black/50 backdrop-blur-xl"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg lg:max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Gradient Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
          
          <div className="relative p-5 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <TicketCheck size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Chi tiết yêu cầu hoàn vé</h3>
                <p className="text-blue-100 text-sm">Mã PNR: <span className="font-semibold">{request.isVisible !== false ? request.orderCode : 'PNR-******'}</span></p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95 backdrop-blur-sm">
              <X size={22} />
            </button>
          </div>

          {/* Status Badge */}
          <div className="px-5 sm:px-6 pb-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm ${
              request.status === 'pending' ? 'bg-amber-50 border border-amber-200' :
              request.status === 'approved' ? 'bg-blue-50 border border-blue-200' :
              request.status === 'processing' ? 'bg-violet-50 border border-violet-200' :
              request.status === 'completed' ? 'bg-emerald-50 border border-emerald-200' :
              'bg-rose-50 border border-rose-200'
            }`}>
              {request.status === 'pending' && <Clock size={18} className="text-amber-600" />}
              {request.status === 'approved' && <CheckCircle2 size={18} className="text-blue-600" />}
              {request.status === 'processing' && <CreditCard size={18} className="text-violet-600" />}
              {request.status === 'completed' && <CheckCircle2 size={18} className="text-emerald-600" />}
              {request.status === 'rejected' && <XCircle size={18} className="text-rose-600" />}
              <span className={`text-sm font-bold ${
                request.status === 'pending' ? 'text-amber-700' :
                request.status === 'approved' ? 'text-blue-700' :
                request.status === 'processing' ? 'text-violet-700' :
                request.status === 'completed' ? 'text-emerald-700' :
                'text-rose-700'
              }`}>
                {request.status === 'pending' ? 'ĐANG CHỜ DUYỆT' :
                  request.status === 'approved' ? 'ĐÃ DUYỆT - ĐANG XỬ LÝ' :
                    request.status === 'processing' ? 'ĐANG CHUYỂN TIỀN' :
                      request.status === 'completed' ? 'HOÀN TIỀN THÀNH CÔNG' :
                        'YÊU CẦU BỊ TỪ CHỐI'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-gray-50/30">
          {request.isVisible === false && (
            <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
                <ShieldAlert size={32} />
              </div>
              <h4 className="text-lg font-bold text-black mb-2">Thông tin đang được bảo mật</h4>
              <p className="text-sm text-gray-600 max-w-[280px]">Hệ thống đang kiểm tra yêu cầu của bạn. Thông tin chi tiết sẽ được hiển thị sau khi Admin phê duyệt.</p>
            </div>
          )}

          {request.isVisible !== false && request.refundSlipCode && (
            <div className="bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 border border-violet-200 rounded-2xl p-5 text-center relative overflow-hidden">
              <p className="text-[11px] font-bold text-violet-600 uppercase tracking-wider mb-2">Mã phiếu hoàn tiền</p>
              <p className="text-2xl font-black text-violet-700 tracking-wide">{request.refundSlipCode}</p>
            </div>
          )}

          {/* Bank Info Card */}
          {request.isVisible !== false && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
                <CreditCard size={20} className="text-white" />
              </div>
              <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Thông tin nhận tiền</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2.5 px-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Ngân hàng</span>
                <span className="font-semibold text-sm text-gray-900 text-right max-w-[60%]">{request.bankName}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 px-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Số tài khoản</span>
                <span className="font-mono font-semibold text-sm text-gray-900">{request.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 px-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Chủ tài khoản</span>
                <span className="font-semibold text-sm text-gray-900 uppercase">{request.accountHolder}</span>
              </div>
            </div>
          </div>
          )}

          {/* Amount and Date Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 text-center border border-blue-100 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.15))' }} />
              <div className="relative">
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2">Số tiền hoàn</p>
                <p className="text-lg font-black text-blue-700">
                  {request.isVisible !== false
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(request.amount)
                    : '***.*** đ'}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-5 text-center border border-gray-200 shadow-sm">
              <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Ngày tạo</p>
              <p className="text-sm font-bold text-gray-900">
                {request.createdAt ? format(request.createdAt.toDate(), 'dd/MM/yyyy') : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {request.createdAt ? format(request.createdAt.toDate(), 'HH:mm') : ''}
              </p>
            </div>
          </div>

          {request.refundReason && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Lý do yêu cầu</p>
              </div>
              <p className="text-sm text-gray-800">{request.refundReason}</p>
            </div>
          )}

          {request.isVisible !== false && request.transferNote && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-amber-600" />
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Ghi chú chuyển khoản</p>
              </div>
              <p className="text-sm text-gray-800">{request.transferNote}</p>
            </div>
          )}

          {request.adminNote && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <UserCog size={16} className="text-blue-600" />
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Ghi chú từ Admin</p>
              </div>
              <p className="text-sm text-gray-800">{request.adminNote}</p>
            </div>
          )}

          {/* Status Messages */}
          {request.status === 'pending' && (
            <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-center shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at 50% 100%, rgba(251,191,36,0.15))' }} />
              <div className="relative">
                <Clock size={28} className="text-amber-600 mx-auto mb-2" />
                <p className="text-base font-bold text-amber-800">Yêu cầu đang chờ duyệt</p>
                <p className="text-xs text-amber-700 mt-1">Bạn sẽ nhận được thông báo khi có cập nhật.</p>
              </div>
            </div>
          )}
          {request.status === 'approved' && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl p-5 text-center shadow-sm">
              <CheckCircle2 size={28} className="text-blue-600 mx-auto mb-2" />
              <p className="text-base font-bold text-blue-800">Yêu cầu đã được duyệt</p>
              <p className="text-xs text-blue-700 mt-1">Chúng tôi đang xử lý hoàn tiền cho bạn.</p>
            </div>
          )}
          {request.status === 'processing' && (
            <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 border border-violet-200 rounded-2xl p-5 text-center shadow-sm">
              <CreditCard size={28} className="text-violet-600 mx-auto mb-2" />
              <p className="text-base font-bold text-violet-800">Đang chuyển tiền</p>
              <p className="text-xs text-violet-700 mt-1">Tiền đang được chuyển vào tài khoản của bạn.</p>
            </div>
          )}
          {request.status === 'completed' && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 rounded-2xl p-5 text-center shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.15))' }} />
              <div className="relative">
                <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-2" />
                <p className="text-base font-bold text-emerald-800">Hoàn tiền thành công</p>
                <p className="text-xs text-emerald-700 mt-1">Tiền đã được hoàn vào tài khoản. Vui lòng kiểm tra tài khoản ngân hàng.</p>
              </div>
            </div>
          )}
          {request.status === 'rejected' && !request.adminNote && (
            <div className="bg-gradient-to-r from-rose-50 via-red-50 to-rose-50 border border-rose-200 rounded-2xl p-5 text-center shadow-sm">
              <XCircle size={28} className="text-rose-600 mx-auto mb-2" />
              <p className="text-base font-bold text-rose-800">Yêu cầu bị từ chối</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-slate-600" />
              </div>
              <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Lịch sử xử lý</p>
            </div>
            <div className="relative pl-4">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-violet-500 rounded-full" />
              <div className="space-y-4">
                <div className="relative flex items-start gap-4">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200 flex-shrink-0 z-10" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Yêu cầu được tạo</p>
                    <p className="text-xs text-gray-500">
                      {request.createdAt ? format(request.createdAt.toDate(), 'dd/MM/yyyy lúc HH:mm') : '-'}
                    </p>
                  </div>
                </div>
                {request.processingTime && (
                  <div className="relative flex items-start gap-4">
                    <div className={`w-4 h-4 rounded-full shadow-lg flex-shrink-0 z-10 ${
                      request.status === 'completed' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200' :
                        request.status === 'rejected' ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-200' :
                          request.status === 'processing' ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-200' :
                            'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {request.status === 'completed' ? 'Hoàn tiền thành công' :
                          request.status === 'rejected' ? 'Yêu cầu bị từ chối' :
                            request.status === 'processing' ? 'Đang chuyển tiền' :
                              request.status === 'approved' ? 'Đã duyệt - Đang xử lý' :
                                'Cập nhật trạng thái'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {request.processingTime ? format(request.processingTime.toDate(), 'dd/MM/yyyy lúc HH:mm') : '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-gray-200 bg-white">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto font-semibold">
            Đóng
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// Removed default export

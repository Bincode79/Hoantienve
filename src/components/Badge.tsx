/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RefundStatus, UserRole } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Badge = memo(({ status }: { status: RefundStatus | 'active' | 'inactive' | UserRole }) => {
  const styles: Record<string, string> = {
    pending: 'status-pending',
    approved: 'status-approved',
    processing: 'status-processing',
    rejected: 'status-rejected',
    completed: 'status-completed',
    active: 'status-completed',
    inactive: 'status-rejected',
    admin: 'status-processing',
    user: 'status-approved',
  };

  const labels: Record<string, string> = {
    pending: 'Đang chờ duyệt',
    approved: 'Đã duyệt - Đang xử lý',
    processing: 'Đang chuyển tiền',
    rejected: 'Đã từ chối',
    completed: 'Hoàn tiền thành công',
    active: 'Hoạt động',
    inactive: 'Khóa',
    admin: 'Quản trị',
    user: 'Người dùng',
  };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('px-0.5 py-0 rounded text-[6px] font-bold uppercase tracking-wider border status-badge inline-flex items-center gap-0.5 shadow-sm', styles[status as keyof typeof styles])}
    >
      <span className="w-0.5 h-0.5 rounded-full bg-current opacity-80" />
      {labels[status as keyof typeof labels] || status}
    </motion.span>
  );
});

// Removed default export

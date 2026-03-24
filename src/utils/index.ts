/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const translateRole = (role?: string) => {
  if (role === 'admin') return 'Quản trị viên';
  if (role === 'user') return 'Khách hàng';
  return role || '-';
};

export const translateStatus = (status?: string) => {
  if (status === 'active') return 'Hoạt động';
  if (status === 'inactive') return 'Đã khóa';
  return status || '-';
};

export const formatDate = (date: any, formatStr: string) => {
  if (!date) return '-';
  try {
    if (typeof date.toDate === 'function') {
      return format(date.toDate(), formatStr);
    }
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return format(d, formatStr);
    }
  } catch (e) {
    console.error('Date formatting error:', e);
  }
  return '-';
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPhone = (phone: string) => {
  if (phone.trim().toLowerCase() === 'admin') return 'Admin';
  let f = phone.replace(/[^0-9]/g, ''); // Xóa tất cả ký tự không phải số
  if (!f) return phone.trim();
  if (f.startsWith('84')) f = '0' + f.substring(2);
  else if (!f.startsWith('0')) f = '0' + f;
  return f;
};

export const getMockEmail = (phone: string) => {
  if (phone === 'Admin') return 'admin@hoanvemaybay.com';
  return `phone_${phone}@hoanvemaybay.com`;
};

export const capitalizeName = (name?: string) => {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

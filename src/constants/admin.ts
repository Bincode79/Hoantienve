/**
 * Admin Configuration Constants
 * 
 * Centralized admin configuration to avoid hardcoding 
 * admin identifiers throughout the codebase.
 */

/** Phone numbers that are automatically assigned the 'admin' role */
export const ADMIN_PHONE_NUMBERS = [
  '0999999999',
  '0383165313', 
  '0968686868',
  '0912345678', // Admin 4
] as const;

/** Dev login: SĐT → email seed trong `supabase_schema.sql` (mật khẩu seed: Admin@123) */
export const DEV_ADMIN_SEED_BY_PHONE: Record<string, string> = {
  '0999999999': '0999999999@app.aerorefund.local',
  '0383165313': '0383165313@app.aerorefund.local',
  '0968686868': '0968686868@app.aerorefund.local',
};

/** Mật khẩu đúng trên Supabase của các tài khoản seed (shortcut SĐT + 123456 sẽ gọi đăng nhập bằng email seed + mật khẩu này). */
export const DEV_ADMIN_SEED_PASSWORD = 'Admin@123';

/** Mật khẩu gõ trên form dev (ứng dụng tự đổi sang seed email + Admin@123). */
export const DEV_ADMIN_SHORTCUT_PASSWORD = '123456';

/** Check if a phone number belongs to an admin */
export function isAdminPhone(phone: string): boolean {
  if (phone === 'Admin') return true;
  return ADMIN_PHONE_NUMBERS.includes(phone as any);
}

/** Default system configuration */
export const DEFAULT_CONFIG = {
  brandName: 'TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆT NAM',
  supportPhone: '1900 6091',
  workingHours: '0h - 24h',
  copyright: '© 2026 TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆT NAM. All Rights Reserved.',
} as const;

/** Firestore/Supabase collections map */
export const COLLECTIONS = {
  USERS: 'users',
  REFUND_REQUESTS: 'refundRequests',
  BASEDATA: 'basedata',
  CHATS: 'chats',
  CONFIG: 'config',
} as const;

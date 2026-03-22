-- ============================================================
-- RESET PASSWORDS - Chạy script này để reset mật khẩu cho tất cả tài khoản
-- Mật khẩu mới: Admin@123
-- ============================================================

-- Bước 1: Cập nhật mật khẩu cho tất cả tài khoản @app.aerorefund.local
UPDATE auth.users 
SET encrypted_password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4bKHJyOs/ztKPF3.'
WHERE email LIKE '%@app.aerorefund.local';

-- Bước 2: Kiểm tra các tài khoản đã được cập nhật
SELECT id, email, last_sign_in_at 
FROM auth.users 
WHERE email LIKE '%@app.aerorefund.local';

-- Bước 3: Kiểm tra public.users có khớp với auth.users không
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  pu.id as public_id,
  pu.sdt,
  pu.display_name,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email LIKE '%@app.aerorefund.local';

-- ============================================================
-- Kết quả: Đăng nhập với SĐT + "Admin@123"
-- ============================================================

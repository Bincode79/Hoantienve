-- ============================================================
-- SQL CAP NHAT THONG TIN TAI KHOAN
-- Chay script nay tren Neon PostgreSQL Console
-- https://console.neon.tech
-- ============================================================

-- ============================================================
-- HUONG DAN SU DUNG
-- ============================================================
-- 1. Mo https://console.neon.tech > chon project > SQL Editor
-- 2. Copy & paste toan bo noi dung file nay vao
-- 3. Sua thong tin ben duoi theo nhu cau cua ban
-- 4. Click "Run"
-- ============================================================


-- ============================================================
-- PHAN 1: CAP NHAT TAI KHOAN ADMIN
-- ============================================================
-- Password hash cho 'Admin@123' (bcrypt, cost 12)
DO $$
DECLARE
  admin_pass TEXT := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4bKHJyOs/ztKPF3.';
BEGIN

  -- === CAP NHAT THONG TIN ADMIN 1 ===
  UPDATE public.users SET
    display_name = 'Quan Tri Vien 1',
    email = 'admin1@hoantienve.com',
    sdt = '0999999999',
    password_hash = admin_pass,
    status = 'active',
    role = 'admin'
  WHERE sdt = '0999999999';

  -- === CAP NHAT THONG TIN ADMIN 2 ===
  UPDATE public.users SET
    display_name = 'Quan Tri Vien 2',
    email = 'admin2@hoantienve.com',
    sdt = '0383165313',
    password_hash = admin_pass,
    status = 'active',
    role = 'admin'
  WHERE sdt = '0383165313';

  -- === CAP NHAT THONG TIN ADMIN 3 ===
  UPDATE public.users SET
    display_name = 'Quan Tri Vien 3',
    email = 'admin3@hoantienve.com',
    sdt = '0968686868',
    password_hash = admin_pass,
    status = 'active',
    role = 'admin'
  WHERE sdt = '0968686868';

  -- === TAO THEM TAI KHOAN ADMIN MOI ===
  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES (
    '0912345678',
    'admin4@hoantienve.com',
    admin_pass,
    'Quan Tri Vien 4',
    'admin',
    'active'
  )
  ON CONFLICT (sdt) DO UPDATE SET
    display_name = 'Quan Tri Vien 4',
    email = 'admin4@hoantienve.com',
    password_hash = admin_pass,
    status = 'active',
    role = 'admin';

  RAISE NOTICE 'Cap nhat tai khoan admin thanh cong!';
END $$;


-- ============================================================
-- PHAN 2: CAP NHAT TAI KHOAN NGUOI DUNG (USER)
-- ============================================================
-- Password hash cho 'User@123' (bcrypt, cost 12)
DO $$
DECLARE
  user_pass TEXT := '$2b$12$WHxEmpdB2mpqr4fxQ3IuDuEGHUVdq28hlIplMWIICGw6DHsgKIeZa';
BEGIN

  -- === CAP NHAT THONG TIN USER 1 ===
  UPDATE public.users SET
    display_name = 'Nguyen Van A',
    email = 'user1@hoantienve.com',
    sdt = '0901001001',
    password_hash = user_pass,
    status = 'active',
    role = 'user'
  WHERE sdt = '0901001001';

  -- === TAO THEM TAI KHOAN USER MOI ===
  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES (
    '0902002002',
    'user2@hoantienve.com',
    user_pass,
    'Tran Van B',
    'user',
    'active'
  )
  ON CONFLICT (sdt) DO UPDATE SET
    display_name = 'Tran Van B',
    email = 'user2@hoantienve.com',
    password_hash = user_pass,
    status = 'active',
    role = 'user';

  RAISE NOTICE 'Cap nhat tai khoan user thanh cong!';
END $$;


-- ============================================================
-- PHAN 3: KHOA TAT CA TAI KHOAN BI KHOA (NEU CO)
-- ============================================================
-- Danh sach tai khoan bi khoa
SELECT
  id,
  sdt,
  display_name,
  role,
  status
FROM public.users
WHERE status != 'active';

-- Mo khoa tat ca tai khoan (CHỉ thực hiện nếu cần)
-- UPDATE public.users SET status = 'active' WHERE status != 'active';


-- ============================================================
-- PHAN 4: HIEN THI TAT CA TAI KHOAN HIEN TAI
-- ============================================================
SELECT
  id,
  sdt,
  email,
  display_name,
  role,
  status,
  created_at,
  CASE
    WHEN status = 'active' THEN '✅ Hoat dong'
    WHEN status = 'inactive' THEN '⛔ Khong hoat dong'
    WHEN status = 'banned' THEN '🚫 Bi cam'
    ELSE '❓ Khong ro'
  END AS trang_thai
FROM public.users
ORDER BY
  CASE role WHEN 'admin' THEN 0 ELSE 1 END,
  created_at DESC;


-- ============================================================
-- PHAN 5: LUU Y VE MAT KHAU
-- ============================================================
-- MAT KHAU MAC DINH:
--   - Admin: Admin@123
--   - User:  User@123
--
-- LUU Y: He thong KHONG TU DONG khoa tai khoan
--        Chi co Admin moi co quyen khoa/mo khoa tai khoan thu cong
-- ============================================================

SELECT '✅ Script hoan tat!' AS status;

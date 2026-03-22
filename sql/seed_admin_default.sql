-- ============================================================
-- SEED: TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH KHÔNG BỊ KHÓA
-- Password: Admin@123
-- ============================================================

-- Password hash cho 'Admin@123' (bcrypt, cost 12)
DO $$
DECLARE
  admin_pass TEXT := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4bKHJyOs/ztKPF3.';
  admin_id UUID;
BEGIN
  -- Tài khoản Admin 1
  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES ('0999999999', 'admin@app.aerorefund.local', admin_pass, 'Admin Hệ thống', 'admin', 'active')
  ON CONFLICT (sdt) DO UPDATE SET 
    password_hash = admin_pass, 
    display_name = 'Admin Hệ thống', 
    role = 'admin',
    status = 'active';

  -- Tài khoản Admin 2
  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES ('0383165313', 'admin2@app.aerorefund.local', admin_pass, 'Admin 2', 'admin', 'active')
  ON CONFLICT (sdt) DO UPDATE SET 
    password_hash = admin_pass, 
    display_name = 'Admin 2', 
    role = 'admin',
    status = 'active';

  -- Tài khoản Admin 3
  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES ('0968686868', 'admin3@app.aerorefund.local', admin_pass, 'Admin 3', 'admin', 'active')
  ON CONFLICT (sdt) DO UPDATE SET 
    password_hash = admin_pass, 
    display_name = 'Admin 3', 
    role = 'admin',
    status = 'active';

  RAISE NOTICE 'Admin accounts created/updated successfully!';
END $$;

-- Xác nhận các tài khoản admin
SELECT 
  sdt, 
  email, 
  display_name, 
  role, 
  status,
  CASE WHEN status = 'active' THEN '✅ Hoạt động' ELSE '❌ Bị khóa' END AS trang_thai
FROM public.users 
WHERE role = 'admin';

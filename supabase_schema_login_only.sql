-- ============================================================
-- SUPABASE DATABASE SCHEMA - ĐƠN GIẢN
-- Chỉ lưu thông tin đăng nhập User/Admin
-- ============================================================

-- 1. Kích hoạt extension pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Xóa các bảng cũ nếu tồn tại (để reset sạch)
DROP TABLE IF EXISTS public.refund_requests CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.basedata CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.config CASCADE;
DROP TABLE IF EXISTS public.airports CASCADE;
DROP TABLE IF EXISTS public.airlines CASCADE;
DROP TABLE IF EXISTS public.popular_routes CASCADE;

-- 3. Tạo bảng USERS (Thông tin tài khoản User/Admin)
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID        REFERENCES auth.users NOT NULL PRIMARY KEY,
  sdt           TEXT        UNIQUE NOT NULL,
  display_name  TEXT,
  role          TEXT        DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status        TEXT        DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS cho bảng users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: User chỉ xem được profile của mình
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Policy: User chỉ update được profile của mình
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Policy: User chỉ insert được profile của mình
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Policy: Admin có thể xem tất cả profile
CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'admin')
  );

-- Policy: Admin có thể update tất cả profile
CREATE POLICY "Admins can update all profiles" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'admin')
  );

-- Policy: Admin có thể xóa user
CREATE POLICY "Admins can delete profiles" ON public.users
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'admin')
  );

-- Policy: Admin có thể tạo user mới
CREATE POLICY "Admins can insert profiles" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'admin')
  );

-- 4. Function đăng nhập bằng SĐT
CREATE OR REPLACE FUNCTION public.lookup_login_email_by_phone(p_phone text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT a.email::text
  FROM public.users u
  INNER JOIN auth.users a ON a.id = u.id
  WHERE u.sdt IS NOT NULL
    AND u.sdt = trim(both from p_phone)
    AND COALESCE(u.status, 'active') = 'active';
$$;

-- Phân quyền cho function đăng nhập
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;
REVOKE ALL ON FUNCTION public.lookup_login_email_by_phone(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_login_email_by_phone(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_login_email_by_phone(text) TO authenticated;

-- 5. Function để tạo user profile tự động khi đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (id, sdt, display_name, role, status)
    VALUES (
      NEW.id,
      COALESCE(SPLIT_PART(NEW.email, '@', 1), ''),
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'Người dùng'),
      'user',
      'active'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Tạo trigger để tự động tạo user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Seed data - Tạo tài khoản test
DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
  user_uid  UUID := gen_random_uuid();
  admin_pass TEXT := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4bKHJyOs/ztKPF3.';
BEGIN

  -- TÀI KHOẢN ADMIN
  -- SĐT: 0999999999
  -- Mật khẩu: Admin@123
  INSERT INTO auth.users (id, email, encrypted_password, created_at, last_sign_in_at, email_confirmed_at)
  VALUES (
    admin_uid,
    '0999999999@app.aerorefund.local',
    admin_pass,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET 
    encrypted_password = admin_pass,
    email = '0999999999@app.aerorefund.local';

  INSERT INTO public.users (id, sdt, display_name, role, status, created_at)
  VALUES (admin_uid, '0999999999', 'Quản trị viên', 'admin', 'active', NOW())
  ON CONFLICT (id) DO UPDATE SET 
    display_name = 'Quản trị viên',
    role = 'admin',
    status = 'active';

  -- TÀI KHOẢN USER
  -- SĐT: 0912345678
  -- Mật khẩu: Admin@123
  INSERT INTO auth.users (id, email, encrypted_password, created_at, last_sign_in_at, email_confirmed_at)
  VALUES (
    user_uid,
    '0912345678@app.aerorefund.local',
    admin_pass,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET 
    encrypted_password = admin_pass,
    email = '0912345678@app.aerorefund.local';

  INSERT INTO public.users (id, sdt, display_name, role, status, created_at)
  VALUES (user_uid, '0912345678', 'Nguyễn Văn A', 'user', 'active', NOW())
  ON CONFLICT (id) DO UPDATE SET 
    display_name = 'Nguyễn Văn A',
    role = 'user',
    status = 'active';

END $$;

-- ============================================================
-- HOÀN TẤT
-- ============================================================
SELECT '✅ Database schema đơn giản đã hoàn tất!' AS status;
SELECT '📋 Tài khoản test:' AS info;
SELECT '   - Admin: SĐT 0999999999, Mật khẩu: Admin@123' AS admin_account;
SELECT '   - User: SĐT 0912345678, Mật khẩu: Admin@123' AS user_account;

-- ============================================================
-- SUPABASE SCHEMA - AEROREFUND (Đơn giản)
-- Chỉ lưu thông tin tài khoản user
-- ============================================================

-- 1. Tạo bảng users
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID        REFERENCES auth.users NOT NULL PRIMARY KEY,
  sdt          TEXT        UNIQUE NOT NULL,
  display_name TEXT,
  role         TEXT        DEFAULT 'user',
  status       TEXT        DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

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

-- 2. Tạo function đăng nhập bằng SĐT
CREATE OR REPLACE FUNCTION public.lookup_login_email_by_phone(p_phone text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text
  FROM public.users u
  WHERE u.sdt IS NOT NULL
    AND u.sdt = trim(both from p_phone)
    AND COALESCE(u.status, 'active') = 'active'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_login_email_by_phone(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_login_email_by_phone(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_login_email_by_phone(text) TO authenticated;

-- 3. Seed data - Tạo tài khoản test
DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
  user_uid  UUID := gen_random_uuid();
BEGIN
  -- Tài khoản Admin (SĐT: 0999999999, mật khẩu: Admin@123)
  INSERT INTO auth.users (id, email, encrypted_password, created_at, last_sign_in_at, email_confirmed_at)
  VALUES (
    admin_uid,
    '0999999999@app.aerorefund.local',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- password: Admin@123
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (id, sdt, display_name, role, status, created_at)
  VALUES (admin_uid, '0999999999', 'Quản trị viên', 'admin', 'active', NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Tài khoản User (SĐT: 0912345678, mật khẩu: Admin@123)
  INSERT INTO auth.users (id, email, encrypted_password, created_at, last_sign_in_at, email_confirmed_at)
  VALUES (
    user_uid,
    '0912345678@app.aerorefund.local',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- password: Admin@123
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (id, sdt, display_name, role, status, created_at)
  VALUES (user_uid, '0912345678', 'Nguyễn Văn A', 'user', 'active', NOW())
  ON CONFLICT (id) DO NOTHING;
END $$;

SELECT '✅ Hoàn tất!' AS status;

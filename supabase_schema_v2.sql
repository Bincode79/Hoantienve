-- ============================================================
-- SUPABASE DATABASE SCHEMA V2 - AEROREFUND (Đơn Giản)
-- Chỉ lưu thông tin đăng nhập User/Admin và Phiếu hoàn tiền
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
  id           UUID        REFERENCES auth.users NOT NULL PRIMARY KEY,
  sdt          TEXT        UNIQUE NOT NULL,
  display_name TEXT,
  role         TEXT        DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status       TEXT        DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
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

-- 4. Tạo bảng REFUND_REQUESTS (Phiếu hoàn tiền)
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Thông tin người dùng
  user_id          UUID        REFERENCES auth.users NOT NULL,
  user_sdt         TEXT,
  display_name     TEXT,
  
  -- Thông tin ngân hàng
  bank_name        TEXT,
  account_number   TEXT,
  account_holder   TEXT,
  
  -- Thông tin vé bay
  order_code       TEXT,
  amount           NUMERIC,
  flight_date      TEXT,
  ticket_number    TEXT,
  passenger_name   TEXT,
  
  -- Trạng thái và lý do
  status           TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  refund_reason    TEXT,
  
  -- Thông tin admin xử lý
  admin_note       TEXT,
  approved_by      TEXT,
  approved_at      TIMESTAMPTZ,
  completed_by     TEXT,
  completed_at    TIMESTAMPTZ,
  refund_slip_code TEXT,
  
  -- Timestamps
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS cho bảng refund_requests
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Policy: User chỉ xem được phiếu hoàn tiền của mình
CREATE POLICY "Users can view own refund requests" ON public.refund_requests
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: User chỉ tạo phiếu hoàn tiền cho mình
CREATE POLICY "Users can insert own refund requests" ON public.refund_requests
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: User chỉ update được phiếu hoàn tiền của mình (chỉ khi đang pending)
CREATE POLICY "Users can update own pending refund requests" ON public.refund_requests
  FOR UPDATE USING (
    auth.uid()::text = user_id::text AND status = 'pending'
  );

-- Policy: Admin có thể xem tất cả phiếu hoàn tiền
CREATE POLICY "Admins can view all refund requests" ON public.refund_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'admin')
  );

-- Policy: Admin có thể update tất cả phiếu hoàn tiền
CREATE POLICY "Admins can manage all refund requests" ON public.refund_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'admin')
  );

-- Policy: Admin có thể xóa phiếu hoàn tiền
CREATE POLICY "Admins can delete refund requests" ON public.refund_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'admin')
  );

-- 5. Function đăng nhập bằng SĐT
-- Function này trả về email để Supabase auth xử lý đăng nhập
CREATE OR REPLACE FUNCTION public.lookup_login_email_by_phone(p_phone text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  -- Tìm user với SĐT, trả về email từ auth.users
  -- Sử dụng auth.uid() IS NOT NULL để bypass RLS trên auth.users
  SELECT a.email::text
  FROM public.users u
  INNER JOIN auth.users a ON a.id = u.id
  WHERE u.sdt IS NOT NULL
    AND u.sdt = trim(both from p_phone)
    AND COALESCE(u.status, 'active') = 'active';
$$;

-- Đảm bảo function owner có quyền đọc auth.users
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;

-- Phân quyền cho function đăng nhập
REVOKE ALL ON FUNCTION public.lookup_login_email_by_phone(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_login_email_by_phone(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_login_email_by_phone(text) TO authenticated;

-- 6. Function để tạo user profile tự động khi đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Kiểm tra nếu user chưa có trong bảng public.users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- Trích xuất SĐT từ email (phần trước @)
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

-- 7. Seed data - Tạo tài khoản test
-- Mật khẩu cho tất cả tài khoản: Admin@123
-- Bcrypt hash cho "Admin@123" (cost factor 12)
DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
  user_uid  UUID := gen_random_uuid();
  admin_pass TEXT := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4bKHJyOs/ztKPF3.';
BEGIN

  -- ============================================================
  -- TÀI KHOẢN ADMIN
  -- ============================================================
  -- SĐT: 0999999999
  -- Mật khẩu: Admin@123
  -- Email: 0999999999@app.aerorefund.local (tự động tạo)
  
  -- Kiểm tra nếu email đã tồn tại với user khác thì xóa
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = '0999999999@app.aerorefund.local' AND id != admin_uid) THEN
    DELETE FROM auth.users WHERE email = '0999999999@app.aerorefund.local';
  END IF;

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

  -- ============================================================
  -- TÀI KHOẢN USER
  -- ============================================================
  -- SĐT: 0912345678
  -- Mật khẩu: Admin@123
  -- Email: 0912345678@app.aerorefund.local (tự động tạo)
  
  -- Kiểm tra nếu email đã tồn tại với user khác thì xóa
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = '0912345678@app.aerorefund.local' AND id != user_uid) THEN
    DELETE FROM auth.users WHERE email = '0912345678@app.aerorefund.local';
  END IF;

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

-- 8. Seed data - Tạo phiếu hoàn tiền mẫu cho User
DO $$
DECLARE
  user_uid UUID;
  admin_uid UUID;
BEGIN
  -- Lấy user_id và admin_id
  SELECT id INTO user_uid FROM public.users WHERE sdt = '0912345678' AND role = 'user';
  SELECT id INTO admin_uid FROM public.users WHERE sdt = '0999999999' AND role = 'admin';

  -- Tạo 2 phiếu hoàn tiền mẫu
  IF user_uid IS NOT NULL THEN
    -- Phiếu 1: Đang chờ xử lý
    INSERT INTO public.refund_requests (
      user_id, user_sdt, display_name,
      bank_name, account_number, account_holder,
      amount, order_code, flight_date, ticket_number, passenger_name,
      status, refund_reason, created_at
    ) VALUES (
      user_uid, '0912345678', 'Nguyễn Văn A',
      'Vietcombank', '1234567890', 'Nguyễn Văn A',
      1450000, 'VN-2024-SGN-HAN-001', '2024-03-15', '6891234567890', 'Nguyễn Văn A',
      'pending', 'Hủy chuyến do công việc đột xuất', NOW()
    );

    -- Phiếu 2: Đã hoàn tiền thành công
    INSERT INTO public.refund_requests (
      user_id, user_sdt, display_name,
      bank_name, account_number, account_holder,
      amount, order_code, flight_date, ticket_number, passenger_name,
      status, refund_reason, admin_note, approved_by, approved_at, completed_by, completed_at, refund_slip_code,
      created_at
    ) VALUES (
      user_uid, '0912345678', 'Nguyễn Văn A',
      'Techcombank', '9876543210', 'Nguyễn Văn A',
      890000, 'VJ-2024-SGN-DAD-003', '2024-03-10', '6899876543210', 'Nguyễn Văn A',
      'completed', 'Thay đổi kế hoạch', 'Đã xác minh đủ điều kiện hoàn tiền', 
      'Quản trị viên', NOW() - INTERVAL '2 days', 
      'Quản trị viên', NOW() - INTERVAL '1 day', 
      'TT-' || TO_CHAR(NOW(), 'YYMMDD') || '-0001',
      NOW() - INTERVAL '3 days'
    );
  END IF;
END $$;

-- ============================================================
-- HOÀN TẤT
-- ============================================================
SELECT '✅ Database schema V2 đã hoàn tất!' AS status;
SELECT '📋 Tài khoản test:' AS info;
SELECT '   - Admin: SĐT 0999999999, Mật khẩu: Admin@123' AS admin_account;
SELECT '   - User: SĐT 0912345678, Mật khẩu: Admin@123' AS user_account;

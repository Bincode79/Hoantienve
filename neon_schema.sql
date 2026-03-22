-- ============================================================
-- NEON DATABASE SCHEMA — AEROREFUND (Neon + Supabase Auth)
-- Hướng 1: Giữ Supabase Auth, chỉ dùng Neon làm database
-- Run: psql hoặc script migrate_neon.ts
-- ============================================================

-- 0. CLEANUP — Xóa bảng cũ (nếu có) để migrate sạch
DROP TABLE IF EXISTS public.refund_requests CASCADE;
DROP TABLE IF EXISTS public.basedata       CASCADE;
DROP TABLE IF EXISTS public.chats          CASCADE;
DROP TABLE IF EXISTS public.messages       CASCADE;
DROP TABLE IF EXISTS public.audit_logs     CASCADE;
DROP TABLE IF EXISTS public.config          CASCADE;
DROP TABLE IF EXISTS public.airports        CASCADE;
DROP TABLE IF EXISTS public.airlines        CASCADE;
DROP TABLE IF EXISTS public.popular_routes  CASCADE;
DROP TABLE IF EXISTS public.users           CASCADE;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. USERS TABLE — Tự chứa auth (không phụ thuộc auth.users)
-- ============================================================
CREATE TABLE public.users (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  sdt          TEXT        UNIQUE,
  email        TEXT        UNIQUE NOT NULL,
  password_hash TEXT       NOT NULL,
  display_name TEXT,
  role         TEXT        DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status       TEXT        DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  fcm_token    TEXT,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  last_read_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Tự động update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Bật RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Helper: get current user ID từ JWT token (đặt trong search_path)
-- App gửi header: Authorization: Bearer <jwt>
-- Server sẽ SET LOCAL request.jwt.claims = decode_jwt(token)
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::UUID;
$$;

-- RLS Policies cho users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (public.current_user_id() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (public.current_user_id() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (public.current_user_id() = id);

CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

-- ============================================================
-- 3. REFUND_REQUESTS TABLE
-- ============================================================
CREATE TABLE public.refund_requests (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        REFERENCES public.users(id) ON DELETE CASCADE,

  -- Thông tin người dùng
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
  status           TEXT        DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  refund_reason    TEXT,
  is_visible       BOOLEAN     DEFAULT TRUE,

  -- Thông tin admin xử lý
  admin_note       TEXT,
  approved_by      TEXT,
  approved_at      TIMESTAMPTZ,
  processing_time  TIMESTAMPTZ,
  completed_by     TEXT,
  completed_at     TIMESTAMPTZ,
  refund_slip_code TEXT,
  transfer_note    TEXT,

  -- Timestamps
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.refund_requests
  FOR SELECT USING (public.current_user_id() = user_id);

CREATE POLICY "Users can insert own requests" ON public.refund_requests
  FOR INSERT WITH CHECK (public.current_user_id() = user_id);

CREATE POLICY "Users can update own pending requests" ON public.refund_requests
  FOR UPDATE USING (
    public.current_user_id() = user_id AND status = 'pending'
  );

CREATE POLICY "Admins can view all requests" ON public.refund_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all requests" ON public.refund_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

CREATE POLICY "Admins can delete requests" ON public.refund_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

-- ============================================================
-- 4. BASEDATA TABLE
-- ============================================================
CREATE TABLE public.basedata (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_code     TEXT        UNIQUE,
  amount         NUMERIC,
  passenger_name TEXT,
  flight_number  TEXT,
  status         TEXT        DEFAULT 'valid'
                        CHECK (status IN ('valid', 'refunded', 'cancelled')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER basedata_updated_at
  BEFORE UPDATE ON public.basedata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.basedata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read basedata" ON public.basedata
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage basedata" ON public.basedata
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

-- ============================================================
-- 5. CHATS TABLE
-- ============================================================
CREATE TABLE public.chats (
  id             TEXT        PRIMARY KEY,
  user_id        UUID        REFERENCES public.users(id) ON DELETE CASCADE,
  user_name      TEXT,
  last_message   TEXT,
  last_time      TIMESTAMPTZ,
  unread_count   INTEGER     DEFAULT 0
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat" ON public.chats
  FOR SELECT USING (public.current_user_id() = user_id);

CREATE POLICY "Admins can manage all chats" ON public.chats
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

-- ============================================================
-- 6. MESSAGES TABLE
-- ============================================================
CREATE TABLE public.messages (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id      TEXT        REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id    UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  sender_name  TEXT,
  sender_role  TEXT,
  text         TEXT,
  timestamp    TIMESTAMPTZ DEFAULT NOW(),
  is_read      BOOLEAN     DEFAULT FALSE
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    chat_id IN (SELECT id FROM public.chats WHERE user_id = public.current_user_id())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    chat_id IN (SELECT id FROM public.chats WHERE user_id = public.current_user_id())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

-- ============================================================
-- 7. AUDIT_LOGS TABLE
-- ============================================================
CREATE TABLE public.audit_logs (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id     UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  admin_email  TEXT,
  action       TEXT,
  target_id    TEXT,
  target_type  TEXT,
  changes      JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

CREATE POLICY "Admins insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

-- ============================================================
-- 8. CONFIG TABLE
-- ============================================================
CREATE TABLE public.config (
  id                   TEXT        PRIMARY KEY DEFAULT 'system',
  support_phone        TEXT,
  support_email        TEXT,
  working_hours        TEXT,
  brand_name           TEXT,
  footer_description   TEXT,
  copyright            TEXT,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER config_updated_at
  BEFORE UPDATE ON public.config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read config" ON public.config
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins update config" ON public.config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

CREATE POLICY "Admins insert config" ON public.config
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

-- ============================================================
-- 9. AIRPORTS TABLE
-- ============================================================
CREATE TABLE public.airports (
  id           TEXT        PRIMARY KEY,
  iata         TEXT        UNIQUE NOT NULL,
  name         TEXT        NOT NULL,
  city         TEXT        NOT NULL,
  region       TEXT        NOT NULL CHECK (region IN ('north', 'central', 'south')),
  region_label TEXT        NOT NULL,
  country      TEXT        NOT NULL DEFAULT 'Việt Nam'
);

ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read airports" ON public.airports
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage airports" ON public.airports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

-- ============================================================
-- 10. AIRLINES TABLE
-- ============================================================
CREATE TABLE public.airlines (
  code     TEXT        PRIMARY KEY,
  name     TEXT        NOT NULL,
  name_vn  TEXT,
  logo_url TEXT
);

ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read airlines" ON public.airlines
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage airlines" ON public.airlines
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

-- ============================================================
-- 11. POPULAR ROUTES TABLE
-- ============================================================
CREATE TABLE public.popular_routes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  from_iata   TEXT        REFERENCES public.airports(iata) NOT NULL,
  to_iata     TEXT        REFERENCES public.airports(iata) NOT NULL,
  price       NUMERIC     NOT NULL,
  airline     TEXT,
  is_active   BOOLEAN     DEFAULT TRUE,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.popular_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read popular routes" ON public.popular_routes
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage popular routes" ON public.popular_routes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = public.current_user_id() AND role = 'admin')
  );

-- ============================================================
-- 12. HELPER FUNCTIONS
-- ============================================================

-- Function đăng nhập bằng SĐT → trả về email
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

-- ============================================================
-- 13. SEED DATA — Test accounts
-- Default password: Admin@123
-- ============================================================

-- Bcrypt hash cho "Admin@123" (cost factor 12)
DO $$
DECLARE
  admin_pass TEXT := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4bKHJyOs/ztKPF3.';
BEGIN

  -- ADMIN 1: Nguyễn Văn Minh (SĐT: 0999999999)
  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES (
    '0999999999',
    '0999999999@app.aerorefund.local',
    admin_pass,
    'Nguyễn Văn Minh',
    'admin',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    password_hash = admin_pass,
    display_name  = 'Nguyễn Văn Minh',
    role          = 'admin';

  -- ADMIN 2: Trần Thị Lan (SĐT: 0383165313)
  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES (
    '0383165313',
    '0383165313@app.aerorefund.local',
    admin_pass,
    'Trần Thị Lan',
    'admin',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    password_hash = admin_pass,
    display_name  = 'Trần Thị Lan',
    role          = 'admin';

  -- ADMIN 3: Lê Hoàng Nam (SĐT: 0968686868)
  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES (
    '0968686868',
    '0968686868@app.aerorefund.local',
    admin_pass,
    'Lê Hoàng Nam',
    'admin',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    password_hash = admin_pass,
    display_name  = 'Lê Hoàng Nam',
    role          = 'admin';

  -- USER 1: Phạm Thị Mai (SĐT: 0912345678)
  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES (
    '0912345678',
    '0912345678@app.aerorefund.local',
    admin_pass,
    'Phạm Thị Mai',
    'user',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    password_hash = admin_pass,
    display_name  = 'Phạm Thị Mai';

  -- USER 2: Hoàng Đức Anh (SĐT: 0933888999)
  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES (
    '0933888999',
    '0933888999@app.aerorefund.local',
    admin_pass,
    'Hoàng Đức Anh',
    'user',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    password_hash = admin_pass,
    display_name  = 'Hoàng Đức Anh';

END $$;

-- ============================================================
-- SEED: BASEDATA
-- ============================================================
INSERT INTO public.basedata (order_code, amount, passenger_name, flight_number, status, created_at) VALUES
  ('VN-2024-SGN-HAN-001', 1450000, 'Nguyễn Văn Minh',   'VN601',  'valid',    NOW() - INTERVAL '10 days'),
  ('VN-2024-HAN-SGN-002', 1380000, 'Trần Thị Lan',        'VN602',  'valid',    NOW() - INTERVAL '9 days'),
  ('VJ-2024-SGN-DAD-003',  890000, 'Lê Hoàng Nam',        'VJ541',  'valid',    NOW() - INTERVAL '8 days'),
  ('QH-2024-HAN-UIH-004',  650000, 'Phạm Thị Mai',         'QH1523', 'valid',    NOW() - INTERVAL '7 days'),
  ('VN-2024-DAD-SGN-005', 1720000, 'Hoàng Đức Anh',       'VN683',  'valid',    NOW() - INTERVAL '6 days'),
  ('VJ-2024-SGN-PXU-006',  780000, 'Nguyễn Thị Hương',   'VJ311',  'valid',    NOW() - INTERVAL '5 days'),
  ('VN-2024-HAN-CXR-007', 1100000, 'Trần Đình Khoa',      'VN1892', 'valid',    NOW() - INTERVAL '4 days'),
  ('QH-2024-SGN-PQC-008',  550000, 'Lê Thị Thu',            'QH1841', 'valid',    NOW() - INTERVAL '3 days'),
  ('VJ-2024-HAN-DAD-009',  950000, 'Phạm Văn Hùng',         'VJ241',  'valid',    NOW() - INTERVAL '2 days'),
  ('VN-2024-SGN-VCA-010',  720000, 'Ngô Thị Lan',            'VN1403', 'valid',    NOW() - INTERVAL '1 day'),
  ('VN-2024-HAN-SGN-011', 1500000, 'Đặng Đức Thắng',       'VN605',  'valid',    NOW() - INTERVAL '12 hours'),
  ('VJ-2024-SGN-HAN-012', 1250000, 'Vũ Thị Mai',             'VJ501',  'valid',    NOW() - INTERVAL '6 hours'),
  ('VN-2024-SGN-HAN-013', 1350000, 'Bùi Văn Tân',           'VN609',  'refunded', NOW() - INTERVAL '15 days'),
  ('VN-2024-DAD-HAN-014', 1050000, 'Trịnh Thị Phương',      'VN1632', 'valid',    NOW() - INTERVAL '20 hours'),
  ('QH-2024-SGN-DAD-015',  820000, 'Nguyễn Đình Hùng',     'QH151',  'valid',    NOW() - INTERVAL '4 hours')
ON CONFLICT (order_code) DO NOTHING;

-- ============================================================
-- SEED: CONFIG
-- ============================================================
INSERT INTO public.config (id, support_phone, support_email, working_hours, brand_name, footer_description, copyright)
VALUES (
  'system',
  '1900 6091',
  'hotro@aerorefund.com',
  '0h - 24h',
  'TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆT NAM',
  'Hệ thống quản lý đại lý & hoàn vé máy bay tự động',
  '© 2026 TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆT NAM — Hệ thống quản lý đại lý & hoàn vé tự động.'
)
ON CONFLICT (id) DO UPDATE SET
  support_phone       = EXCLUDED.support_phone,
  support_email      = EXCLUDED.support_email,
  working_hours      = EXCLUDED.working_hours,
  brand_name         = EXCLUDED.brand_name,
  footer_description  = EXCLUDED.footer_description,
  copyright          = EXCLUDED.copyright;

-- ============================================================
-- SEED: AIRPORTS
-- ============================================================
INSERT INTO public.airports (id, iata, name, city, region, region_label, country) VALUES
  ('han', 'HAN', 'Sân bay quốc tế Nội Bài',        'Hà Nội',          'north',   'Miền Bắc',   'Việt Nam'),
  ('hph', 'HPH', 'Sân bay quốc tế Cát Bi',           'Hải Phòng',       'north',   'Miền Bắc',   'Việt Nam'),
  ('vdh', 'VDH', 'Sân bay Đồng Hới',                 'Đồng Hới',        'north',   'Miền Bắc',   'Việt Nam'),
  ('thd', 'THD', 'Sân bay Thọ Quản',                 'Thanh Hóa',       'north',   'Miền Bắc',   'Việt Nam'),
  ('din', 'DIN', 'Sân bay Điện Biên Phủ',            'Điện Biên',       'north',   'Miền Bắc',   'Việt Nam'),
  ('dad', 'DAD', 'Sân bay quốc tế Đà Nẵng',          'Đà Nẵng',         'central', 'Miền Trung', 'Việt Nam'),
  ('vcl', 'VCL', 'Sân bay Chu Lai',                  'Tam Kỳ',          'central', 'Miền Trung', 'Việt Nam'),
  ('hui', 'HUI', 'Sân bay Phú Bài',                  'Huế',             'central', 'Miền Trung', 'Việt Nam'),
  ('tbb', 'TBB', 'Sân bay Tuy Hòa',                  'Tuy Hòa',         'central', 'Miền Trung', 'Việt Nam'),
  ('uih', 'UIH', 'Sân bay Pleiku',                   'Pleiku',          'central', 'Miền Trung', 'Việt Nam'),
  ('cxr', 'CXR', 'Sân bay Cam Ranh',                  'Nha Trang',       'central', 'Miền Trung', 'Việt Nam'),
  ('bmv', 'BMV', 'Sân bay Buôn Ma Thuột',             'Buôn Ma Thuột',   'central', 'Miền Trung', 'Việt Nam'),
  ('sgn', 'SGN', 'Sân bay quốc tế Tân Sơn Nhất',     'Hồ Chí Minh',     'south',   'Miền Nam',   'Việt Nam'),
  ('vca', 'VCA', 'Sân bay quốc tế Cần Thơ',          'Cần Thơ',         'south',   'Miền Nam',   'Việt Nam'),
  ('pqc', 'PQC', 'Sân bay quốc tế Phú Quốc',         'Phú Quốc',        'south',   'Miền Nam',   'Việt Nam'),
  ('vkg', 'VKG', 'Sân bay Rạch Giá',                 'Rạch Giá',        'south',   'Miền Nam',   'Việt Nam'),
  ('sqr', 'SQR', 'Sân bay Sóc Trăng',                'Sóc Trăng',       'south',   'Miền Nam',   'Việt Nam'),
  ('cmt', 'CMT', 'Sân bay Cà Mau',                    'Cà Mau',          'south',   'Miền Nam',   'Việt Nam'),
  ('cah', 'CAH', 'Sân bay Côn Đảo',                  'Côn Đảo',         'south',   'Miền Nam',   'Việt Nam')
ON CONFLICT (id) DO UPDATE SET
  name  = EXCLUDED.name,
  city  = EXCLUDED.city,
  region = EXCLUDED.region;

-- ============================================================
-- SEED: AIRLINES
-- ============================================================
INSERT INTO public.airlines (code, name, name_vn) VALUES
  ('VN', 'Vietnam Airlines',     'Hãng Hàng Không Quốc Gia Việt Nam'),
  ('VJ', 'VietJet Air',           'VietJet Air JSC'),
  ('QH', 'Bamboo Airways',       'Hãng Hàng Không Tre Việt Nam'),
  ('BL', 'Jetstar Pacific',       'Hãng Hàng Không Jetstar Pacific'),
  ('VU', 'Vietravel Airlines',   'Vietravel Airlines')
ON CONFLICT (code) DO UPDATE SET
  name   = EXCLUDED.name,
  name_vn = EXCLUDED.name_vn;

-- ============================================================
-- SEED: POPULAR ROUTES
-- ============================================================
INSERT INTO public.popular_routes (from_iata, to_iata, price, airline, sort_order) VALUES
  ('SGN', 'HAN', 790000, 'Vietnam Airlines', 1),
  ('HAN', 'DAD', 390000, 'VietJet Air',      2),
  ('SGN', 'DAD', 490000, 'Vietnam Airlines', 3),
  ('HAN', 'CXR', 550000, 'VietJet Air',      4),
  ('SGN', 'PQC', 450000, 'Bamboo Airways',   5),
  ('DAD', 'SGN', 480000, 'VietJet Air',      6),
  ('SGN', 'VCA', 420000, 'Vietnam Airlines', 7),
  ('HAN', 'SGN', 780000, 'Vietnam Airlines', 8),
  ('SGN', 'UIH', 380000, 'VietJet Air',      9),
  ('SGN', 'CXR', 520000, 'Bamboo Airways',   10)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: REFUND REQUESTS (for user accounts)
-- ============================================================
INSERT INTO public.refund_requests (
  user_id, user_sdt, display_name,
  bank_name, account_number, account_holder, amount, order_code,
  status, refund_reason, flight_date, ticket_number, passenger_name,
  created_at, admin_note, approved_by, approved_at, completed_by, completed_at, refund_slip_code
)
SELECT
  u.id, u.sdt, u.display_name,
  CASE (rn)
    WHEN 1 THEN 'Vietcombank'
    WHEN 2 THEN 'Techcombank'
    WHEN 3 THEN 'VPBank'
    WHEN 4 THEN 'ACB'
  END,
  '123456' || LPAD(CAST(rn AS TEXT), 4, '0'),
  u.display_name,
  CASE (rn)
    WHEN 1 THEN 1450000 WHEN 2 THEN 1380000 WHEN 3 THEN 890000 WHEN 4 THEN 650000
  END,
  CASE (rn)
    WHEN 1 THEN 'VN-2024-SGN-HAN-001'
    WHEN 2 THEN 'VN-2024-HAN-SGN-002'
    WHEN 3 THEN 'VJ-2024-SGN-DAD-003'
    WHEN 4 THEN 'QH-2024-HAN-UIH-004'
  END,
  CASE (rn)
    WHEN 1 THEN 'pending'
    WHEN 2 THEN 'approved'
    WHEN 3 THEN 'processing'
    WHEN 4 THEN 'completed'
  END,
  'Hủy chuyến do công việc đột xuất',
  (CURRENT_DATE + (rn * INTERVAL '3 days'))::TEXT,
  '689' || LPAD(CAST(rn AS TEXT), 10, '0'),
  u.display_name,
  NOW() - (rn * INTERVAL '5 hours'),
  CASE WHEN rn = 2 THEN 'Đã xác minh đủ điều kiện hoàn' END,
  CASE WHEN rn = 2 THEN 'Nguyễn Văn Minh' END,
  CASE WHEN rn = 2 THEN NOW() - INTERVAL '2 hours' END,
  CASE WHEN rn = 4 THEN 'Nguyễn Văn Minh' END,
  CASE WHEN rn = 4 THEN NOW() - INTERVAL '30 minutes' END,
  CASE WHEN rn = 4 THEN 'TT-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(CAST(rn AS TEXT), 4, '0') END
FROM public.users u
CROSS JOIN generate_series(1, 4) AS rn
WHERE u.role = 'user';

-- ============================================================
-- DONE
-- ============================================================
SELECT '✅ Schema đã migrate lên Neon thành công!' AS status;
SELECT '📋 Tài khoản test:' AS info;
SELECT '   Admin: SĐT 0999999999 | 0383165313 | 0968686868 — Mật khẩu: Admin@123' AS admin_accounts;
SELECT '   User:  SĐT 0912345678 | 0933888999        — Mật khẩu: Admin@123' AS user_accounts;

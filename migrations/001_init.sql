-- ============================================================
-- INIT SCHEMA — AEROREFUND (Neon PostgreSQL)
-- Chỉ tạo bảng nếu chưa tồn tại (không xóa data)
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Function tự động update updated_at (REPLACE để cập nhật nếu đã có)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  sdt            TEXT        UNIQUE,
  email          TEXT        UNIQUE NOT NULL,
  password_hash   TEXT        NOT NULL,
  display_name   TEXT,
  role           TEXT        DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status         TEXT        DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  fcm_token      TEXT,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  last_read_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger (tạo lại nếu chưa có)
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- REFUND_REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        REFERENCES public.users(id) ON DELETE CASCADE,
  user_sdt         TEXT,
  display_name     TEXT,
  bank_name        TEXT,
  account_number   TEXT,
  account_holder   TEXT,
  order_code       TEXT,
  amount           NUMERIC,
  flight_date      TEXT,
  ticket_number    TEXT,
  passenger_name   TEXT,
  status           TEXT        DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  refund_reason    TEXT,
  is_visible       BOOLEAN     DEFAULT TRUE,
  admin_note       TEXT,
  approved_by      TEXT,
  approved_at      TIMESTAMPTZ,
  processing_time  TIMESTAMPTZ,
  completed_by     TEXT,
  completed_at     TIMESTAMPTZ,
  refund_slip_code TEXT,
  transfer_note    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS refund_requests_updated_at ON public.refund_requests;
CREATE TRIGGER refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- BASEDATA TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.basedata (
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

DROP TRIGGER IF EXISTS basedata_updated_at ON public.basedata;
CREATE TRIGGER basedata_updated_at
  BEFORE UPDATE ON public.basedata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- AUDIT_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id     UUID       REFERENCES public.users(id) ON DELETE SET NULL,
  admin_email  TEXT,
  action       TEXT,
  target_id    TEXT,
  target_type  TEXT,
  changes      JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHATS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chats (
  id            TEXT        PRIMARY KEY,
  user_id       UUID       REFERENCES public.users(id) ON DELETE CASCADE,
  user_name     TEXT,
  last_message  TEXT,
  last_time     TIMESTAMPTZ,
  unread_count  INTEGER     DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate indexes (IF NOT EXISTS không cần thiết vì indexes đã có IF NOT EXISTS trong definition)
DROP INDEX IF EXISTS idx_chats_user_id;
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
DROP INDEX IF EXISTS idx_chats_last_time;
CREATE INDEX idx_chats_last_time ON public.chats(last_time DESC NULLS LAST);

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id      TEXT        REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id    UUID,
  sender_name  TEXT,
  sender_role  TEXT,
  text         TEXT,
  timestamp    TIMESTAMPTZ DEFAULT NOW(),
  is_read      BOOLEAN     DEFAULT FALSE
);

DROP INDEX IF EXISTS idx_messages_chat_id;
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
DROP INDEX IF EXISTS idx_messages_timestamp;
CREATE INDEX idx_messages_timestamp ON public.messages(timestamp ASC);

-- ============================================================
-- CONFIG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.config (
  id                   TEXT        PRIMARY KEY DEFAULT 'system',
  support_phone        TEXT,
  support_email        TEXT,
  working_hours        TEXT,
  brand_name           TEXT,
  footer_description   TEXT,
  copyright            TEXT,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS config_updated_at ON public.config;
CREATE TRIGGER config_updated_at
  BEFORE UPDATE ON public.config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- AIRPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.airports (
  id           TEXT        PRIMARY KEY,
  iata         TEXT        UNIQUE NOT NULL,
  name         TEXT        NOT NULL,
  city         TEXT        NOT NULL,
  region       TEXT        NOT NULL CHECK (region IN ('north', 'central', 'south')),
  region_label TEXT        NOT NULL,
  country      TEXT        NOT NULL DEFAULT 'Việt Nam'
);

-- ============================================================
-- AIRLINES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.airlines (
  code     TEXT        PRIMARY KEY,
  name     TEXT        NOT NULL,
  name_vn  TEXT,
  logo_url TEXT
);

-- ============================================================
-- POPULAR ROUTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.popular_routes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  from_iata   TEXT        REFERENCES public.airports(iata) NOT NULL,
  to_iata     TEXT        REFERENCES public.airports(iata) NOT NULL,
  price       NUMERIC     NOT NULL,
  airline     TEXT,
  is_active   BOOLEAN     DEFAULT TRUE,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED: TEST ACCOUNTS
-- Default password for ALL accounts (admin & user): Admin@123
-- Default password for user accounts: User@123
-- ============================================================
DO $$
DECLARE
  admin_pass TEXT := '$2b$12$1HHbEdTN4GBES95ezdtKi.FCQKVuf1k5eV3xVw6eFTjiVomYD0vOO';
  user_pass  TEXT := '$2b$12$WHxEmpdB2mpqr4fxQ3IuDuEGHUVdq28hlIplMWIICGw6DHsgKIeZa';
BEGIN
  -- Admin accounts (5)
  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES ('0999999999', '0999999999@app.aerorefund.local', admin_pass, 'Nguyễn Văn Minh', 'admin', 'active')
  ON CONFLICT (sdt) DO UPDATE SET password_hash = admin_pass, display_name = 'Nguyễn Văn Minh', role = 'admin', status = 'active';

  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES ('0383165313', '0383165313@app.aerorefund.local', admin_pass, 'Trần Thị Lan', 'admin', 'active')
  ON CONFLICT (sdt) DO UPDATE SET password_hash = admin_pass, display_name = 'Trần Thị Lan', role = 'admin', status = 'active';

  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES ('0968686868', '0968686868@app.aerorefund.local', admin_pass, 'Lê Hoàng Nam', 'admin', 'active')
  ON CONFLICT (sdt) DO UPDATE SET password_hash = admin_pass, display_name = 'Lê Hoàng Nam', role = 'admin', status = 'active';

  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES ('0912345678', '0912345678@app.aerorefund.local', admin_pass, 'Phạm Văn Đức', 'admin', 'active')
  ON CONFLICT (sdt) DO UPDATE SET password_hash = admin_pass, display_name = 'Phạm Văn Đức', role = 'admin', status = 'active';

  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES ('0977777777', '0977777777@app.aerorefund.local', admin_pass, 'Ngô Thị Hương', 'admin', 'active')
  ON CONFLICT (sdt) DO UPDATE SET password_hash = admin_pass, display_name = 'Ngô Thị Hương', role = 'admin', status = 'active';

  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES ('0988888888', '0988888888@app.aerorefund.local', admin_pass, 'Đặng Minh Tuấn', 'admin', 'active')
  ON CONFLICT (sdt) DO UPDATE SET password_hash = admin_pass, display_name = 'Đặng Minh Tuấn', role = 'admin', status = 'active';

  -- User accounts (2)
  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES ('0901001001', '0901001001@app.aerorefund.local', user_pass, 'Phạm Thị Mai', 'user', 'active')
  ON CONFLICT (sdt) DO UPDATE SET password_hash = user_pass, display_name = 'Phạm Thị Mai', role = 'user', status = 'active';

  INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
  VALUES ('0902002002', '0902002002@app.aerorefund.local', user_pass, 'Hoàng Đức Anh', 'user', 'active')
  ON CONFLICT (sdt) DO UPDATE SET password_hash = user_pass, display_name = 'Hoàng Đức Anh', role = 'user', status = 'active';
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
  support_phone      = EXCLUDED.support_phone,
  support_email     = EXCLUDED.support_email,
  working_hours     = EXCLUDED.working_hours,
  brand_name        = EXCLUDED.brand_name,
  footer_description = EXCLUDED.footer_description,
  copyright         = EXCLUDED.copyright;

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
  name   = EXCLUDED.name,
  city   = EXCLUDED.city,
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
-- DONE
-- ============================================================
SELECT '✅ Database initialized!' AS status;

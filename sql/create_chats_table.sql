-- Quick fix: Create missing chats and messages tables
-- Run this against the Neon database

-- 1. Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id             TEXT        PRIMARY KEY,
  user_id        UUID        REFERENCES public.users(id) ON DELETE CASCADE,
  user_name      TEXT,
  last_message   TEXT,
  last_time      TIMESTAMPTZ,
  unread_count   INTEGER     DEFAULT 0
);

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id      TEXT        REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id    UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  sender_name  TEXT,
  sender_role  TEXT,
  text         TEXT,
  timestamp    TIMESTAMPTZ DEFAULT NOW(),
  is_read      BOOLEAN     DEFAULT FALSE
);

-- 3. Create index on messages for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);

-- 4. Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id     UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  admin_email  TEXT,
  action       TEXT,
  target_id    TEXT,
  target_type  TEXT,
  changes      JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- 5. Create config table if not exists
CREATE TABLE IF NOT EXISTS public.config (
  id                 TEXT        PRIMARY KEY,
  support_phone      TEXT,
  support_email      TEXT,
  working_hours      TEXT,
  brand_name         TEXT,
  footer_description TEXT,
  copyright          TEXT
);

-- Insert default config if not exists
INSERT INTO public.config (id, brand_name, support_phone, copyright)
VALUES ('system', 'TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆT NAM', '1900 xxxx', '© 2024')
ON CONFLICT (id) DO NOTHING;

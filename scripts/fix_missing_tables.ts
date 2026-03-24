import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { db } from '../server/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('[Migrate] Creating missing tables...');

  const sql = `
-- 1. Create chats table (id as TEXT to match server expectations)
CREATE TABLE IF NOT EXISTS public.chats (
  id            TEXT        PRIMARY KEY,
  user_id       UUID        REFERENCES public.users(id) ON DELETE CASCADE,
  user_name     TEXT,
  last_message  TEXT,
  last_time     TIMESTAMPTZ,
  unread_count  INTEGER     DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_time ON public.chats(last_time DESC NULLS LAST);

-- 2. Create messages table
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

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp ASC);

-- 3. Create audit_logs table if not exists
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 4. Create config table if not exists
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
`;

  try {
    await db.query(sql);
    console.log('[Migrate] ✅ Tables created successfully!');
  } catch (err) {
    console.error('[Migrate] ❌ Migration failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();

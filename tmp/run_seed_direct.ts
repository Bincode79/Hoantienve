import pg from 'pg';
import { readFileSync } from 'fs';
import 'dotenv/config';

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('🚀 Connecting to Supabase PostgreSQL...');
console.log('📦 Database:', DATABASE_URL.split('@')[1]?.split(':')[0] || 'unknown');

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected!\n');

    const sql = readFileSync('./tmp/supabase_seed.sql', 'utf8');
    
    console.log('📝 Running seed script...');
    await client.query(sql);
    
    console.log('\n✅ SEED HOÀN TẤT!\n');
    console.log('📋 Tài khoản đăng nhập:');
    console.log('   Admin 1 — SĐT: 0999999999 — Mật khẩu: Admin@123');
    console.log('   Admin 2 — SĐT: 0383165313 — Mật khẩu: Admin@123');
    console.log('   Admin 3 — SĐT: 0968686868 — Mật khẩu: Admin@123');
    console.log('   User 1  — SĐT: 0912345678 — Mật khẩu: Admin@123');
    console.log('   User 2  — SĐT: 0933888999 — Mật khẩu: Admin@123');

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

run();

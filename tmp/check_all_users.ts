import { Pool } from 'pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function main() {
  const result = await pool.query(
    `SELECT id, sdt, email, display_name, role, status, password_hash FROM public.users ORDER BY created_at`
  );
  
  console.log('\n=== Users in database ===');
  for (const u of result.rows) {
    const test1 = await bcrypt.compare('Admin@123', u.password_hash);
    const test2 = await bcrypt.compare('123456', u.password_hash);
    console.log(`\n● ${u.display_name} (${u.sdt})`);
    console.log(`   Role: ${u.role} | Status: ${u.status}`);
    console.log(`   Admin@123: ${test1 ? '✓' : '✗'} | 123456: ${test2 ? '✓' : '✗'}`);
  }
  
  await pool.end();
}
main().catch(console.error);

import { Pool } from 'pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function main() {
  // Generate hash for User@123
  const password = 'User@123';
  const hash = await bcrypt.hash(password, 12);
  console.log('Generated hash for', password + ':', hash);
  
  // Update all user accounts with correct hash
  const result = await pool.query(
    `UPDATE public.users SET password_hash = $1 WHERE role = 'user' RETURNING sdt, display_name`,
    [hash]
  );
  
  console.log('\nUpdated users:');
  result.rows.forEach(u => console.log(' -', u.sdt, '-', u.display_name));
  
  // Verify
  const verify = await pool.query(
    `SELECT sdt, password_hash FROM public.users WHERE sdt = '0912345678' LIMIT 1`
  );
  if (verify.rows.length > 0) {
    const match = await bcrypt.compare('User@123', verify.rows[0].password_hash);
    console.log('\nPassword verification for 0912345678:', match ? '✅ SUCCESS' : '❌ FAILED');
  }
  
  await pool.end();
}

main().catch(console.error);

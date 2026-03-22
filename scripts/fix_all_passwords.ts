import { Pool } from 'pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function main() {
  const password = 'Admin@123';
  const hash = await bcrypt.hash(password, 12);
  console.log('Generated hash for', password + ':', hash);
  
  // Update all admin accounts with correct hash
  const result = await pool.query(
    `UPDATE public.users SET password_hash = $1 WHERE role = 'admin' RETURNING sdt, display_name`,
    [hash]
  );
  
  console.log('\nUpdated admins:');
  result.rows.forEach(u => console.log(' -', u.sdt, '-', u.display_name));
  
  // Also update all users
  const userResult = await pool.query(
    `UPDATE public.users SET password_hash = $1 WHERE role = 'user' RETURNING sdt, display_name`,
    [hash.replace('Admin@123', 'User@123')]
  );
  
  console.log('\nUpdated users:');
  userResult.rows.forEach(u => console.log(' -', u.sdt, '-', u.display_name));
  
  await pool.end();
  console.log('\n✅ All passwords fixed!');
}

main().catch(console.error);

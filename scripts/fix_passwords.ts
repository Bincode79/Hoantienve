import { Pool } from 'pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function main() {
  // Generate correct hash
  const password = 'Admin@123';
  const hash = await bcrypt.hash(password, 12);
  console.log('Generated hash:', hash);

  // Test it
  const test = await bcrypt.compare(password, hash);
  console.log('Verification:', test ? 'OK' : 'FAILED');

  // Update all users with the correct hash
  const result = await pool.query(
    `UPDATE public.users SET password_hash = $1 RETURNING id, sdt, display_name, role`,
    [hash]
  );
  console.log('\nUpdated users:');
  result.rows.forEach(u => console.log(`  ${u.sdt} - ${u.display_name} (${u.role})`));

  await pool.end();
}

main().catch(console.error);

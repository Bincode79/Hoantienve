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
    `SELECT id, sdt, email, password_hash FROM public.users WHERE sdt = '0999999999' LIMIT 1`
  );
  
  if (result.rows.length === 0) {
    console.log('User not found');
  } else {
    const user = result.rows[0];
    console.log('User:', user.sdt, user.email);
    console.log('Hash in DB:', user.password_hash);
    
    // Test password
    const test = await bcrypt.compare('Admin@123', user.password_hash);
    console.log('Password match:', test);
    
    // Generate correct hash
    const newHash = await bcrypt.hash('Admin@123', 12);
    console.log('New hash:', newHash);
  }
  
  await pool.end();
}

main().catch(console.error);

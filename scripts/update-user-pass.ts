// Update user passwords
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateUserPasswords() {
  const hash = '$2b$12$BBfJMTSWl3wDKzC4ycrz7uMzBYEVeAEIXCLy4YkFjbhxliE2dER8q';
  
  try {
    await pool.query('UPDATE public.users SET password_hash = $1 WHERE role = $2', [hash, 'user']);
    const result = await pool.query('SELECT sdt, display_name, role FROM public.users WHERE role = $1', ['user']);
    console.log('✅ Updated user accounts:');
    result.rows.forEach(r => console.log('  -', r.sdt, '-', r.display_name));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

updateUserPasswords();

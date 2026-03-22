// Update admin passwords
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updatePasswords() {
  const hash = '$2b$12$qGs4tb39gRnTzDsBC9othe74.r.UetzhH0eMGmIGnb.frVfGkKrVG';
  
  try {
    await pool.query('UPDATE public.users SET password_hash = $1 WHERE role = $2', [hash, 'admin']);
    const result = await pool.query('SELECT sdt, display_name, role FROM public.users WHERE role = $1', ['admin']);
    console.log('✅ Updated admin accounts:');
    result.rows.forEach(r => console.log('  -', r.sdt, '-', r.display_name));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

updatePasswords();

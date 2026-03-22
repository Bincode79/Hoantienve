import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function main() {
  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  if (result.rows.length === 0) {
    console.log('📭 Database trống — chưa có bảng nào.');
  } else {
    console.log('📦 Các bảng hiện có trong Neon:');
    result.rows.forEach(row => console.log('  -', row.table_name));
  }

  await pool.end();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

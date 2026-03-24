import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('--- DANH SÁCH TÀI KHOẢN ---');
  const result = await pool.query(`
    SELECT sdt, email, display_name, role, status
    FROM public.users
    ORDER BY role, sdt;
  `);

  if (result.rows.length === 0) {
    console.log('📭 Không tìm thấy tài khoản nào.');
  } else {
    result.rows.forEach(row => {
      console.log(`[${row.role.toUpperCase()}] SDT: ${row.sdt} | Tên: ${row.display_name} | Trạng thái: ${row.status}`);
    });
  }

  await pool.end();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

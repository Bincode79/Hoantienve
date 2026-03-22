import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function runSchema() {
  const schemaPath = path.join(process.cwd(), 'neon_schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('📤 Migrating schema to Neon...');
  console.log('   Database:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

  const start = Date.now();

  try {
    await pool.query(sql);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    console.log(`\n✅ Migration hoàn tất trong ${elapsed}s!`);

    // Verify tables created
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name NOT IN ('playing_with_neon')
      ORDER BY table_name;
    `);

    console.log(`\n✅ Migration hoàn tất trong ${elapsed}s!`);
    console.log('📦 Các bảng đã tạo:');
    tables.rows.forEach(row => console.log('   -', row.table_name));

    // Count rows
    for (const table of ['users', 'basedata', 'refund_requests', 'airports', 'airlines', 'config']) {
      const r = await pool.query(`SELECT COUNT(*) as cnt FROM public.${table}`);
      console.log(`   ${table}: ${r.rows[0].cnt} rows`);
    }
  } catch (e: any) {
    console.error('❌ Migration failed:', e.message);
    if (e.message.includes('already exists')) {
      console.log('\n💡 Gợi ý: Schema có thể đã tồn tại. Muốn xóa và migrate lại?');
    }
    process.exit(1);
  }

  await pool.end();
}

runSchema();

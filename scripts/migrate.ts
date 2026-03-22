import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { db } from '../server/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('[Migrate] Starting database migration...');

  const sqlPath = path.join(__dirname, '..', 'migrations', '001_init.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  try {
    await db.query(sql);
    console.log('[Migrate] ✅ Migration completed successfully!');
  } catch (err) {
    console.error('[Migrate] ❌ Migration failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();

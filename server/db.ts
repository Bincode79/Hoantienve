import { Pool } from 'pg';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL not set in environment');
}

export const db = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

db.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err);
});

export async function query<T = any>(text: string, params?: any[]) {
  const start = Date.now();
  const res = await db.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB]', text.slice(0, 60) + '...', `(${duration}ms)`, res.rowCount, 'rows');
  }
  return res;
}

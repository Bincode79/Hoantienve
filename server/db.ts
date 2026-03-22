import { Pool, PoolConfig } from 'pg';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;

function createPool() {
  if (!DATABASE_URL) {
    console.error('[DB] DATABASE_URL is not set — database queries will fail');
    return null;
  }
  try {
    const config: PoolConfig = {
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
    return new Pool(config);
  } catch (err) {
    console.error('[DB] Failed to create pool:', err);
    return null;
  }
}

export const db = createPool();

db?.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err);
});

export async function query<T = any>(text: string, params?: any[]) {
  if (!db) {
    throw new Error('Database pool not initialized: DATABASE_URL is missing');
  }
  const start = Date.now();
  const res = await db.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB]', text.slice(0, 60) + '...', `(${duration}ms)`, res.rowCount, 'rows');
  }
  return res;
}

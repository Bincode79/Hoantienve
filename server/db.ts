import { Pool, PoolConfig } from 'pg';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;

const pool: Pool | null = (() => {
  if (!DATABASE_URL) {
    console.error('[DB] DATABASE_URL is not set — database will be unavailable');
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
    const p = new Pool(config);
    p.on('error', (err) => console.error('[DB] Unexpected error on idle client:', err));
    return p;
  } catch (err) {
    console.error('[DB] Failed to create pool:', err);
    return null;
  }
})();

export const db = {
  query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
    if (!pool) {
      return Promise.reject(new Error('Database pool not initialized: DATABASE_URL is missing'));
    }
    const start = Date.now();
    return pool.query<T>(text, params).then((res) => {
      const duration = Date.now() - start;
      if (process.env.NODE_ENV !== 'production') {
        console.log('[DB]', text.slice(0, 60) + '...', `(${duration}ms)`, res.rowCount, 'rows');
      }
      return res;
    });
  },
};

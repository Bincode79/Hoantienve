import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_nJX6shucg2Hm@ep-small-math-an2837qp.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require' });
client.connect()
  .then(() => client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'auth'"))
  .then(res => { console.log("AUTH SCHEMAS: ", res.rows); return client.end(); })
  .catch(console.error);

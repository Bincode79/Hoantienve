import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function checkAdmin() {
  try {
    await client.connect();
    console.log('--- ALL USERS in public.users ---');
    const res = await client.query("SELECT sdt, email, role, status FROM public.users");
    console.table(res.rows);
    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAdmin();

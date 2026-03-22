import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function checkAdmin() {
  try {
    await client.connect();
    console.log('--- Checking for Admin Accounts in public.users ---');
    const res = await client.query("SELECT id, sdt, email, role, status, display_name FROM public.users WHERE role = 'admin'");
    console.table(res.rows);
    
    console.log('\n--- Checking for all user accounts ---');
    const resAll = await client.query("SELECT sdt, email, role FROM public.users LIMIT 5");
    console.table(resAll.rows);

    await client.end();
  } catch (err) {
    console.error('Error connecting or querying:', err);
  }
}

checkAdmin();

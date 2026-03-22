import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing ENV vars!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function clearDB() {
  console.log("Starting database wipe...");
  
  // 1. Delete all records from public tables
  const tables = ['messages', 'chats', 'refund_requests', 'basedata', 'users'];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', 'dummy_value_that_does_not_exist');
    if (error) {
      console.warn(`Could not clear table ${table}:`, error.message);
    } else {
      console.log(`Cleared table ${table}`);
    }
  }

  // 2. Delete all Auth Users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
  } else if (users) {
    for (const u of users) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
      if (delErr) console.warn("Could not delete user", u.email, delErr.message);
    }
    console.log(`Deleted ${users.length} auth users.`);
  }

  console.log("Database wipe completed!");
}

clearDB();

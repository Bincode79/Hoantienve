import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seed() {
  const admins = [
    { phone: '0999999999', name: 'Nguyễn Văn Minh' },
    { phone: '0383165313', name: 'Trần Thị Lan' },
    { phone: '0968686868', name: 'Lê Hoàng Nam' },
  ];

  for (const admin of admins) {
    const email = `${admin.phone}@app.aerorefund.local`;
    const pass = 'Admin@123';
    
    console.log(`\nProcessing admin ${admin.phone} (${email}) ...`);
    
    // Check if user exists
    const { data: usersData, error: checkErr } = await supabase.auth.admin.listUsers();
    
    if (checkErr) { 
      console.error('Error fetching users:', checkErr); 
      continue; 
    }
    
    let user = usersData.users.find(u => u.email === email);
    
    if (!user) {
      console.log('User not found. Creating new auth account...');
      const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: pass,
        email_confirm: true,
        user_metadata: {
          sdt: admin.phone,
          displayName: admin.name,
          role: 'admin',
          status: 'active'
        }
      });
      if (error) { 
        console.error('Create error:', error); 
        continue; 
      }
      user = data.user;
      console.log('Created auth user:', user.id);
    } else {
      console.log('User already exists in Auth. Updating password and metadata...');
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: pass,
        user_metadata: {
          sdt: admin.phone,
          displayName: admin.name,
          role: 'admin',
          status: 'active'
        }
      });
      if (error) { 
        console.error('Update password error:', error); 
        continue; 
      }
      console.log('Updated user password and metadata.');
    }

    // Upsert to public.users table
    console.log('Upserting user into public.users table...');
    const { error: upsertErr } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        sdt: admin.phone,
        display_name: admin.name,
        role: 'admin',
        status: 'active'
      });
      
    if (upsertErr) {
      console.error('Error upserting public.users:', upsertErr);
    } else {
      console.log('Successfully upserted into public.users!');
    }
  }
  
  console.log('\nSeed completely finished!');
}

seed();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);

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
    
    // sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: pass,
      options: {
        data: {
          sdt: admin.phone,
          displayName: admin.name,
          role: 'admin',
          status: 'active'
        }
      }
    });

    if (signUpError) {
      console.error('Sign up error for', email, signUpError);
    } else {
      console.log('Successfully signed up or already exists for', email, signUpData.user?.id);
      
      if (signUpData.user) {
        // Upsert to public.users table
        const { error: upsertErr } = await supabase
          .from('users')
          .upsert({
            id: signUpData.user.id,
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
    }
  }
}

seed();

// Script fix password cho user accounts
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixUserPasswords() {
  console.log('🔄 Đang fix password cho user accounts...');
  
  const userPassword = 'User@123';
  
  // Tạo password hash mới
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(userPassword, salt);
  console.log('New hash:', passwordHash);
  
  const userAccounts = [
    { sdt: '0912345678', display_name: 'Phạm Thị Mai' },
    { sdt: '0933888999', display_name: 'Hoàng Đức Anh' },
  ];
  
  try {
    for (const user of userAccounts) {
      const result = await pool.query(`
        UPDATE public.users 
        SET password_hash = $1
        WHERE sdt = $2
        RETURNING sdt, display_name, role, status
      `, [passwordHash, user.sdt]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Updated: ${result.rows[0].sdt} - ${result.rows[0].display_name}`);
      } else {
        console.log(`⚠️ Not found: ${user.sdt}`);
      }
    }
    
    // Verify bằng cách check password
    console.log('\n🔍 Verifying passwords...');
    const users = await pool.query(`SELECT sdt, password_hash, display_name FROM public.users WHERE role = 'user'`);
    
    for (const u of users.rows) {
      const isValid = await bcrypt.compare(userPassword, u.password_hash);
      console.log(`  ${u.sdt}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    }
    
    console.log('\n✅ Hoàn tất!');
    
  } catch (err: any) {
    console.error('❌ Lỗi:', err);
  } finally {
    await pool.end();
  }
}

fixUserPasswords();

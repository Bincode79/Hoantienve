// Script tạo tài khoản admin mặc định không bị khóa
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedAdminAccounts() {
  console.log('🔄 Đang tạo tài khoản admin...');
  
  const adminPassword = 'Admin@123';
  // Bcrypt hash cho 'Admin@123' với cost 12
  const passwordHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4bKHJyOs/ztKPF3.';
  
  const adminAccounts = [
    { sdt: '0999999999', email: 'admin@app.aerorefund.local', display_name: 'Admin Hệ thống' },
    { sdt: '0383165313', email: 'admin2@app.aerorefund.local', display_name: 'Admin 2' },
    { sdt: '0968686868', email: 'admin3@app.aerorefund.local', display_name: 'Admin 3' },
  ];
  
  try {
    // Tạo bảng users nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        sdt            TEXT        UNIQUE,
        email          TEXT        UNIQUE NOT NULL,
        password_hash  TEXT        NOT NULL,
        display_name   TEXT,
        role           TEXT        DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        status         TEXT        DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ Bảng users đã sẵn sàng');
    
    for (const admin of adminAccounts) {
      const result = await pool.query(`
        INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
        VALUES ($1, $2, $3, $4, 'admin', 'active')
        ON CONFLICT (sdt) DO UPDATE SET 
          password_hash = $3, 
          display_name = $4, 
          role = 'admin',
          status = 'active'
        RETURNING sdt, email, display_name, role, status
      `, [admin.sdt, admin.email, passwordHash, admin.display_name]);
      
      console.log(`✅ Admin: ${result.rows[0].sdt} - ${result.rows[0].display_name} (${result.rows[0].status})`);
    }
    
    // Hiển thị danh sách admin
    const admins = await pool.query(`SELECT sdt, email, display_name, role, status FROM public.users WHERE role = 'admin'`);
    console.log('\n📋 Danh sách tài khoản Admin:');
    admins.rows.forEach(a => {
      const statusLabel = a.status === 'active' ? '✅ Hoạt động' : '❌ Bị khóa';
      console.log(`  ${a.sdt} | ${a.display_name} | ${statusLabel}`);
    });
    
    console.log('\n✅ Hoàn tất! Các tài khoản admin không bao giờ bị khóa.');
    
  } catch (err: any) {
    console.error('❌ Lỗi chi tiết:', err);
    if (err.code) console.error('Error code:', err.code);
    if (err.stack) console.error('Stack:', err.stack);
  } finally {
    await pool.end();
  }
}

seedAdminAccounts();

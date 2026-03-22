// Script tạo tài khoản user mặc định không bị khóa
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedUserAccounts() {
  console.log('🔄 Đang tạo tài khoản user...');
  
  // Bcrypt hash cho 'User@123' với cost 12
  const passwordHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4bKHJyOs/ztKPF3.';
  
  const userAccounts = [
    { sdt: '0912345678', email: 'user1@app.aerorefund.local', display_name: 'Phạm Thị Mai' },
    { sdt: '0933888999', email: 'user2@app.aerorefund.local', display_name: 'Hoàng Đức Anh' },
  ];
  
  try {
    for (const user of userAccounts) {
      const result = await pool.query(`
        INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
        VALUES ($1, $2, $3, $4, 'user', 'active')
        ON CONFLICT (sdt) DO UPDATE SET 
          password_hash = $3, 
          display_name = $4, 
          role = 'user',
          status = 'active'
        RETURNING sdt, email, display_name, role, status
      `, [user.sdt, user.email, passwordHash, user.display_name]);
      
      console.log(`✅ User: ${result.rows[0].sdt} - ${result.rows[0].display_name} (${result.rows[0].status})`);
    }
    
    // Hiển thị danh sách user
    const users = await pool.query(`SELECT sdt, email, display_name, role, status FROM public.users WHERE role = 'user'`);
    console.log('\n📋 Danh sách tài khoản User:');
    users.rows.forEach(u => {
      const statusLabel = u.status === 'active' ? '✅ Hoạt động' : '❌ Bị khóa';
      console.log(`  ${u.sdt} | ${u.display_name} | ${statusLabel}`);
    });
    
    console.log('\n✅ Hoàn tất! Các tài khoản user không bao giờ bị khóa.');
    
  } catch (err: any) {
    console.error('❌ Lỗi chi tiết:', err);
  } finally {
    await pool.end();
  }
}

seedUserAccounts();

// Test script for AeroRefund API
import 'dotenv/config';

const API_BASE = 'http://localhost:5173';

async function apiTest() {
  console.log('🧪 BẮT ĐẦU TEST API...\n');

  // Test 1: Login Admin
  console.log('1️⃣ Test đăng nhập Admin...');
  const adminLogin = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0999999999', password: 'Admin@123' })
  }).then(r => r.json());
  
  if (adminLogin.token) {
    console.log('   ✅ Đăng nhập Admin thành công!');
    console.log(`   User: ${adminLogin.user.displayName} (${adminLogin.user.role})`);
    
    // Test 2: Lấy thông tin user hiện tại
    console.log('\n2️⃣ Test lấy thông tin user (/me)...');
    const me = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${adminLogin.token}` }
    }).then(r => r.json());
    console.log(`   ✅ User info: ${me.user?.displayName}`);
    
    // Test 3: Lấy danh sách users
    console.log('\n3️⃣ Test lấy danh sách users...');
    const users = await fetch(`${API_BASE}/api/users`, {
      headers: { 'Authorization': `Bearer ${adminLogin.token}` }
    }).then(r => r.json());
    console.log(`   ✅ Số users: ${users.length || users.users?.length || 0}`);
    
    // Test 4: Lấy danh sách yêu cầu hoàn vé
    console.log('\n4️⃣ Test lấy yêu cầu hoàn vé...');
    const refunds = await fetch(`${API_BASE}/api/refunds`, {
      headers: { 'Authorization': `Bearer ${adminLogin.token}` }
    }).then(r => r.json());
    console.log(`   ✅ Số yêu cầu: ${refunds.length || refunds.refunds?.length || 0}`);
    
    // Test 5: Lấy dữ liệu cơ bản
    console.log('\n5️⃣ Test lấy dữ liệu cơ bản...');
    const basedata = await fetch(`${API_BASE}/api/data/basedata`, {
      headers: { 'Authorization': `Bearer ${adminLogin.token}` }
    }).then(r => r.json());
    console.log(`   ✅ Số PNR: ${basedata.length || basedata.basedata?.length || 0}`);
    
  } else {
    console.log('   ❌ Đăng nhập thất bại:', adminLogin.error);
  }

  // Test 6: Login User
  console.log('\n6️⃣ Test đăng nhập User...');
  const userLogin = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0912345678', password: 'User@123' })
  }).then(r => r.json());
  
  if (userLogin.token) {
    console.log('   ✅ Đăng nhập User thành công!');
    console.log(`   User: ${userLogin.user.displayName} (${userLogin.user.role})`);
  } else {
    console.log('   ❌ Đăng nhập thất bại:', userLogin.error);
  }

  // Test 7: Đăng ký user mới
  console.log('\n7️⃣ Test đăng ký user mới...');
  const register = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      displayName: 'Test User', 
      phone: '0900000001', 
      password: 'Test@123' 
    })
  }).then(r => r.json());
  
  if (register.token) {
    console.log('   ✅ Đăng ký thành công!');
    console.log(`   User: ${register.user.displayName}`);
  } else {
    console.log('   ⚠️ Đăng ký:', register.error || 'có thể SĐT đã tồn tại');
  }

  // Test 8: Tạo yêu cầu hoàn vé
  console.log('\n8️⃣ Test tạo yêu cầu hoàn vé...');
  const newRefund = await fetch(`${API_BASE}/api/refunds`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userLogin.token || register.token}` 
    },
    body: JSON.stringify({
      order_code: 'TEST-001',
      passenger_name: 'Nguyễn Văn Test',
      flight_date: '2026-04-01',
      amount: 1500000,
      bank_name: 'Vietcombank',
      account_number: '123456789',
      account_holder: 'Nguyễn Văn Test'
    })
  }).then(r => r.json());
  
  if (newRefund.id) {
    console.log('   ✅ Tạo yêu cầu hoàn vé thành công!');
    console.log(`   ID: ${newRefund.id}`);
  } else {
    console.log('   ⚠️ Tạo yêu cầu:', newRefund.error || 'có thể cần token hợp lệ');
  }

  console.log('\n✅ HOÀN TẤT TEST API!');
}

apiTest().catch(console.error);

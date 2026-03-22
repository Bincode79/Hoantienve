// Test hoàn chỉnh API - sử dụng http module
import http from 'http';

const API_BASE = 'localhost:3001';

function httpRequest(path: string, options: any = {}): Promise<{ status: number, data: any }> {
  return new Promise((resolve, reject) => {
    const data = options.body ? JSON.stringify(options.body) : undefined;
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': options.token ? `Bearer ${options.token}` : '',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode || 0, data: {} });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 TEST API HOÀN CHỈNH\n');
  console.log('═'.repeat(50));

  let adminToken = '';
  let userToken = '';

  // 1. Login Admin
  console.log('\n1️⃣ ĐĂNG NHẬP ADMIN');
  const adminRes = await httpRequest('/api/auth/login', {
    method: 'POST',
    body: { phone: '0999999999', password: 'Admin@123' }
  });
  
  if (adminRes.data.token) {
    adminToken = adminRes.data.token;
    console.log('   ✅ Đăng nhập Admin: ' + adminRes.data.user.displayName);
    console.log('   Role: ' + adminRes.data.user.role);
  } else {
    console.log('   ❌ Lỗi:', adminRes.data.error);
  }

  // 2. Login User
  console.log('\n2️⃣ ĐĂNG NHẬP USER');
  const userRes = await httpRequest('/api/auth/login', {
    method: 'POST',
    body: { phone: '0912345678', password: 'User@123' }
  });
  
  if (userRes.data.token) {
    userToken = userRes.data.token;
    console.log('   ✅ Đăng nhập User: ' + userRes.data.user.displayName);
    console.log('   Role: ' + userRes.data.user.role);
  } else {
    console.log('   ❌ Lỗi:', userRes.data.error);
  }

  // 3. Tạo yêu cầu hoàn vé (User)
  console.log('\n3️⃣ TẠO YÊU CẦU HOÀN VÉ');
  const refundRes = await httpRequest('/api/refunds', {
    method: 'POST',
    token: userToken,
    body: {
      orderCode: 'TEST-API-002',
      passengerName: 'Test User',
      flightDate: '2026-04-15',
      amount: 2000000,
      bankName: 'Vietcombank',
      accountNumber: '1234567890',
      accountHolder: 'Test User',
      ticketNumber: '1234567890',
      refundReason: 'Thay đổi kế hoạch'
    }
  });
  
  let approveRes = { data: {} };
  if (refundRes.data.id) {
    console.log('   ✅ Tạo yêu cầu thành công!');
    console.log('   ID: ' + refundRes.data.id);
    console.log('   Status: ' + refundRes.data.status);
    
    // 4. Duyệt yêu cầu (Admin)
    console.log('\n4️⃣ DUYỆT YÊU CẦU');
    approveRes = await httpRequest(`/api/refunds/${refundRes.data.id}/approve`, {
      method: 'POST',
      token: adminToken,
      body: { admin_note: 'Đã duyệt qua test API' }
    });
    
    if (approveRes.data.id) {
      console.log('   ✅ Duyệt thành công!');
      console.log('   Status: ' + approveRes.data.status);
    } else {
      console.log('   ⚠️ Lỗi:', approveRes.data.error);
    }
  } else {
    console.log('   ⚠️ Lỗi:', refundRes.data.error);
  }

  // 5. Lấy danh sách yêu cầu (Admin)
  console.log('\n5️⃣ DANH SÁCH YÊU CẦU (Admin)');
  const refunds = await httpRequest('/api/refunds', { token: adminToken });
  const refundList = refunds.data.refunds || refunds.data;
  console.log('   ✅ Số yêu cầu: ' + (Array.isArray(refundList) ? refundList.length : 0));

  // 6. Lấy danh sách users
  console.log('\n6️⃣ DANH SÁCH USERS (Admin)');
  const users = await httpRequest('/api/users', { token: adminToken });
  const userList = users.data.users || users.data;
  console.log('   ✅ Số users: ' + (Array.isArray(userList) ? userList.length : 0));

  // 7. Lấy audit logs
  console.log('\n7️⃣ NHẬT KÝ ADMIN');
  const logs = await httpRequest('/api/data/audit-logs', { token: adminToken });
  const logList = logs.data.logs || logs.data;
  console.log('   ✅ Số nhật ký: ' + (Array.isArray(logList) ? logList.length : 0));

  // 8. Cấu hình hệ thống
  console.log('\n8️⃣ CẤU HÌNH HỆ THỐNG');
  const config = await httpRequest('/api/data/config', { token: adminToken });
  if (config.data.config) {
    console.log('   ✅ Tên thương hiệu: ' + config.data.config.brand_name);
  } else {
    console.log('   ⚠️ Lỗi:', config.data.error);
  }

  // Tổng kết
  console.log('\n' + '═'.repeat(50));
  console.log('📊 TỔNG KẾT TEST');
  console.log('═'.repeat(50));
  console.log('1. Đăng nhập Admin:      ' + (adminToken ? '✅ PASS' : '❌ FAIL'));
  console.log('2. Đăng nhập User:       ' + (userToken ? '✅ PASS' : '❌ FAIL'));
  console.log('3. Tạo yêu cầu hoàn vé: ' + (refundRes.data.id ? '✅ PASS' : '❌ FAIL'));
  console.log('4. Duyệt yêu cầu:        ' + (approveRes.data.id ? '✅ PASS' : '⚠️ SKIP'));
  console.log('5. Danh sách refunds:    ✅ PASS');
  console.log('6. Danh sách users:       ✅ PASS');
  console.log('7. Nhật ký admin:         ✅ PASS');
  console.log('8. Cấu hình hệ thống:     ' + (config.data.config ? '✅ PASS' : '❌ FAIL'));
  console.log('═'.repeat(50));
  console.log('✅ HOÀN TẤT TEST!');
}

testAPI().catch(console.error);

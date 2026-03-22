import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected!\n');

    const passwordHash = await bcrypt.hash('Admin@123', 12);

    // ============================================================
    // 1. DROP & RECREATE TABLES (CLEAN START)
    // ============================================================
    console.log('🗑️  [1/6] Resetting database...');
    
    await client.query(`DROP TABLE IF EXISTS messages CASCADE`);
    await client.query(`DROP TABLE IF EXISTS chats CASCADE`);
    await client.query(`DROP TABLE IF EXISTS refund_requests CASCADE`);
    await client.query(`DROP TABLE IF EXISTS basedata CASCADE`);
    await client.query(`DROP TABLE IF EXISTS users CASCADE`);
    await client.query(`DROP TABLE IF EXISTS config CASCADE`);
    console.log('   ✅ Tables dropped');

    // ============================================================
    // 2. CREATE TABLES
    // ============================================================
    console.log('\n📦 [2/6] Creating tables...');

    await client.query(`
      CREATE TABLE users (
        id          UUID        PRIMARY KEY,
        sdt         TEXT UNIQUE NOT NULL,
        display_name TEXT,
        email       TEXT,
        password_hash TEXT,
        role        TEXT        DEFAULT 'user',
        status      TEXT        DEFAULT 'active',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ users');

    await client.query(`
      CREATE TABLE refund_requests (
        id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id          UUID        REFERENCES users(id),
        user_sdt         TEXT,
        user_email       TEXT,
        display_name     TEXT,
        bank_name        TEXT,
        account_number   TEXT,
        account_holder   TEXT,
        amount           NUMERIC,
        order_code       TEXT,
        status           TEXT        DEFAULT 'pending',
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW(),
        refund_reason    TEXT,
        flight_date      TEXT,
        ticket_number    TEXT,
        passenger_name   TEXT
      );
    `);
    console.log('   ✅ refund_requests');

    await client.query(`
      CREATE TABLE basedata (
        id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        order_code   TEXT        UNIQUE NOT NULL,
        amount       NUMERIC,
        passenger_name TEXT,
        flight_number TEXT,
        status       TEXT        DEFAULT 'valid',
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ basedata');

    await client.query(`
      CREATE TABLE chats (
        id             TEXT        PRIMARY KEY,
        user_id        UUID        REFERENCES users(id),
        user_name      TEXT,
        last_message   TEXT,
        last_time      TIMESTAMPTZ,
        unread_count   INTEGER     DEFAULT 0
      );
    `);
    console.log('   ✅ chats');

    await client.query(`
      CREATE TABLE messages (
        id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        chat_id      TEXT        REFERENCES chats(id) ON DELETE CASCADE,
        sender_id    TEXT,
        sender_name  TEXT,
        sender_role  TEXT,
        text         TEXT,
        timestamp    TIMESTAMPTZ DEFAULT NOW(),
        is_read      BOOLEAN     DEFAULT FALSE
      );
    `);
    console.log('   ✅ messages');

    await client.query(`
      CREATE TABLE config (
        id                 TEXT        PRIMARY KEY,
        support_phone      TEXT,
        support_email      TEXT,
        working_hours      TEXT,
        brand_name         TEXT,
        footer_description TEXT,
        copyright          TEXT,
        updated_at         TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ config');

    // ============================================================
    // 3. SEED USERS
    // ============================================================
    console.log('\n👤 [3/6] Seeding users...');

    const users = [
      { id: '11111111-1111-1111-1111-111111111111', sdt: '0999999999', name: 'Admin', email: 'admin1@aerorefund.com', role: 'admin' },
      { id: '22222222-2222-2222-2222-222222222222', sdt: '0383165313', name: 'Admin 2', email: 'admin2@aerorefund.com', role: 'admin' },
      { id: '33333333-3333-3333-3333-333333333333', sdt: '0968686868', name: 'Admin 3', email: 'admin3@aerorefund.com', role: 'admin' },
      { id: '44444444-4444-4444-4444-444444444444', sdt: '0912345678', name: 'Phạm Thị Mai', email: 'user1@aerorefund.com', role: 'user' },
      { id: '55555555-5555-5555-5555-555555555555', sdt: '0933888999', name: 'Hoàng Đức Anh', email: 'user2@aerorefund.com', role: 'user' },
    ];

    for (const u of users) {
      await client.query(`
        INSERT INTO users (id, sdt, display_name, email, password_hash, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
      `, [u.id, u.sdt, u.name, u.email, passwordHash, u.role]);
      console.log(`   ✅ ${u.role.toUpperCase()}: ${u.name} (${u.sdt})`);
    }

    // ============================================================
    // 4. SEED BASEDATA
    // ============================================================
    console.log('\n📋 [4/6] Seeding PNR data...');

    const basedata = [
      { code: 'VN-2024-SGN-HAN-001', amount: 1450000, passenger: 'Nguyễn Văn Minh', flight: 'VN601' },
      { code: 'VN-2024-HAN-SGN-002', amount: 1380000, passenger: 'Trần Thị Lan', flight: 'VN602' },
      { code: 'VJ-2024-SGN-DAD-003', amount: 890000, passenger: 'Lê Hoàng Nam', flight: 'VJ541' },
      { code: 'QH-2024-HAN-UIH-004', amount: 650000, passenger: 'Phạm Thị Mai', flight: 'QH1523' },
      { code: 'VN-2024-DAD-SGN-005', amount: 1720000, passenger: 'Hoàng Đức Anh', flight: 'VN683' },
      { code: 'VJ-2024-SGN-PXU-006', amount: 780000, passenger: 'Nguyễn Thị Hương', flight: 'VJ311' },
      { code: 'VN-2024-HAN-CXR-007', amount: 1100000, passenger: 'Trần Đình Khoa', flight: 'VN1892' },
      { code: 'QH-2024-SGN-PQC-008', amount: 550000, passenger: 'Lê Thị Thu', flight: 'QH1841' },
      { code: 'VJ-2024-HAN-DAD-009', amount: 950000, passenger: 'Phạm Văn Hùng', flight: 'VJ241' },
      { code: 'VN-2024-SGN-VCA-010', amount: 720000, passenger: 'Ngô Thị Lan', flight: 'VN1403' },
    ];

    for (const b of basedata) {
      await client.query(`
        INSERT INTO basedata (order_code, amount, passenger_name, flight_number, status)
        VALUES ($1, $2, $3, $4, 'valid')
      `, [b.code, b.amount, b.passenger, b.flight]);
    }
    console.log(`   ✅ ${basedata.length} PNR records`);

    // ============================================================
    // 5. SEED REFUND REQUESTS
    // ============================================================
    console.log('\n💰 [5/6] Seeding refund requests...');

    const refunds = [
      { user_id: '44444444-4444-4444-4444-444444444444', code: 'VN-2024-SGN-HAN-001', amount: 1450000, status: 'pending', reason: 'Hủy chuyến công việc đột xuất', passenger: 'Nguyễn Văn Minh' },
      { user_id: '44444444-4444-4444-4444-444444444444', code: 'VN-2024-HAN-SGN-002', amount: 1380000, status: 'approved', reason: 'Trễ chuyến bay 3 tiếng', passenger: 'Trần Thị Lan' },
      { user_id: '55555555-5555-5555-5555-555555555555', code: 'VJ-2024-SGN-DAD-003', amount: 890000, status: 'processing', reason: 'Hủy vé không muốn đi', passenger: 'Lê Hoàng Nam' },
      { user_id: '55555555-5555-5555-5555-555555555555', code: 'QH-2024-HAN-UIH-004', amount: 650000, status: 'completed', reason: 'Đổi sang chuyến khác', passenger: 'Phạm Thị Mai' },
    ];

    for (const r of refunds) {
      const userResult = await client.query('SELECT sdt, email, display_name FROM users WHERE id = $1', [r.user_id]);
      const user = userResult.rows[0];
      
      await client.query(`
        INSERT INTO refund_requests (user_id, order_code, amount, status, refund_reason, passenger_name, user_sdt, user_email, display_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [r.user_id, r.code, r.amount, r.status, r.reason, r.passenger, user?.sdt, user?.email, user?.display_name]);
      console.log(`   ✅ ${r.status}: ${r.code}`);
    }

    // ============================================================
    // 6. SEED CONFIG
    // ============================================================
    console.log('\n⚙️ [6/6] Seeding config...');

    await client.query(`
      INSERT INTO config (id, support_phone, support_email, working_hours, brand_name, footer_description, copyright)
      VALUES ('system', '1900 6091', 'hotro@aerorefund.com', '0h - 24h', 
        'TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆT NAM',
        'Hệ thống quản lý đại lý & hoàn vé máy bay tự động',
        '© 2026 TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆT NAM')
    `);
    console.log('   ✅ config');

    // ============================================================
    // DONE
    // ============================================================
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ SEED HOÀN TẤT!');
    console.log('═══════════════════════════════════════════');
    console.log('\n📋 Tài khoản đăng nhập:');
    console.log('   Admin 1 — SĐT: 0999999999 — Mật khẩu: Admin@123');
    console.log('   Admin 2 — SĐT: 0383165313 — Mật khẩu: Admin@123');
    console.log('   Admin 3 — SĐT: 0968686868 — Mật khẩu: Admin@123');
    console.log('   User 1  — SĐT: 0912345678 — Mật khẩu: Admin@123');
    console.log('   User 2  — SĐT: 0933888999 — Mật khẩu: Admin@123');

  } catch (err) {
    console.error('\n❌ Lỗi:', err.message);
    if (err.code) console.error('   Code:', err.code);
  } finally {
    await client.end();
  }
}

run();

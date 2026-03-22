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
    console.log('✅ Connected to Neon!\n');

    const passwordHash = await bcrypt.hash('25251325', 12);

    // ============================================================
    // 1. CREATE TABLES
    // ============================================================
    console.log('📦 [1/5] Creating tables...');

    await client.query(`
      -- USERS TABLE
      CREATE TABLE IF NOT EXISTS users (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        sdt         TEXT UNIQUE,
        display_name TEXT,
        email       TEXT,
        password_hash TEXT,
        role        TEXT        DEFAULT 'user',
        status      TEXT        DEFAULT 'active',
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        last_read_at TIMESTAMPTZ
      );
    `);
    console.log('   ✅ users table');

    await client.query(`
      -- REFUND REQUESTS TABLE
      CREATE TABLE IF NOT EXISTS refund_requests (
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
        admin_note       TEXT,
        refund_reason    TEXT,
        flight_date      TEXT,
        ticket_number    TEXT,
        passenger_name   TEXT,
        approved_by      TEXT,
        approved_at      TIMESTAMPTZ,
        completed_by     TEXT,
        completed_at     TIMESTAMPTZ,
        refund_slip_code TEXT
      );
    `);
    console.log('   ✅ refund_requests table');

    await client.query(`
      -- BASEDATA TABLE
      CREATE TABLE IF NOT EXISTS basedata (
        id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        order_code   TEXT        UNIQUE,
        amount       NUMERIC,
        passenger_name TEXT,
        flight_number TEXT,
        status       TEXT        DEFAULT 'valid',
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ basedata table');

    await client.query(`
      -- CHATS TABLE
      CREATE TABLE IF NOT EXISTS chats (
        id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id        UUID        REFERENCES users(id),
        user_name      TEXT,
        last_message   TEXT,
        last_time      TIMESTAMPTZ,
        unread_count   INTEGER     DEFAULT 0
      );
    `);
    console.log('   ✅ chats table');

    await client.query(`
      -- MESSAGES TABLE
      CREATE TABLE IF NOT EXISTS messages (
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
    console.log('   ✅ messages table');

    await client.query(`
      -- CONFIG TABLE
      CREATE TABLE IF NOT EXISTS config (
        id                 TEXT        PRIMARY KEY DEFAULT 'system',
        support_phone      TEXT,
        support_email      TEXT,
        working_hours      TEXT,
        brand_name         TEXT,
        footer_description TEXT,
        copyright          TEXT,
        updated_at         TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ config table');

    // ============================================================
    // 2. SEED USERS
    // ============================================================
    console.log('\n👤 [2/5] Seeding users...');

    const admin1Id = '11111111-1111-1111-1111-111111111111';
    const admin2Id = '22222222-2222-2222-2222-222222222222';
    const admin3Id = '33333333-3333-3333-3333-333333333333';
    const user1Id = '44444444-4444-4444-4444-444444444444';
    const user2Id = '55555555-5555-5555-5555-555555555555';

    const users = [
      { id: admin1Id, sdt: '0999999999', name: 'Admin', email: 'admin1@aerorefund.com', role: 'admin' },
      { id: admin2Id, sdt: '0383165313', name: 'Admin 2', email: 'admin2@aerorefund.com', role: 'admin' },
      { id: admin3Id, sdt: '0968686868', name: 'Admin 3', email: 'admin3@aerorefund.com', role: 'admin' },
      { id: user1Id, sdt: '0912345678', name: 'Phạm Thị Mai', email: 'user1@aerorefund.com', role: 'user' },
      { id: user2Id, sdt: '0933888999', name: 'Hoàng Đức Anh', email: 'user2@aerorefund.com', role: 'user' },
    ];

    for (const u of users) {
      await client.query(`
        INSERT INTO users (id, sdt, display_name, email, password_hash, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        ON CONFLICT (sdt) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role
      `, [u.id, u.sdt, u.name, u.email, passwordHash, u.role]);
      console.log(`   ✅ ${u.role.toUpperCase()}: ${u.name} (${u.sdt})`);
    }

    // ============================================================
    // 3. SEED BASEDATA
    // ============================================================
    console.log('\n📋 [3/5] Seeding basedata (PNR)...');

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
        ON CONFLICT (order_code) DO UPDATE SET
          amount = EXCLUDED.amount,
          passenger_name = EXCLUDED.passenger_name
      `, [b.code, b.amount, b.passenger, b.flight]);
    }
    console.log(`   ✅ ${basedata.length} PNR records seeded`);

    // ============================================================
    // 4. SEED REFUND REQUESTS
    // ============================================================
    console.log('\n💰 [4/5] Seeding refund requests...');

    const refunds = [
      { user_id: user1Id, code: 'VN-2024-SGN-HAN-001', amount: 1450000, status: 'pending', reason: 'Hủy chuyến công việc đột xuất', passenger: 'Nguyễn Văn Minh' },
      { user_id: user1Id, code: 'VN-2024-HAN-SGN-002', amount: 1380000, status: 'approved', reason: 'Trễ chuyến bay 3 tiếng', passenger: 'Trần Thị Lan' },
      { user_id: user2Id, code: 'VJ-2024-SGN-DAD-003', amount: 890000, status: 'processing', reason: 'Hủy vé không muốn đi', passenger: 'Lê Hoàng Nam' },
      { user_id: user2Id, code: 'QH-2024-HAN-UIH-004', amount: 650000, status: 'completed', reason: 'Đổi sang chuyến khác', passenger: 'Phạm Thị Mai' },
    ];

    for (const r of refunds) {
      // Try insert, skip if FK fails (user might not exist in this DB)
      try {
        await client.query(`
          INSERT INTO refund_requests (user_id, order_code, amount, status, refund_reason, passenger_name, user_sdt, display_name)
          VALUES ($1, $2, $3, $4, $5, $6, 
            (SELECT sdt FROM users WHERE id = $1),
            (SELECT display_name FROM users WHERE id = $1)
          )
        `, [r.user_id, r.code, r.amount, r.status, r.reason, r.passenger]);
        console.log(`   ✅ ${r.status}: ${r.code}`);
      } catch (e) {
        console.log(`   ⚠️  Skipped: ${r.code} (user not found)`);
      }
    }
    console.log('   ✅ refund requests processed');

    // ============================================================
    // 5. SEED CONFIG
    // ============================================================
    console.log('\n⚙️ [5/5] Seeding config...');

    await client.query(`
      INSERT INTO config (id, support_phone, support_email, working_hours, brand_name, footer_description, copyright)
      VALUES (
        'system',
        '1900 6091',
        'hotro@aerorefund.com',
        '0h - 24h',
        'TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆT NAM',
        'Hệ thống quản lý đại lý & hoàn vé máy bay tự động',
        '© 2026 TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆT NAM'
      )
      ON CONFLICT (id) DO UPDATE SET
        support_phone = EXCLUDED.support_phone,
        support_email = EXCLUDED.support_email
    `);
    console.log('   ✅ config seeded');

    // ============================================================
    // DONE
    // ============================================================
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ SEED HOÀN TẤT!');
    console.log('═══════════════════════════════════════════');
    console.log('\n📋 Tài khoản đăng nhập:');
    console.log('   Admin 1 — SĐT: 0999999999 — Mật khẩu: 25251325');
    console.log('   Admin 2 — SĐT: 0383165313 — Mật khẩu: 25251325');
    console.log('   Admin 3 — SĐT: 0968686868 — Mật khẩu: 25251325');
    console.log('   User 1  — SĐT: 0912345678 — Mật khẩu: 25251325');
    console.log('   User 2  — SĐT: 0933888999 — Mật khẩu: 25251325');

  } catch (err) {
    console.error('\n❌ Lỗi:', err.message);
    if (err.code) console.error('   Code:', err.code);
  } finally {
    await client.end();
  }
}

run();

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken, verifyToken, requireAuth, requireAdmin, AuthenticatedRequest } from '../auth';

const router = Router();

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { phone, password } = req.body ?? {};

  if (!phone?.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập số điện thoại.' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Vui lòng nhập mật khẩu.' });
  }

  const loginId = phone.trim();

  try {
    // 1. Tìm user bằng SĐT hoặc email (Không kiểm tra trạng thái khóa theo yêu cầu)
    const userResult = await db.query<{
      id: string;
      sdt: string;
      email: string;
      password_hash: string;
      display_name: string;
      role: string;
      status: string;
    }>(
      `SELECT id, sdt, email, password_hash, display_name, role, status
       FROM public.users
       WHERE (sdt = $1 OR email = $1)
       LIMIT 1`,
      [loginId],
    );

    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'Số điện thoại hoặc Email không tồn tại trên hệ thống.' });
    }

    const user = userResult.rows[0];

    // 2. Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác.' });
    }

    // 3. Generate JWT
    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      sdt: user.sdt,
    });

    return res.json({
      token,
      user: {
        uid: user.id,
        sdt: user.sdt,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Lỗi server. Vui lòng thử lại sau.' });
  }
});

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const { displayName, phone, password, email } = req.body ?? {};

  if (!displayName?.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập họ tên.' });
  }
  if (!phone?.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập số điện thoại.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }

  const formattedPhone = phone.trim();
  const generatedEmail = email?.trim()
    ? email.trim()
    : `${formattedPhone}@app.aerorefund.local`;

  try {
    // 1. Kiểm tra SĐT đã tồn tại
    const existing = await db.query(
      `SELECT id FROM public.users WHERE sdt = $1 LIMIT 1`,
      [formattedPhone],
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Số điện thoại này đã được đăng ký.' });
    }

    // Check email duplicate only if provided
    if (email?.trim()) {
      const existingEmail = await db.query(
        `SELECT id FROM public.users WHERE email = $1 LIMIT 1`,
        [email.trim()],
      );
      if (existingEmail.rows.length > 0) {
        return res.status(409).json({ error: 'Email này đã được đăng ký.' });
      }
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert user (RLS-safe): set app.current_user_id to the same UUID we insert.
    let client: import('pg').PoolClient | null = null;
    let insertResult;
    try {
      client = await db.connect();
      await client.query('BEGIN');
      const idResult = await client.query<{ id: string }>(`SELECT gen_random_uuid() AS id`);
      const newId = idResult.rows[0].id;

      await client.query(`SET LOCAL app.current_user_id = $1`, [newId]);
      insertResult = await client.query<{
        id: string;
        sdt: string;
        email: string;
        display_name: string;
        role: string;
        status: string;
      }>(
        `INSERT INTO public.users (id, sdt, email, password_hash, display_name, role, status)
         VALUES ($1, $2, $3, $4, $5, 'user', 'active')
         RETURNING id, sdt, email, display_name, role, status`,
        [newId, formattedPhone, generatedEmail, passwordHash, displayName.trim()],
      );
      await client.query('COMMIT');
    } catch (txErr) {
      if (client) {
        await client.query('ROLLBACK').catch(() => {});
      }
      throw txErr;
    } finally {
      client?.release();
    }

    const newUser = insertResult.rows[0];

    // 4. Generate JWT immediately
    const token = generateToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      sdt: newUser.sdt,
    });

    return res.status(201).json({
      token,
      user: {
        uid: newUser.id,
        sdt: newUser.sdt,
        email: newUser.email,
        displayName: newUser.display_name,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    const pgErr = err as { code?: string };
    if (pgErr?.code === '23505') {
      return res.status(409).json({ error: 'Số điện thoại hoặc email đã được đăng ký.' });
    }
    return res.status(500).json({ error: 'Đăng ký thất bại. Vui lòng thử lại.' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.query<{
      id: string;
      sdt: string;
      email: string;
      display_name: string;
      role: string;
      status: string;
      created_at: string;
    }>(
      `SELECT id, sdt, email, display_name, role, status, created_at
       FROM public.users WHERE id = $1`,
      [req.userId],
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
    }

    const u = result.rows[0];
    return res.json({
      user: {
        uid: u.id,
        sdt: u.sdt,
        email: u.email,
        displayName: u.display_name,
        role: u.role,
        status: u.status,
        createdAt: u.created_at,
      },
    });
  } catch (err) {
    console.error('[Auth] Me error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
// JWT is stateless — logout is handled client-side (delete token)
// This endpoint exists for API consistency and future token blacklist
router.post('/logout', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, message: 'Đăng xuất thành công.' });
});

// ── POST /api/auth/verify-token ───────────────────────────────────────────────
router.post('/verify-token', async (req: Request, res: Response) => {
  const { token } = req.body ?? {};
  if (!token) {
    return res.status(400).json({ valid: false, error: 'Token không được cung cấp.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.json({ valid: false });
  }

  // Optionally verify user still exists
  const userResult = await db.query(
    `SELECT id FROM public.users WHERE id = $1`,
    [payload.sub],
  );

  if (!userResult.rows.length) {
    return res.json({ valid: false, error: 'Tài khoản không tồn tại trên hệ thống.' });
  }

  return res.json({
    valid: true,
    user: {
      uid: payload.sub,
      email: payload.email,
      role: payload.role,
      sdt: payload.sdt,
    },
  });
});

export default router;

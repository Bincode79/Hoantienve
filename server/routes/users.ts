import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth';

const router = Router();

// ── GET /api/users ──────────────────────────────────────────────────────────
// Admin: list all users
router.get('/', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
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
       FROM public.users
       ORDER BY created_at DESC`,
    );

    const users = result.rows.map((u) => ({
      uid: u.id,
      sdt: u.sdt,
      email: u.email,
      displayName: u.display_name,
      role: u.role,
      status: u.status,
      createdAt: u.created_at,
    }));

    return res.json({ users });
  } catch (err) {
    console.error('[Users] List error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── GET /api/users/:uid ─────────────────────────────────────────────────────
router.get('/:uid', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { uid } = req.params;
  const isAdmin = req.userRole === 'admin';
  const isSelf = req.userId === uid;

  // User chỉ có thể xem chính mình, admin có thể xem tất cả
  if (!isAdmin && !isSelf) {
    return res.status(403).json({ error: 'Bạn không có quyền xem hồ sơ này.' });
  }

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
      [uid],
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
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
    console.error('[Users] Get error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── PATCH /api/users/:uid ───────────────────────────────────────────────────
router.patch('/:uid', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { uid } = req.params;
  const isAdmin = req.userRole === 'admin';
  const isSelf = req.userId === uid;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({ error: 'Bạn không có quyền cập nhật hồ sơ này.' });
  }

  const { displayName, sdt, status, role, password } = req.body ?? {};

  // Chỉ admin có thể thay đổi role và status
  if ((status !== undefined || role !== undefined) && !isAdmin) {
    return res.status(403).json({ error: 'Chỉ admin mới có quyền thay đổi vai trò hoặc trạng thái.' });
  }

  try {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (displayName !== undefined) {
      updates.push(`display_name = $${idx++}`);
      values.push(displayName.trim());
    }
    if (sdt !== undefined) {
      updates.push(`sdt = $${idx++}`);
      values.push(sdt.trim());
    }
    if (status !== undefined && isAdmin) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }
    if (role !== undefined && isAdmin) {
      updates.push(`role = $${idx++}`);
      values.push(role);
    }
    if (password !== undefined && (isSelf || isAdmin)) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      }
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(password, salt);
      updates.push(`password_hash = $${idx++}`);
      values.push(hash);
    }

    if (updates.length === 0) {
      return res.json({ success: true, message: 'Không có gì để cập nhật.' });
    }

    values.push(uid);
    const result = await db.query(
      `UPDATE public.users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id`,
      values,
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[Users] Update error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── POST /api/users (Admin: tạo user mới) ──────────────────────────────────
router.post('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { displayName, phone, password, email, role = 'user', status = 'active' } = req.body ?? {};

  if (!displayName?.trim() || !phone?.trim() || !password) {
    return res.status(400).json({ error: 'displayName, phone và password là bắt buộc.' });
  }

  const formattedPhone = phone.trim();
  const userEmail = email?.trim() || `${formattedPhone}@app.aerorefund.local`;

  try {
    // Kiểm tra trùng SĐT
    const dup = await db.query(`SELECT id FROM public.users WHERE sdt = $1`, [formattedPhone]);
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'Số điện thoại đã được sử dụng.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    const result = await db.query<{
      id: string;
      sdt: string;
      email: string;
      display_name: string;
      role: string;
      status: string;
      created_at: string;
    }>(
      `INSERT INTO public.users (id, sdt, email, password_hash, display_name, role, status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
       RETURNING id, sdt, email, display_name, role, status, created_at`,
      [formattedPhone, userEmail, hash, displayName.trim(), role, status],
    );

    const u = result.rows[0];
    return res.status(201).json({
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
    console.error('[Users] Create error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── DELETE /api/users/:uid ───────────────────────────────────────────────────
router.delete('/:uid', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { uid } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM public.users WHERE id = $1 AND role != 'admin' RETURNING id`,
      [uid],
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Không tìm thấy user hoặc không thể xóa admin.' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[Users] Delete error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

export default router;

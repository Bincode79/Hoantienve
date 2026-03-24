import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth';

const router = Router();

// ── GET /api/data/config ─────────────────────────────────────────────────
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT * FROM public.config WHERE id = 'system' LIMIT 1`,
    );
    if (!result.rows.length) {
      return res.json({ config: null });
    }
    const c = result.rows[0];
    return res.json({
      config: {
        supportPhone: c.support_phone,
        supportEmail: c.support_email,
        workingHours: c.working_hours,
        brandName: c.brand_name,
        footerDescription: c.footer_description,
        copyright: c.copyright,
      },
    });
  } catch (err) {
    console.error('[Data] Config error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

router.patch('/config', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { supportPhone, supportEmail, workingHours, brandName, footerDescription, copyright } = req.body ?? {};
  try {
    const result = await db.query(
      `INSERT INTO public.config (id, support_phone, support_email, working_hours, brand_name, footer_description, copyright)
       VALUES ('system', $1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         support_phone = EXCLUDED.support_phone,
         support_email = EXCLUDED.support_email,
         working_hours = EXCLUDED.working_hours,
         brand_name = EXCLUDED.brand_name,
         footer_description = EXCLUDED.footer_description,
         copyright = EXCLUDED.copyright
       RETURNING *`,
      [supportPhone, supportEmail, workingHours, brandName, footerDescription, copyright],
    );
    const c = result.rows[0];
    return res.json({
      config: {
        supportPhone: c.support_phone,
        supportEmail: c.support_email,
        workingHours: c.working_hours,
        brandName: c.brand_name,
        footerDescription: c.footer_description,
        copyright: c.copyright,
      },
    });
  } catch (err) {
    console.error('[Data] Config update error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── GET /api/data/basedata ───────────────────────────────────────────────
router.get('/basedata', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, order_code, amount, passenger_name, flight_number, status, created_at
       FROM public.basedata ORDER BY created_at DESC`,
    );
    const items = result.rows.map((r) => ({
      id: r.id,
      orderCode: r.order_code,
      amount: r.amount,
      passengerName: r.passenger_name,
      flightNumber: r.flight_number,
      status: r.status,
      createdAt: r.created_at,
    }));
    return res.json({ basedata: items });
  } catch (err) {
    console.error('[Data] Basedata error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

router.post('/basedata', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { orderCode, amount, passengerName, flightNumber } = req.body ?? {};
  if (!orderCode || !amount) {
    return res.status(400).json({ error: 'orderCode và amount là bắt buộc.' });
  }
  try {
    const result = await db.query(
      `INSERT INTO public.basedata (order_code, amount, passenger_name, flight_number)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (order_code) DO UPDATE SET
         amount = EXCLUDED.amount,
         passenger_name = EXCLUDED.passenger_name,
         flight_number = EXCLUDED.flight_number,
         status = 'valid'
       RETURNING *`,
      [orderCode, amount, passengerName, flightNumber],
    );
    const r = result.rows[0];
    return res.status(201).json({
      item: {
        id: r.id,
        orderCode: r.order_code,
        amount: r.amount,
        passengerName: r.passenger_name,
        flightNumber: r.flight_number,
        status: r.status,
        createdAt: r.created_at,
      },
    });
  } catch (err) {
    console.error('[Data] Basedata create error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── GET /api/data/airports ───────────────────────────────────────────────
router.get('/airports', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, iata, name, city, region, region_label, country
       FROM public.airports ORDER BY city`,
    );
    const items = result.rows.map((r) => ({
      id: r.id,
      iata: r.iata,
      name: r.name,
      city: r.city,
      region: r.region,
      regionLabel: r.region_label,
      country: r.country,
    }));
    return res.json({ airports: items });
  } catch (err) {
    console.error('[Data] Airports error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── GET /api/data/airlines ───────────────────────────────────────────────
router.get('/airlines', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT code, name, name_vn, logo_url FROM public.airlines ORDER BY code`,
    );
    const items = result.rows.map((r) => ({
      code: r.code,
      name: r.name,
      nameVn: r.name_vn,
      logoUrl: r.logo_url,
    }));
    return res.json({ airlines: items });
  } catch (err) {
    console.error('[Data] Airlines error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── GET /api/data/popular-routes ────────────────────────────────────────
router.get('/popular-routes', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, from_iata, to_iata, price, airline, is_active, sort_order
       FROM public.popular_routes
       WHERE is_active = TRUE
       ORDER BY sort_order ASC`,
    );
    const items = result.rows.map((r) => ({
      id: r.id,
      fromIata: r.from_iata,
      toIata: r.to_iata,
      price: r.price,
      airline: r.airline,
      isActive: r.is_active,
      sortOrder: r.sort_order,
    }));
    return res.json({ routes: items });
  } catch (err) {
    console.error('[Data] Popular routes error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── GET /api/data/audit-logs ────────────────────────────────────────────
router.get('/audit-logs', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, admin_id, admin_email, action, target_id, target_type, changes, created_at
       FROM public.audit_logs ORDER BY created_at DESC LIMIT 100`,
    );
    const logs = result.rows.map((r) => ({
      id: r.id,
      adminId: r.admin_id,
      adminEmail: r.admin_email,
      action: r.action,
      targetId: r.target_id,
      targetType: r.target_type,
      changes: r.changes,
      createdAt: r.created_at,
    }));
    return res.json({ logs });
  } catch (err) {
    console.error('[Data] Audit logs error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── POST /api/data/audit-logs ─────────────────────────────────────────────
router.post('/audit-logs', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { admin_id, admin_email, action, target_id, target_type, changes } = req.body ?? {};
  try {
    const result = await db.query(
      `INSERT INTO public.audit_logs (admin_id, admin_email, action, target_id, target_type, changes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [admin_id, admin_email, action, target_id, target_type, JSON.stringify(changes)],
    );
    return res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error('[Data] Audit log create error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── GET /api/data/chats ─────────────────────────────────────────────────
// User: own chats. Admin: all chats.
router.get('/chats', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = req.userRole === 'admin';
  const userId = req.userId!;
  try {
    const result = await db.query(
      `SELECT c.id, c.user_id, c.user_name, c.last_message, c.last_time, c.unread_count,
              u.display_name
       FROM public.chats c
       LEFT JOIN public.users u ON u.id = c.user_id
       WHERE ${isAdmin ? 'TRUE' : 'c.user_id = $1'}
       ORDER BY COALESCE(c.last_time, c.id) DESC`,
      isAdmin ? [] : [userId],
    );
    const chats = result.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name || r.display_name || 'Khách',
      lastMessage: r.last_message,
      lastTime: r.last_time,
      unreadCount: r.unread_count,
    }));
    return res.json({ chats });
  } catch (err) {
    console.error('[Data] Chats error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── GET /api/data/chats/:chatId/messages ────────────────────────────────
router.get('/chats/:chatId/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { chatId } = req.params;
  const isAdmin = req.userRole === 'admin';
  const userId = req.userId!;
  try {
    const result = await db.query(
      `SELECT m.id, m.chat_id, m.sender_id, m.sender_name, m.sender_role, m.text, m.timestamp, m.is_read
       FROM public.messages m
       JOIN public.chats c ON c.id = m.chat_id
       WHERE m.chat_id = $1
         AND (${isAdmin ? 'TRUE' : 'c.user_id = $2'})
       ORDER BY m.timestamp ASC`,
      isAdmin ? [chatId] : [chatId, userId],
    );
    const messages = result.rows.map((r) => ({
      id: r.id,
      chatId: r.chat_id,
      senderId: r.sender_id,
      senderName: r.sender_name,
      senderRole: r.sender_role,
      text: r.text,
      timestamp: r.timestamp,
      isRead: r.is_read,
    }));
    return res.json({ messages });
  } catch (err) {
    console.error('[Data] Messages error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── POST /api/data/chats/:chatId/messages ────────────────────────────────
router.post('/chats/:chatId/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { chatId } = req.params;
  const { text } = req.body ?? {};
  const isAdmin = req.userRole === 'admin';
  const userId = req.userId!;

  if (!text?.trim()) {
    return res.status(400).json({ error: 'Tin nhắn không được để trống.' });
  }

  try {
    // Verify chat access
    const chatResult = await db.query<{ user_id: string }>(
      `SELECT user_id FROM public.chats WHERE id = $1`,
      [chatId],
    );
    if (!chatResult.rows.length || (!isAdmin && chatResult.rows[0].user_id !== userId)) {
      return res.status(403).json({ error: 'Bạn không có quyền gửi tin nhắn vào cuộc trò chuyện này.' });
    }

    const senderId = userId;
    const senderName = req.user?.email?.split('@')[0] || 'User';
    const senderRole = isAdmin ? 'admin' : 'user';

    const result = await db.query(
      `INSERT INTO public.messages (chat_id, sender_id, sender_name, sender_role, text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [chatId, senderId, senderName, senderRole, text.trim()],
    );

    // Update chat last_message
    await db.query(
      `UPDATE public.chats SET last_message = $1, last_time = NOW()
       WHERE id = $2`,
      [text.trim(), chatId],
    );

    const r = result.rows[0];
    return res.status(201).json({
      message: {
        id: r.id,
        chatId: r.chat_id,
        senderId: r.sender_id,
        senderName: r.sender_name,
        senderRole: r.sender_role,
        text: r.text,
        timestamp: r.timestamp,
        isRead: r.is_read,
      },
    });
  } catch (err) {
    console.error('[Data] Send message error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── POST /api/data/chats (Tạo chat mới) ────────────────────────────────
router.post('/chats', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { userName } = req.body ?? {};

  try {
    // Tạo hoặc lấy chat hiện có của user
    let result = await db.query<{ id: string }>(
      `SELECT id FROM public.chats WHERE user_id = $1 LIMIT 1`,
      [userId],
    );

    let chatId: string;
    if (result.rows.length > 0) {
      chatId = result.rows[0].id;
    } else {
      result = await db.query<{ id: string }>(
        `INSERT INTO public.chats (id, user_id, user_name)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [userId, userId, userName || 'Khách'],
      );
      chatId = result.rows[0].id;
    }

    return res.status(201).json({ chatId });
  } catch (err) {
    console.error('[Data] Create chat error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

export default router;

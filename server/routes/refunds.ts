import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth';

const router = Router();

interface RefundRow {
  id: string;
  user_id: string;
  user_sdt: string;
  display_name: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  amount: number;
  order_code: string;
  status: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  admin_note: string | null;
  approved_by: string | null;
  approved_at: string | null;
  completed_by: string | null;
  completed_at: string | null;
  refund_slip_code: string | null;
  refund_reason: string | null;
  flight_date: string | null;
  ticket_number: string | null;
  passenger_name: string | null;
  processing_time: string | null;
  transfer_note: string | null;
}

function formatRefund(row: RefundRow) {
  return {
    id: row.id,
    userId: row.user_id,
    userSdt: row.user_sdt,
    displayName: row.display_name,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountHolder: row.account_holder,
    amount: row.amount,
    orderCode: row.order_code,
    status: row.status,
    isVisible: row.is_visible,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    adminNote: row.admin_note,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    completedBy: row.completed_by,
    completedAt: row.completed_at,
    refundSlipCode: row.refund_slip_code,
    refundReason: row.refund_reason,
    flightDate: row.flight_date,
    ticketNumber: row.ticket_number,
    passengerName: row.passenger_name,
    processingTime: row.processing_time,
    transferNote: row.transfer_note,
  };
}

// ── GET /api/refunds ────────────────────────────────────────────────────────
// User: own refunds. Admin: all refunds.
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = req.userRole === 'admin';
  const userId = req.userId;

  try {
    const result = await db.query<RefundRow>(
      `SELECT * FROM public.refund_requests
       WHERE ${isAdmin ? 'TRUE' : 'user_id = $1'}
       ORDER BY created_at DESC`,
      isAdmin ? [] : [userId],
    );

    return res.json({ refunds: result.rows.map(formatRefund) });
  } catch (err) {
    console.error('[Refunds] List error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── POST /api/refunds ─────────────────────────────────────────────────────
// User tạo yêu cầu hoàn tiền
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const {
    bankName, accountNumber, accountHolder,
    amount, orderCode, refundReason,
    flightDate, ticketNumber, passengerName,
  } = req.body ?? {};

  if (!bankName || !accountNumber || !accountHolder) {
    return res.status(400).json({ error: 'Thông tin ngân hàng là bắt buộc.' });
  }
  if (!amount || !orderCode) {
    return res.status(400).json({ error: 'Số tiền và mã đặt chỗ là bắt buộc.' });
  }

  const userId = req.userId!;

  try {
    // Lấy thông tin user
    const userResult = await db.query<{ sdt: string; display_name: string }>(
      `SELECT sdt, display_name FROM public.users WHERE id = $1`,
      [userId],
    );
    const user = userResult.rows[0];

    const result = await db.query<RefundRow>(
      `INSERT INTO public.refund_requests
         (user_id, user_sdt, display_name, bank_name, account_number, account_holder,
          amount, order_code, refund_reason, flight_date, ticket_number, passenger_name, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)
       RETURNING *`,
      [
        userId,
        user?.sdt || '',
        user?.display_name || '',
        bankName, accountNumber, accountHolder,
        amount, orderCode, refundReason || '',
        flightDate || '', ticketNumber || '', passengerName || '',
      ],
    );

    return res.status(201).json({ refund: formatRefund(result.rows[0]) });
  } catch (err) {
    console.error('[Refunds] Create error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── GET /api/refunds/:id ──────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isAdmin = req.userRole === 'admin';
  const userId = req.userId!;

  try {
    const result = await db.query<RefundRow>(
      `SELECT * FROM public.refund_requests
       WHERE id = $1
         AND (${isAdmin ? 'TRUE' : 'user_id = $2'})
       LIMIT 1`,
      isAdmin ? [id] : [id, userId],
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu hoàn tiền.' });
    }

    return res.json({ refund: formatRefund(result.rows[0]) });
  } catch (err) {
    console.error('[Refunds] Get error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── PATCH /api/refunds/:id ────────────────────────────────────────────────
// User: cập nhật yêu cầu pending của mình. Admin: cập nhật tất cả.
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isAdmin = req.userRole === 'admin';
  const userId = req.userId!;

  const {
    bankName, accountNumber, accountHolder,
    amount, orderCode, refundReason,
    flightDate, ticketNumber, passengerName,
    status,
    adminNote, processingTime, refundSlipCode,
    approvedBy, completedBy, transferNote,
    isVisible,
  } = req.body ?? {};

  // Kiểm tra quyền
  if (!isAdmin) {
    // User chỉ được sửa khi status = pending
    const existing = await db.query<{ status: string; user_id: string }>(
      `SELECT status, user_id FROM public.refund_requests WHERE id = $1`,
      [id],
    );
    if (!existing.rows.length || existing.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật yêu cầu này.' });
    }
    if (existing.rows[0].status !== 'pending') {
      return res.status(403).json({ error: 'Chỉ có thể cập nhật yêu cầu đang chờ xử lý.' });
    }
  }

  try {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    // User fields
    if (bankName !== undefined)       { updates.push(`bank_name = $${idx++}`); values.push(bankName); }
    if (accountNumber !== undefined)  { updates.push(`account_number = $${idx++}`); values.push(accountNumber); }
    if (accountHolder !== undefined)  { updates.push(`account_holder = $${idx++}`); values.push(accountHolder); }
    if (amount !== undefined)         { updates.push(`amount = $${idx++}`); values.push(amount); }
    if (orderCode !== undefined)      { updates.push(`order_code = $${idx++}`); values.push(orderCode); }
    if (refundReason !== undefined)   { updates.push(`refund_reason = $${idx++}`); values.push(refundReason); }
    if (flightDate !== undefined)     { updates.push(`flight_date = $${idx++}`); values.push(flightDate); }
    if (ticketNumber !== undefined)    { updates.push(`ticket_number = $${idx++}`); values.push(ticketNumber); }
    if (passengerName !== undefined)  { updates.push(`passenger_name = $${idx++}`); values.push(passengerName); }

    // Admin fields
    if (isAdmin) {
      if (isVisible !== undefined)     { updates.push(`is_visible = $${idx++}`); values.push(isVisible); }
      if (status !== undefined) {
        updates.push(`status = $${idx++}`);
        values.push(status);

        // Auto-set approved_by / completed_by / refund_slip_code
        if (status === 'approved') {
          updates.push(`approved_by = $${idx++}`);
          values.push(req.user?.email || 'admin');
          updates.push(`approved_at = $${idx++}`);
          values.push(new Date());
        }
        if (status === 'completed') {
          const slipCode = refundSlipCode || `TT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${id.slice(0,8).toUpperCase()}`;
          updates.push(`completed_by = $${idx++}`);
          values.push(req.user?.email || 'admin');
          updates.push(`completed_at = $${idx++}`);
          values.push(new Date());
          updates.push(`refund_slip_code = $${idx++}`);
          values.push(slipCode);
        }
      }
      if (adminNote !== undefined)      { updates.push(`admin_note = $${idx++}`); values.push(adminNote); }
      if (processingTime !== undefined)  { updates.push(`processing_time = $${idx++}`); values.push(processingTime); }
      if (refundSlipCode !== undefined) { updates.push(`refund_slip_code = $${idx++}`); values.push(refundSlipCode); }
      if (approvedBy !== undefined)      { updates.push(`approved_by = $${idx++}`); values.push(approvedBy); }
      if (completedBy !== undefined)    { updates.push(`completed_by = $${idx++}`); values.push(completedBy); }
      if (transferNote !== undefined)    { updates.push(`transfer_note = $${idx++}`); values.push(transferNote); }
    }

    if (updates.length === 0) {
      return res.json({ success: true, message: 'Không có gì để cập nhật.' });
    }

    values.push(id);
    const result = await db.query<RefundRow>(
      `UPDATE public.refund_requests SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu hoàn tiền.' });
    }

    return res.json({ refund: formatRefund(result.rows[0]) });
  } catch (err) {
    console.error('[Refunds] Update error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// ── DELETE /api/refunds/:id ───────────────────────────────────────────────
router.delete('/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM public.refund_requests WHERE id = $1 RETURNING id`,
      [id],
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu hoàn tiền.' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[Refunds] Delete error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

export default router;

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/bills - Get all bills (Admin: all, Tenant: own)
router.get('/', authenticate, async (req, res) => {
  try {
    let query = `
      SELECT b.*, 
             t.first_name, t.last_name,
             r.room_number, r.floor
      FROM bills b
      JOIN tenants t ON b.tenant_id = t.id
      JOIN rooms r ON b.room_id = r.id
    `;
    const params = [];

    if (req.user.role === 'tenant') {
      const tenantResult = await pool.query(
        'SELECT id FROM tenants WHERE user_id = $1 AND is_active = TRUE',
        [req.user.id]
      );
      if (tenantResult.rows.length === 0) {
        return res.json({ success: true, data: [] });
      }
      params.push(tenantResult.rows[0].id);
      query += ` WHERE b.tenant_id = $${params.length}`;
    }

    const { status, month, year } = req.query;
    if (status) {
      params.push(status);
      query += ` ${params.length === 1 ? 'WHERE' : 'AND'} b.status = $${params.length}`;
    }
    if (month) {
      params.push(month);
      query += ` ${params.length === 1 ? 'WHERE' : 'AND'} b.bill_month = $${params.length}`;
    }
    if (year) {
      params.push(year);
      query += ` ${params.length === 1 ? 'WHERE' : 'AND'} b.bill_year = $${params.length}`;
    }

    query += ' ORDER BY b.bill_year DESC, b.bill_month DESC, b.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/bills/:id - Get single bill
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, 
              t.first_name, t.last_name, t.phone, t.national_id,
              r.room_number, r.floor, r.room_type
       FROM bills b
       JOIN tenants t ON b.tenant_id = t.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/bills - Create bill (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const {
    tenant_id, room_id, bill_month, bill_year,
    water_units, electricity_units, other_fees, notes
  } = req.body;

  if (!tenant_id || !room_id || !bill_month || !bill_year) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  try {
    // Check duplicate bill
    const existing = await pool.query(
      'SELECT id FROM bills WHERE tenant_id = $1 AND bill_month = $2 AND bill_year = $3',
      [tenant_id, bill_month, bill_year]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Bill already exists for this tenant and month' });
    }

    // Get room rates and rent
    const roomResult = await pool.query(
      'SELECT monthly_rent, water_rate, electricity_rate FROM rooms WHERE id = $1',
      [room_id]
    );
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const room = roomResult.rows[0];
    const water_amount = (water_units || 0) * room.water_rate;
    const electricity_amount = (electricity_units || 0) * room.electricity_rate;
    const total_amount = parseFloat(room.monthly_rent) + water_amount + electricity_amount + (other_fees || 0);
    const due_date = new Date(bill_year, bill_month - 1, 15); // Due on 15th of the month

    const result = await pool.query(
      `INSERT INTO bills (tenant_id, room_id, bill_month, bill_year, monthly_rent,
                          water_units, water_amount, electricity_units, electricity_amount,
                          other_fees, total_amount, due_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [tenant_id, room_id, bill_month, bill_year, room.monthly_rent,
       water_units || 0, water_amount, electricity_units || 0, electricity_amount,
       other_fees || 0, total_amount, due_date, notes]
    );

    res.status(201).json({ success: true, message: 'Bill created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/bills/:id/status - Update bill payment status (Admin only)
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { status, paid_date } = req.body;

  if (!status || !['pending', 'paid', 'overdue'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      `UPDATE bills SET 
        status = $1, 
        paid_date = $2,
        updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, status === 'paid' ? (paid_date || new Date()) : null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    res.json({ success: true, message: 'Bill status updated', data: result.rows[0] });
  } catch (error) {
    console.error('Update bill status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/bills/:id - Update bill (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { water_units, electricity_units, other_fees, notes } = req.body;

  try {
    const billResult = await pool.query('SELECT * FROM bills WHERE id = $1', [req.params.id]);
    if (billResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const bill = billResult.rows[0];
    const roomResult = await pool.query('SELECT water_rate, electricity_rate FROM rooms WHERE id = $1', [bill.room_id]);
    const room = roomResult.rows[0];

    const new_water_units = water_units !== undefined ? water_units : bill.water_units;
    const new_electricity_units = electricity_units !== undefined ? electricity_units : bill.electricity_units;
    const new_other_fees = other_fees !== undefined ? other_fees : bill.other_fees;

    const water_amount = new_water_units * room.water_rate;
    const electricity_amount = new_electricity_units * room.electricity_rate;
    const total_amount = parseFloat(bill.monthly_rent) + water_amount + electricity_amount + parseFloat(new_other_fees);

    const result = await pool.query(
      `UPDATE bills SET
        water_units = $1, water_amount = $2,
        electricity_units = $3, electricity_amount = $4,
        other_fees = $5, total_amount = $6,
        notes = COALESCE($7, notes),
        updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [new_water_units, water_amount, new_electricity_units, electricity_amount,
       new_other_fees, total_amount, notes, req.params.id]
    );

    res.json({ success: true, message: 'Bill updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/bills/:id - Delete bill (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await pool.query('SELECT id FROM bills WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    await pool.query('DELETE FROM bills WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

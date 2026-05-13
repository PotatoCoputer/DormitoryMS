const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/rooms - Get all rooms
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, floor } = req.query;
    let query = `
      SELECT r.*, 
             t.first_name, t.last_name, t.phone as tenant_phone,
             t.id as tenant_id
      FROM rooms r
      LEFT JOIN tenants t ON r.id = t.room_id AND t.is_active = TRUE
    `;
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }
    if (floor) {
      params.push(floor);
      conditions.push(`r.floor = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY r.floor, r.room_number';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/rooms/:id - Get single room
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, 
              t.first_name, t.last_name, t.phone as tenant_phone, t.id as tenant_id,
              t.move_in_date, t.national_id
       FROM rooms r
       LEFT JOIN tenants t ON r.id = t.room_id AND t.is_active = TRUE
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/rooms - Create room (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { room_number, floor, room_type, monthly_rent, water_rate, electricity_rate, status, description } = req.body;

  if (!room_number || !floor || !monthly_rent) {
    return res.status(400).json({ success: false, message: 'Room number, floor, and monthly rent are required' });
  }

  try {
    const existing = await pool.query('SELECT id FROM rooms WHERE room_number = $1', [room_number]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Room number already exists' });
    }

    const result = await pool.query(
      `INSERT INTO rooms (room_number, floor, room_type, monthly_rent, water_rate, electricity_rate, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [room_number, floor, room_type || 'standard', monthly_rent, water_rate || 18, electricity_rate || 8, status || 'available', description]
    );

    res.status(201).json({ success: true, message: 'Room created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/rooms/:id - Update room (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { room_number, floor, room_type, monthly_rent, water_rate, electricity_rate, status, description } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM rooms WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const result = await pool.query(
      `UPDATE rooms SET
        room_number = COALESCE($1, room_number),
        floor = COALESCE($2, floor),
        room_type = COALESCE($3, room_type),
        monthly_rent = COALESCE($4, monthly_rent),
        water_rate = COALESCE($5, water_rate),
        electricity_rate = COALESCE($6, electricity_rate),
        status = COALESCE($7, status),
        description = COALESCE($8, description),
        updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [room_number, floor, room_type, monthly_rent, water_rate, electricity_rate, status, description, req.params.id]
    );

    res.json({ success: true, message: 'Room updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/rooms/:id - Delete room (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await pool.query('SELECT id, status FROM rooms WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (existing.rows[0].status === 'occupied') {
      return res.status(400).json({ success: false, message: 'Cannot delete an occupied room' });
    }

    await pool.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/maintenance - Get maintenance requests
router.get('/', authenticate, async (req, res) => {
  try {
    let query = `
      SELECT m.*,
             t.first_name, t.last_name,
             r.room_number, r.floor
      FROM maintenance_requests m
      JOIN tenants t ON m.tenant_id = t.id
      JOIN rooms r ON m.room_id = r.id
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
      query += ` WHERE m.tenant_id = $${params.length}`;
    }

    const { status, priority } = req.query;
    if (status) {
      params.push(status);
      query += ` ${params.length === 1 ? 'WHERE' : 'AND'} m.status = $${params.length}`;
    }
    if (priority) {
      params.push(priority);
      query += ` ${params.length === 1 ? 'WHERE' : 'AND'} m.priority = $${params.length}`;
    }

    query += ' ORDER BY m.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get maintenance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/maintenance/:id - Get single request
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, t.first_name, t.last_name, t.phone,
              r.room_number, r.floor
       FROM maintenance_requests m
       JOIN tenants t ON m.tenant_id = t.id
       JOIN rooms r ON m.room_id = r.id
       WHERE m.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get maintenance request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/maintenance - Create maintenance request (Tenant)
router.post('/', authenticate, async (req, res) => {
  const { title, description, priority } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required' });
  }

  try {
    // Get tenant info
    const tenantResult = await pool.query(
      'SELECT id, room_id FROM tenants WHERE user_id = $1 AND is_active = TRUE',
      [req.user.id]
    );

    // Admin can also create requests
    let tenant_id, room_id;
    if (req.user.role === 'admin') {
      const { tenant_id: tid, room_id: rid } = req.body;
      if (!tid || !rid) {
        return res.status(400).json({ success: false, message: 'Admin must provide tenant_id and room_id' });
      }
      tenant_id = tid;
      room_id = rid;
    } else {
      if (tenantResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tenant profile not found' });
      }
      tenant_id = tenantResult.rows[0].id;
      room_id = tenantResult.rows[0].room_id;
    }

    const result = await pool.query(
      `INSERT INTO maintenance_requests (tenant_id, room_id, title, description, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenant_id, room_id, title, description, priority || 'medium']
    );

    res.status(201).json({ success: true, message: 'Maintenance request created', data: result.rows[0] });
  } catch (error) {
    console.error('Create maintenance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/maintenance/:id/status - Update status (Admin only)
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { status, admin_notes } = req.body;

  if (!status || !['pending', 'in_progress', 'resolved', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      `UPDATE maintenance_requests SET
        status = $1,
        admin_notes = COALESCE($2, admin_notes),
        resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END,
        updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, admin_notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, message: 'Status updated', data: result.rows[0] });
  } catch (error) {
    console.error('Update maintenance status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/maintenance/:id - Delete request (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await pool.query('SELECT id FROM maintenance_requests WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    await pool.query('DELETE FROM maintenance_requests WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete maintenance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

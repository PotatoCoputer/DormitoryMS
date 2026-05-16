const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: จัดการข้อมูลผู้เช่า
 *
 * /api/tenants:
 *   get:
 *     tags: [Tenants]
 *     summary: ดูรายการผู้เช่าทั้งหมด (Admin)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: รายการผู้เช่าทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tenant'
 *   post:
 *     tags: [Tenants]
 *     summary: เพิ่มผู้เช่าใหม่ (Admin)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [first_name, last_name, national_id, phone, room_id, move_in_date]
 *             properties:
 *               first_name: { type: string, example: สมชาย }
 *               last_name: { type: string, example: ใจดี }
 *               national_id: { type: string, example: '1100100100199' }
 *               phone: { type: string, example: 081-999-9999 }
 *               email: { type: string, example: user@email.com }
 *               room_id: { type: integer, example: 3 }
 *               move_in_date: { type: string, format: date, example: '2026-05-01' }
 *               create_user: { type: boolean, example: true }
 *               username: { type: string, example: newuser }
 *               password: { type: string, example: password123 }
 *     responses:
 *       201: { description: เพิ่มผู้เช่าสำเร็จ }
 *       409: { description: เลขบัตรประชาชน, email หรือ username ซ้ำ }
 *
 * /api/tenants/{id}:
 *   put:
 *     tags: [Tenants]
 *     summary: แก้ไขข้อมูลผู้เช่า (Admin)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: อัปเดตสำเร็จ }
 *   delete:
 *     tags: [Tenants]
 *     summary: ลบผู้เช่า (Admin)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: ลบสำเร็จ }
 *
 * /api/tenants/me:
 *   get:
 *     tags: [Tenants]
 *     summary: ดูข้อมูลตัวเอง (Tenant)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: ข้อมูลผู้เช่า }
 */

/**
 * @swagger
 * tags:
 *   name: Bills
 *   description: จัดการบิลค่าเช่า
 *
 * /api/bills:
 *   get:
 *     tags: [Bills]
 *     summary: ดูรายการบิล (Admin=ทั้งหมด, Tenant=ของตัวเอง)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *         description: กรองตามเดือน (1-12)
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: กรองตามปี (เช่น 2026)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, overdue]
 *         description: กรองตามสถานะ
 *     responses:
 *       200:
 *         description: รายการบิล
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bill'
 *   post:
 *     tags: [Bills]
 *     summary: สร้างบิลใหม่ (Admin)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenant_id, room_id, bill_month, bill_year]
 *             properties:
 *               tenant_id: { type: integer, example: 1 }
 *               room_id: { type: integer, example: 1 }
 *               bill_month: { type: integer, example: 5 }
 *               bill_year: { type: integer, example: 2026 }
 *               water_units: { type: number, example: 10 }
 *               electricity_units: { type: number, example: 150 }
 *               other_fees: { type: number, example: 0 }
 *               notes: { type: string }
 *     responses:
 *       201: { description: สร้างบิลสำเร็จ }
 *       409: { description: บิลเดือนนี้มีอยู่แล้ว }
 *
 * /api/bills/{id}/status:
 *   put:
 *     tags: [Bills]
 *     summary: อัปเดตสถานะการชำระเงิน (Admin)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, paid, overdue] }
 *               paid_date: { type: string, format: date, example: '2026-05-10' }
 *     responses:
 *       200: { description: อัปเดตสำเร็จ }
 */

// GET /api/tenants - Get all tenants (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, r.room_number, r.floor, r.room_type, r.monthly_rent,
              u.username, u.email as user_email
       FROM tenants t
       LEFT JOIN rooms r ON t.room_id = r.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.is_active = TRUE
       ORDER BY t.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tenants/me - Get current tenant's info
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, r.room_number, r.floor, r.room_type, r.monthly_rent,
              r.water_rate, r.electricity_rate
       FROM tenants t
       LEFT JOIN rooms r ON t.room_id = r.id
       WHERE t.user_id = $1 AND t.is_active = TRUE`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant profile not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tenants/:id - Get single tenant (Admin only)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, r.room_number, r.floor, r.room_type, r.monthly_rent,
              u.username, u.email as user_email
       FROM tenants t
       LEFT JOIN rooms r ON t.room_id = r.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/tenants - Create tenant (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const {
    first_name, last_name, national_id, phone, email, emergency_contact,
    emergency_phone, room_id, move_in_date, create_user, username, password
  } = req.body;

  if (!first_name || !last_name || !national_id || !phone || !room_id || !move_in_date) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check room availability
    const roomResult = await client.query('SELECT id, status FROM rooms WHERE id = $1', [room_id]);
    if (roomResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    if (roomResult.rows[0].status === 'occupied') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Room is already occupied' });
    }
    if (roomResult.rows[0].status === 'maintenance') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Room is under maintenance' });
    }

    // Check national ID uniqueness
    const existingTenant = await client.query('SELECT id FROM tenants WHERE national_id = $1', [national_id]);
    if (existingTenant.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Tenant with this national ID already exists' });
    }

    let user_id = null;

    // Create user account if requested
    if (create_user && username && password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      const userResult = await client.query(
        `INSERT INTO users (username, password_hash, full_name, email, phone, role)
         VALUES ($1, $2, $3, $4, $5, 'tenant') RETURNING id`,
        [username, password_hash, `${first_name} ${last_name}`, email, phone]
      );
      user_id = userResult.rows[0].id;
    }

    // Create tenant
    const tenantResult = await client.query(
      `INSERT INTO tenants (user_id, room_id, first_name, last_name, national_id, phone, email, 
                            emergency_contact, emergency_phone, move_in_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [user_id, room_id, first_name, last_name, national_id, phone, email,
       emergency_contact, emergency_phone, move_in_date]
    );

    // Update room status
    await client.query("UPDATE rooms SET status = 'occupied', updated_at = NOW() WHERE id = $1", [room_id]);

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Tenant created successfully', data: tenantResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create tenant error:', error);
    // แปล PostgreSQL unique constraint error ให้เข้าใจง่าย
    if (error.code === '23505') {
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น' });
      }
      if (error.constraint === 'users_username_key') {
        return res.status(409).json({ success: false, message: 'Username นี้ถูกใช้งานแล้ว กรุณาใช้ชื่ออื่น' });
      }
      if (error.constraint === 'tenants_national_id_key') {
        return res.status(409).json({ success: false, message: 'เลขบัตรประชาชนนี้มีในระบบแล้ว' });
      }
    }
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/tenants/:id - Update tenant (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { first_name, last_name, phone, email, emergency_contact, emergency_phone, move_out_date, is_active } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM tenants WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const tenant = existing.rows[0];

    const result = await client.query(
      `UPDATE tenants SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        emergency_contact = COALESCE($5, emergency_contact),
        emergency_phone = COALESCE($6, emergency_phone),
        move_out_date = COALESCE($7, move_out_date),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [first_name, last_name, phone, email, emergency_contact, emergency_phone, move_out_date, is_active, req.params.id]
    );

    // If marking as inactive (moved out), free the room
    if (is_active === false && tenant.is_active === true && tenant.room_id) {
      await client.query("UPDATE rooms SET status = 'available', updated_at = NOW() WHERE id = $1", [tenant.room_id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Tenant updated successfully', data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update tenant error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/tenants/:id - Delete tenant (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM tenants WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const tenant = existing.rows[0];

    // Free the room before deleting
    if (tenant.room_id) {
      await client.query("UPDATE rooms SET status = 'available', updated_at = NOW() WHERE id = $1", [tenant.room_id]);
    }

    // Delete tenant record
    await client.query('DELETE FROM tenants WHERE id = $1', [req.params.id]);

    // Delete associated user account (if exists) to free up email/username
    if (tenant.user_id) {
      await client.query('DELETE FROM users WHERE id = $1', [tenant.user_id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete tenant error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;

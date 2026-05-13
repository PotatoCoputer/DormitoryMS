const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = TRUE',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // If tenant, get room info
    let tenantInfo = null;
    if (user.role === 'tenant') {
      const tenantResult = await pool.query(
        `SELECT t.*, r.room_number, r.floor, r.room_type, r.monthly_rent
         FROM tenants t
         LEFT JOIN rooms r ON t.room_id = r.id
         WHERE t.user_id = $1 AND t.is_active = TRUE`,
        [user.id]
      );
      if (tenantResult.rows.length > 0) {
        tenantInfo = tenantResult.rows[0];
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      tenant: tenantInfo,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/register (Admin only via seeding, but available for creating tenant accounts)
router.post('/register', async (req, res) => {
  const { username, password, full_name, email, phone, role = 'tenant' } = req.body;

  if (!username || !password || !full_name || !email) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  try {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, full_name, email, role`,
      [username, password_hash, full_name, email, phone, role]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

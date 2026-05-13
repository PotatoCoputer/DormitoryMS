const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/dashboard - Dashboard statistics (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Room statistics
    const roomStats = await pool.query(`
      SELECT 
        COUNT(*) as total_rooms,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_rooms,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_rooms
      FROM rooms
    `);

    // Active tenants count
    const tenantStats = await pool.query(`
      SELECT COUNT(*) as active_tenants FROM tenants WHERE is_active = TRUE
    `);

    // Current month revenue
    const revenueStats = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_billed,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN status IN ('pending', 'overdue') THEN total_amount ELSE 0 END), 0) as outstanding
      FROM bills
      WHERE bill_month = $1 AND bill_year = $2
    `, [currentMonth, currentYear]);

    // Overdue bills count
    const overdueStats = await pool.query(`
      SELECT COUNT(*) as overdue_bills FROM bills WHERE status = 'overdue'
    `);

    // Unpaid bills count
    const unpaidStats = await pool.query(`
      SELECT COUNT(*) as unpaid_bills FROM bills WHERE status = 'pending'
    `);

    // Maintenance stats
    const maintenanceStats = await pool.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_requests,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_requests
      FROM maintenance_requests
    `);

    // Recent maintenance requests (latest 5)
    const recentMaintenance = await pool.query(`
      SELECT m.*, t.first_name, t.last_name, r.room_number
      FROM maintenance_requests m
      JOIN tenants t ON m.tenant_id = t.id
      JOIN rooms r ON m.room_id = r.id
      ORDER BY m.created_at DESC
      LIMIT 5
    `);

    // Monthly revenue for chart (last 6 months)
    const monthlyRevenue = await pool.query(`
      SELECT 
        bill_month, bill_year,
        SUM(total_amount) as total,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as collected
      FROM bills
      WHERE (bill_year = $1 AND bill_month >= $2) OR (bill_year = $3 AND bill_month < $2)
      GROUP BY bill_month, bill_year
      ORDER BY bill_year DESC, bill_month DESC
      LIMIT 6
    `, [currentYear, currentMonth - 5 > 0 ? currentMonth - 5 : 1, currentYear - 1]);

    // Recent bills (latest 5)
    const recentBills = await pool.query(`
      SELECT b.*, t.first_name, t.last_name, r.room_number
      FROM bills b
      JOIN tenants t ON b.tenant_id = t.id
      JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        rooms: roomStats.rows[0],
        tenants: tenantStats.rows[0],
        revenue: revenueStats.rows[0],
        overdue: overdueStats.rows[0],
        unpaid: unpaidStats.rows[0],
        maintenance: maintenanceStats.rows[0],
        recentMaintenance: recentMaintenance.rows,
        recentBills: recentBills.rows,
        monthlyRevenue: monthlyRevenue.rows.reverse(),
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite dev
    'http://localhost:3000',  // alt dev
    'http://localhost',       // Docker Nginx (port 80)
    'http://localhost:80',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { background-color: #1e1b4b; }',
  customSiteTitle: 'DormMS API Docs',
}));

// Expose raw OpenAPI JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: ตรวจสอบสถานะ API
 *     responses:
 *       200:
 *         description: API กำลังทำงาน
 *         content:
 *           application/json:
 *             example:
 *               status: OK
 *               message: Dormitory Management System API is running
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dormitory Management System API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
});

module.exports = app;


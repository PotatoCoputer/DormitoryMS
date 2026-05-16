const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🏢 Dormitory Management System API',
      version: '1.0.0',
      description: `
## API สำหรับระบบจัดการหอพัก

ระบบนี้รองรับ 2 roles:
- **admin** — จัดการห้อง, ผู้เช่า, บิล, แจ้งซ่อม
- **tenant** — ดูข้อมูลห้องตัวเอง, บิล, แจ้งซ่อม

### การ Authentication
ใช้ **JWT Bearer Token** — Login แล้วนำ token ที่ได้มาใส่ใน Header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
      `,
      contact: {
        name: 'Dormitory Management System',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
      {
        url: 'http://localhost/api',
        description: 'Docker (Production)',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ===== AUTH =====
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', example: 'admin123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },

        // ===== USER =====
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'admin' },
            full_name: { type: 'string', example: 'ผู้ดูแลระบบ' },
            email: { type: 'string', example: 'admin@dormitory.com' },
            phone: { type: 'string', example: '081-000-0001' },
            role: { type: 'string', enum: ['admin', 'tenant'], example: 'admin' },
          },
        },

        // ===== ROOM =====
        Room: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            room_number: { type: 'string', example: '101' },
            floor: { type: 'integer', example: 1 },
            room_type: { type: 'string', enum: ['standard', 'deluxe', 'suite'], example: 'standard' },
            monthly_rent: { type: 'number', example: 3500 },
            water_rate: { type: 'number', example: 18 },
            electricity_rate: { type: 'number', example: 8 },
            status: { type: 'string', enum: ['available', 'occupied', 'maintenance'], example: 'available' },
            description: { type: 'string', example: 'ห้องมาตรฐาน ชั้น 1' },
          },
        },

        // ===== TENANT =====
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 2 },
            room_id: { type: 'integer', example: 1 },
            first_name: { type: 'string', example: 'สมชาย' },
            last_name: { type: 'string', example: 'ใจดี' },
            national_id: { type: 'string', example: '1100100100101' },
            phone: { type: 'string', example: '081-111-1111' },
            email: { type: 'string', example: 'somchai@email.com' },
            emergency_contact: { type: 'string', example: 'สมหมาย ใจดี' },
            emergency_phone: { type: 'string', example: '081-111-1100' },
            move_in_date: { type: 'string', format: 'date', example: '2025-01-15' },
            is_active: { type: 'boolean', example: true },
          },
        },

        // ===== BILL =====
        Bill: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            tenant_id: { type: 'integer', example: 1 },
            room_id: { type: 'integer', example: 1 },
            bill_month: { type: 'integer', example: 5 },
            bill_year: { type: 'integer', example: 2026 },
            monthly_rent: { type: 'number', example: 3500 },
            water_units: { type: 'number', example: 10 },
            water_amount: { type: 'number', example: 180 },
            electricity_units: { type: 'number', example: 150 },
            electricity_amount: { type: 'number', example: 1200 },
            other_fees: { type: 'number', example: 0 },
            total_amount: { type: 'number', example: 4880 },
            due_date: { type: 'string', format: 'date', example: '2026-05-15' },
            paid_date: { type: 'string', format: 'date', example: null },
            status: { type: 'string', enum: ['pending', 'paid', 'overdue'], example: 'pending' },
          },
        },

        // ===== MAINTENANCE =====
        MaintenanceRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            tenant_id: { type: 'integer', example: 1 },
            room_id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'ก๊อกน้ำรั่ว' },
            description: { type: 'string', example: 'ก๊อกน้ำในห้องน้ำรั่ว น้ำหยดตลอดเวลา' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], example: 'high' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'resolved'], example: 'pending' },
            admin_notes: { type: 'string', example: 'ส่งช่างไปแล้ว' },
            resolved_at: { type: 'string', format: 'date-time', example: null },
          },
        },

        // ===== COMMON =====
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Rooms', description: 'Room management (Admin)' },
      { name: 'Tenants', description: 'Tenant management (Admin)' },
      { name: 'Bills', description: 'Billing management' },
      { name: 'Maintenance', description: 'Maintenance requests' },
      { name: 'Dashboard', description: 'Summary & statistics (Admin)' },
      { name: 'Health', description: 'API health check' },
    ],
  },
  apis: ['./src/routes/*.js', './src/index.js'],
};

module.exports = swaggerJsdoc(options);

# 🏠 DormMS - Dormitory Management System

ระบบบริหารงานหอพัก พัฒนาด้วย React + Node.js + PostgreSQL

## 📋 Features

- **Authentication** - Login/Logout พร้อมแบ่งสิทธิ์ Admin / Tenant
- **ระบบจัดการห้องพัก** - CRUD ห้องพัก + แสดงสถานะ (ว่าง/มีผู้เช่า/ปิดปรับปรุง)
- **ระบบผู้เช่า** - เพิ่ม/แก้ไข/บันทึกการย้ายออก พร้อมสร้าง user account
- **ระบบออกบิล** - สร้างบิลรายเดือน คำนวณค่าเช่า/น้ำ/ไฟ เปลี่ยนสถานะชำระ
- **ระบบแจ้งซ่อม** - ผู้เช่าแจ้งปัญหา Admin อัพเดตสถานะ
- **Dashboard** - ภาพรวมห้อง รายได้ บิลค้างชำระ งานซ่อม พร้อมกราฟ

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Charts | Recharts |

## 🚀 Installation & Setup

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### 1. Setup Database

```bash
# สร้าง database
createdb dormitory_ms

# Import schema + seed data
psql -U postgres -d dormitory_ms -f server/src/database/schema.sql
```

### 2. Setup Backend

```bash
cd server
# แก้ไข .env ให้ตรงกับ PostgreSQL ของคุณ
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/dormitory_ms
npm install
npm run dev
```

### 3. Setup Frontend

```bash
cd client
npm install
npm run dev
```

### 4. Open Browser

```
Frontend: http://localhost:5173
Backend API: http://localhost:5000/api
```

## 🔑 Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Tenant | tenant1 | tenant123 |
| Tenant | tenant2 | tenant123 |
| Tenant | tenant3 | tenant123 |

## 📁 Project Structure

```
DormitoryMS/
├── client/          # React Frontend (Vite)
│   ├── src/
│   │   ├── components/   # Layout
│   │   ├── context/      # AuthContext
│   │   ├── pages/        # All pages
│   │   └── services/     # API client
│   └── .env
└── server/          # Node.js Backend
    ├── src/
    │   ├── config/       # DB connection
    │   ├── middleware/   # JWT auth
    │   ├── routes/       # API routes
    │   └── database/     # Schema + seed SQL
    └── .env
```

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | Public | Login |
| GET | /api/rooms | Auth | Get all rooms |
| POST | /api/rooms | Admin | Create room |
| PUT | /api/rooms/:id | Admin | Update room |
| DELETE | /api/rooms/:id | Admin | Delete room |
| GET | /api/tenants | Admin | Get all tenants |
| POST | /api/tenants | Admin | Create tenant |
| PUT | /api/tenants/:id | Admin | Update tenant |
| DELETE | /api/tenants/:id | Admin | Delete tenant |
| GET | /api/bills | Auth | Get bills |
| POST | /api/bills | Admin | Create bill |
| PUT | /api/bills/:id/status | Admin | Update bill status |
| GET | /api/maintenance | Auth | Get requests |
| POST | /api/maintenance | Auth | Create request |
| PUT | /api/maintenance/:id/status | Admin | Update status |
| GET | /api/dashboard | Admin | Dashboard stats |

## 🗄 Database Schema

```
users          → id, username, password_hash, full_name, email, role
rooms          → id, room_number, floor, room_type, monthly_rent, status
tenants        → id, user_id, room_id, first_name, last_name, national_id, move_in_date
bills          → id, tenant_id, room_id, bill_month, bill_year, total_amount, status
maintenance    → id, tenant_id, room_id, title, description, priority, status
```

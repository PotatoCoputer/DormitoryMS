# 📡 API Documentation — Dormitory Management System

> **Base URL (Dev):** `http://localhost:5000`  
> **Base URL (Docker):** `http://localhost/api`  
> **Interactive UI:** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

---

## 🔐 Authentication

ระบบใช้ **JWT Bearer Token** — Login แล้วนำ token ไปใส่ใน Header ทุก request:

```
Authorization: Bearer <token>
```

| สัญลักษณ์ | ความหมาย |
|----------|---------|
| ❌ | ไม่ต้อง Login |
| ✅ | ต้อง Login (ทุก role) |
| 🔑 Admin | Admin เท่านั้น |
| 🏠 Tenant | Tenant เท่านั้น |

---

## 📋 สารบัญ

- [Auth](#-auth)
- [Rooms](#-rooms)
- [Tenants](#-tenants)
- [Bills](#-bills)
- [Maintenance](#-maintenance)
- [Dashboard](#-dashboard)
- [Health](#-health)

---

## 🔑 Auth

### POST `/api/auth/login`
เข้าสู่ระบบ รับ JWT Token กลับมา ❌

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "ผู้ดูแลระบบ",
    "email": "admin@dormitory.com",
    "role": "admin"
  },
  "tenant": null
}
```

**Response 401:** Username หรือ Password ไม่ถูกต้อง

---

### POST `/api/auth/register`
สร้างบัญชีผู้ใช้ใหม่ ❌

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "full_name": "ชื่อ นามสกุล",
  "email": "user@email.com",
  "phone": "081-000-0000",
  "role": "tenant"
}
```

**Response 201:** สร้างสำเร็จ  
**Response 409:** Username หรือ Email ซ้ำ

---

## 🏠 Rooms

### GET `/api/rooms` ✅
ดูรายการห้องพักทั้งหมด

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | กรองตามสถานะ: `available`, `occupied`, `maintenance` |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "room_number": "101",
      "floor": 1,
      "room_type": "standard",
      "monthly_rent": 3500,
      "water_rate": 18,
      "electricity_rate": 8,
      "status": "occupied",
      "description": "ห้องมาตรฐาน ชั้น 1"
    }
  ]
}
```

---

### POST `/api/rooms` 🔑 Admin
เพิ่มห้องใหม่

**Request Body:**
```json
{
  "room_number": "305",
  "floor": 3,
  "room_type": "standard",
  "monthly_rent": 4000,
  "water_rate": 18,
  "electricity_rate": 8,
  "status": "available",
  "description": "ห้องมาตรฐาน ชั้น 3"
}
```

| Field | Required | Values |
|-------|----------|--------|
| `room_number` | ✅ | ตัวเลขห้อง (unique) |
| `floor` | ✅ | ชั้น |
| `monthly_rent` | ✅ | ค่าเช่ารายเดือน |
| `room_type` | ❌ | `standard`, `deluxe`, `suite` |
| `water_rate` | ❌ | ค่าน้ำต่อหน่วย (default: 18) |
| `electricity_rate` | ❌ | ค่าไฟต่อหน่วย (default: 8) |
| `status` | ❌ | `available`, `maintenance` |

**Response 201:** สร้างสำเร็จ  
**Response 409:** หมายเลขห้องซ้ำ

---

### PUT `/api/rooms/:id` 🔑 Admin
แก้ไขข้อมูลห้อง

**Request Body:** (ส่งเฉพาะ field ที่ต้องการเปลี่ยน)
```json
{
  "monthly_rent": 4500,
  "status": "maintenance",
  "description": "ปิดซ่อมแซม"
}
```

**Response 200:** อัปเดตสำเร็จ  
**Response 404:** ไม่พบห้อง

---

### DELETE `/api/rooms/:id` 🔑 Admin
ลบห้อง

**Response 200:** ลบสำเร็จ  
**Response 400:** ไม่สามารถลบได้ (มีผู้เช่าอาศัยอยู่)

---

## 👤 Tenants

### GET `/api/tenants` 🔑 Admin
ดูรายการผู้เช่าทั้งหมด

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "first_name": "สมชาย",
      "last_name": "ใจดี",
      "national_id": "1100100100101",
      "phone": "081-111-1111",
      "email": "somchai@email.com",
      "room_id": 1,
      "room_number": "101",
      "floor": 1,
      "move_in_date": "2025-01-15",
      "is_active": true
    }
  ]
}
```

---

### GET `/api/tenants/me` 🏠 Tenant
ดูข้อมูลตัวเอง (สำหรับ Tenant)

**Response 200:** ข้อมูลผู้เช่า + ข้อมูลห้อง

---

### GET `/api/tenants/:id` 🔑 Admin
ดูข้อมูลผู้เช่ารายคน

---

### POST `/api/tenants` 🔑 Admin
เพิ่มผู้เช่าใหม่

**Request Body:**
```json
{
  "first_name": "สมชาย",
  "last_name": "ใจดี",
  "national_id": "1100100100199",
  "phone": "081-999-9999",
  "email": "user@email.com",
  "emergency_contact": "สมหมาย ใจดี",
  "emergency_phone": "081-999-9900",
  "room_id": 3,
  "move_in_date": "2026-05-01",
  "create_user": true,
  "username": "newuser",
  "password": "password123"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `first_name`, `last_name` | ✅ | ชื่อ-นามสกุล |
| `national_id` | ✅ | เลขบัตรประชาชน 13 หลัก (unique) |
| `phone` | ✅ | เบอร์โทร |
| `room_id` | ✅ | ID ห้องที่เข้าพัก |
| `move_in_date` | ✅ | วันที่เข้าพัก (YYYY-MM-DD) |
| `create_user` | ❌ | `true` = สร้างบัญชี login ให้ด้วย |
| `username` | ✅ (ถ้า create_user=true) | ชื่อผู้ใช้ |
| `password` | ✅ (ถ้า create_user=true) | รหัสผ่าน |

**Response 201:** เพิ่มสำเร็จ  
**Response 400:** ห้องถูกใช้แล้ว หรือข้อมูลไม่ครบ  
**Response 409:** เลขบัตร / email / username ซ้ำ

---

### PUT `/api/tenants/:id` 🔑 Admin
แก้ไขข้อมูลผู้เช่า

**Request Body:** (ส่งเฉพาะ field ที่ต้องการเปลี่ยน)
```json
{
  "phone": "082-000-0000",
  "email": "newemail@email.com",
  "is_active": false,
  "move_out_date": "2026-06-30"
}
```

> ⚠️ การตั้ง `is_active: false` จะทำให้ห้องกลับมาเป็น `available` โดยอัตโนมัติ

---

### DELETE `/api/tenants/:id` 🔑 Admin
ลบผู้เช่า และ user account ที่เชื่อมอยู่

**Response 200:** ลบสำเร็จ

---

## 💰 Bills

### GET `/api/bills` ✅
ดูรายการบิล (Admin = ทั้งหมด, Tenant = ของตัวเอง)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `month` | integer | เดือน (1-12) |
| `year` | integer | ปี (เช่น 2026) |
| `status` | string | `pending`, `paid`, `overdue` |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tenant_id": 1,
      "first_name": "สมชาย",
      "last_name": "ใจดี",
      "room_number": "101",
      "bill_month": 5,
      "bill_year": 2026,
      "monthly_rent": 3500,
      "water_units": 10,
      "water_amount": 180,
      "electricity_units": 150,
      "electricity_amount": 1200,
      "other_fees": 0,
      "total_amount": 4880,
      "due_date": "2026-05-15",
      "paid_date": null,
      "status": "pending"
    }
  ]
}
```

---

### POST `/api/bills` 🔑 Admin
สร้างบิลใหม่ (ระบบคำนวณยอดรวมให้อัตโนมัติ)

**Request Body:**
```json
{
  "tenant_id": 1,
  "room_id": 1,
  "bill_month": 5,
  "bill_year": 2026,
  "water_units": 10,
  "electricity_units": 150,
  "other_fees": 0,
  "notes": "บิลเดือนพฤษภาคม"
}
```

> 💡 ค่าน้ำ/ไฟ คำนวณจาก `units × rate` ที่ตั้งไว้ในห้องอัตโนมัติ

**Response 201:** สร้างสำเร็จ  
**Response 409:** บิลเดือนนี้มีอยู่แล้ว

---

### PUT `/api/bills/:id/status` 🔑 Admin
อัปเดตสถานะการชำระเงิน

**Request Body:**
```json
{
  "status": "paid",
  "paid_date": "2026-05-10"
}
```

| Status | ความหมาย |
|--------|---------|
| `pending` | รอชำระ |
| `paid` | ชำระแล้ว |
| `overdue` | เกินกำหนด |

**Response 200:** อัปเดตสำเร็จ

---

### DELETE `/api/bills/:id` 🔑 Admin
ลบบิล

**Response 200:** ลบสำเร็จ

---

## 🔧 Maintenance

### GET `/api/maintenance` ✅
ดูรายการแจ้งซ่อม (Admin = ทั้งหมด, Tenant = ของตัวเอง)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | `pending`, `in_progress`, `resolved` |
| `priority` | string | `low`, `medium`, `high`, `urgent` |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tenant_id": 1,
      "first_name": "สมชาย",
      "last_name": "ใจดี",
      "room_number": "101",
      "title": "ก๊อกน้ำรั่ว",
      "description": "ก๊อกน้ำในห้องน้ำรั่ว น้ำหยดตลอดเวลา",
      "priority": "high",
      "status": "in_progress",
      "admin_notes": "ส่งช่างไปดูแล้ว",
      "resolved_at": null,
      "created_at": "2026-05-01T10:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/maintenance` 🏠 Tenant
ส่งคำร้องแจ้งซ่อมใหม่

**Request Body:**
```json
{
  "title": "ก๊อกน้ำรั่ว",
  "description": "ก๊อกน้ำในห้องน้ำรั่ว น้ำหยดตลอดเวลา ต้องการช่างมาซ่อม",
  "priority": "high"
}
```

| Priority | ความหมาย |
|----------|---------|
| `low` | ต่ำ |
| `medium` | ปานกลาง (default) |
| `high` | สูง |
| `urgent` | เร่งด่วน |

**Response 201:** ส่งคำร้องสำเร็จ

---

### PUT `/api/maintenance/:id/status` 🔑 Admin
อัปเดตสถานะการแจ้งซ่อม

**Request Body:**
```json
{
  "status": "in_progress",
  "admin_notes": "ส่งช่างไปดูแล้ว นัดวันซ่อม 18 พ.ค."
}
```

| Status | ความหมาย |
|--------|---------|
| `pending` | รอดำเนินการ |
| `in_progress` | กำลังดำเนินการ |
| `resolved` | แก้ไขแล้ว (บันทึกเวลาแก้ไขอัตโนมัติ) |

**Response 200:** อัปเดตสำเร็จ

---

### DELETE `/api/maintenance/:id` 🔑 Admin
ลบคำร้องแจ้งซ่อม

**Response 200:** ลบสำเร็จ

---

## 📊 Dashboard

### GET `/api/dashboard` 🔑 Admin
ดูข้อมูลสรุปภาพรวม

**Response 200:**
```json
{
  "success": true,
  "data": {
    "rooms": {
      "total": 12,
      "available": 8,
      "occupied": 3,
      "maintenance": 1
    },
    "tenants": {
      "total": 3,
      "active": 3
    },
    "bills": {
      "pending": 3,
      "overdue": 1,
      "paid_this_month": 2,
      "revenue_this_month": 14880
    },
    "maintenance": {
      "pending": 2,
      "in_progress": 1,
      "resolved": 1
    }
  }
}
```

---

## ❤️ Health

### GET `/api/health` ❌
ตรวจสอบสถานะ API

**Response 200:**
```json
{
  "status": "OK",
  "message": "Dormitory Management System API is running",
  "timestamp": "2026-05-16T12:00:00.000Z"
}
```

---

## ⚠️ Error Responses

รูปแบบ Error Response มาตรฐาน:

```json
{
  "success": false,
  "message": "คำอธิบาย error"
}
```

| HTTP Status | ความหมาย |
|-------------|---------|
| `400` | ข้อมูลไม่ถูกต้อง / ไม่ครบ |
| `401` | ไม่ได้ Login หรือ Token หมดอายุ |
| `403` | ไม่มีสิทธิ์เข้าถึง (เช่น Tenant เข้า Admin route) |
| `404` | ไม่พบข้อมูล |
| `409` | ข้อมูลซ้ำ (Duplicate) |
| `500` | Server Error |

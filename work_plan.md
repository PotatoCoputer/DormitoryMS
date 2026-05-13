# 📅 แผนงาน Dormitory Management System

**กำหนดส่งจริง:** วันอาทิตย์ที่ 17 พ.ค. 2569 เวลา 18:00 น.  
**เป้าหมาย:** เสร็จวันเสาร์ที่ 16 พ.ค. 2569 (ก่อนกำหนด 1 วัน)

> [!NOTE]
> วันที่ 13 พ.ค. = พุธ / 14 = พฤหัส / 15 = ศุกร์ / 16 = เสาร์ / 17 = อาทิตย์ (deadline)

---

## ✅ วันพุธที่ 13 พ.ค. — DONE แล้ว

> เสร็จทั้งหมดแล้ววันนี้

- [x] สร้างโครงสร้าง Project (client + server)
- [x] เขียน Frontend ทุกหน้า (Login, Dashboard, Rooms, Tenants, Bills, Maintenance)
- [x] เขียน Backend API ทุก Endpoint (Auth, Rooms, Tenants, Bills, Maintenance, Dashboard)
- [x] เขียน Database Schema + Seed Data (SQL)
- [x] สร้าง README.md + DATABASE_SCHEMA.md + .gitignore

---

## 📌 วันพฤหัสที่ 14 พ.ค. — ติดตั้ง DB + ทดสอบ Backend

**เป้าหมาย:** Backend ทำงานได้จริงกับ PostgreSQL

### ช่วงเช้า
- [ ] ติดตั้ง PostgreSQL (ถ้ายังไม่มี)
- [ ] สร้าง database `dormitory_ms`
- [ ] แก้ `server/.env` ใส่ password จริง
- [ ] รัน `schema.sql` → import ตาราง + seed data

### ช่วงบ่าย
- [ ] รัน `npm run dev` ใน server
- [ ] ทดสอบ API ทุก endpoint ด้วย **Postman** หรือ Thunder Client:
  - `POST /api/auth/login` → ได้ token
  - `GET /api/rooms` → ดึงห้องพัก
  - `GET /api/tenants` → ดึงผู้เช่า
  - `GET /api/bills` → ดึงบิล
  - `GET /api/dashboard` → สถิติ Dashboard
- [ ] แก้ไข bug ที่พบ (ถ้ามี)

---

## 📌 วันศุกร์ที่ 15 พ.ค. — ทดสอบ Frontend + ขัดเกลา UI

**เป้าหมาย:** ระบบทั้งหมด end-to-end ทำงานได้

### ช่วงเช้า
- [ ] รัน `npm run dev` ใน client
- [ ] ทดสอบ Login ด้วย Admin และ Tenant
- [ ] ทดสอบ Admin flow ทั้งหมด:
  - เพิ่ม/แก้ไข/ลบห้องพัก
  - เพิ่มผู้เช่า + ผูกกับห้อง
  - สร้างบิล + เปลี่ยนสถานะ
  - ดูและอัพเดตการแจ้งซ่อม
  - ดู Dashboard

### ช่วงบ่าย
- [ ] ทดสอบ Tenant flow:
  - ดูบิลของตัวเอง
  - แจ้งซ่อม
  - ดูข้อมูลห้อง
- [ ] แก้ไข UI bugs / ปรับ UX
- [ ] **ถ่าย Screenshots** ทุกหน้าสำหรับ Demo

> [!TIP]
> ถ่าย screenshot ของ: Login, Dashboard, Rooms Grid, Add Room Modal, Tenants Table, Create Bill + Preview, Maintenance List

---

## 📌 วันเสาร์ที่ 16 พ.ค. — Documentation + GitHub + Submit ✅

**เป้าหมาย:** ส่งงานครบทุกอย่าง

### ช่วงเช้า — API Documentation
- [ ] สร้าง **Postman Collection** ครอบคลุมทุก API:
  - Export เป็นไฟล์ `.json`
  - หรือ publish Postman collection link
- [ ] ตรวจสอบ `DATABASE_SCHEMA.md` ว่าครบ (ER Diagram + Tables)
- [ ] ตรวจสอบ `README.md` ว่าอธิบายวิธีติดตั้งชัดเจน

### ช่วงบ่าย — GitHub + Submit
- [ ] `git init` → สร้าง repo บน GitHub
- [ ] push code ทั้งหมด (ระวัง: ไม่ push ไฟล์ `.env`)
- [ ] ตรวจสอบ checklist สุดท้าย:

---

## 🎯 Checklist ก่อนส่งงาน

### Requirements หลัก (ต้องครบ)
- [ ] Authentication (Login/Logout + Admin/Tenant)
- [ ] ระบบห้องพัก (CRUD + 3 สถานะ)
- [ ] ระบบผู้เช่า (เพิ่ม/ผูกห้อง/วันเข้าพัก)
- [ ] ระบบออกบิล (สร้างบิล + คำนวณค่าน้ำ/ไฟ + สถานะ)
- [ ] ระบบแจ้งซ่อม (ผู้เช่าแจ้ง + Admin เปลี่ยนสถานะ)
- [ ] Dashboard (ภาพรวมครบ)

### สิ่งที่ต้องส่ง (ต้องครบ)
- [ ] Source Code บน GitHub/GitLab
- [ ] README อธิบายวิธีติดตั้ง
- [ ] Database Schema / ER Diagram
- [ ] API Documentation (Postman)
- [ ] Demo (Screenshots ทุกหน้า)

### Bonus (ทำได้ = คะแนนเพิ่ม)
- [x] Responsive Design *(CSS ทำไว้แล้ว)*
- [x] Dark Mode *(ทำไว้แล้วทั้งระบบ)*
- [ ] Docker *(optional — ถ้ามีเวลา)*

---

## ⏱ สรุปไทม์ไลน์

| วัน | สิ่งที่ทำ | เป้าหมาย |
|-----|----------|---------|
| อ. 13 (วันนี้) | Setup + เขียนโค้ดทั้งหมด | ✅ เสร็จแล้ว |
| พ. 14 | ติดตั้ง DB + ทดสอบ Backend | Backend ทำงาน 100% |
| พฤ. 15 | ทดสอบ Frontend + แก้ Bug | ระบบ end-to-end สมบูรณ์ |
| ศ. 16 | Docs + GitHub + Submit | **ส่งงานก่อนกำหนด 1 วัน** ✅ |
| ส. 17 | *กำหนดส่งจริง (Buffer)* | พักผ่อน 🎉 |

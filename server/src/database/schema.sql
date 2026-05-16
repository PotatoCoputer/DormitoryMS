-- ================================================================
-- Dormitory Management System - Database Schema
-- PostgreSQL
-- ================================================================

-- Drop tables if exist (for re-seeding)
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ================================================================
-- USERS TABLE
-- ================================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(10) NOT NULL DEFAULT 'tenant' CHECK (role IN ('admin', 'tenant')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- ROOMS TABLE
-- ================================================================
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(20) UNIQUE NOT NULL,
  floor INTEGER NOT NULL,
  room_type VARCHAR(50) NOT NULL DEFAULT 'standard',
  monthly_rent DECIMAL(10,2) NOT NULL,
  water_rate DECIMAL(10,2) NOT NULL DEFAULT 18.00,
  electricity_rate DECIMAL(10,2) NOT NULL DEFAULT 8.00,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TENANTS TABLE
-- ================================================================
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  national_id VARCHAR(13) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  move_in_date DATE NOT NULL,
  move_out_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- BILLS TABLE
-- ================================================================
CREATE TABLE bills (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  bill_month INTEGER NOT NULL CHECK (bill_month BETWEEN 1 AND 12),
  bill_year INTEGER NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  water_units DECIMAL(10,2) NOT NULL DEFAULT 0,
  water_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  electricity_units DECIMAL(10,2) NOT NULL DEFAULT 0,
  electricity_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  other_fees DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- MAINTENANCE REQUESTS TABLE
-- ================================================================
CREATE TABLE maintenance_requests (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  admin_notes TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_tenants_room_id ON tenants(room_id);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
CREATE INDEX idx_bills_tenant_id ON bills(tenant_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_month_year ON bills(bill_month, bill_year);
CREATE INDEX idx_maintenance_tenant_id ON maintenance_requests(tenant_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);

-- ================================================================
-- SEED DATA
-- ================================================================

-- Admin user (password: admin123)
INSERT INTO users (username, password_hash, full_name, email, phone, role) VALUES
('admin', '$2b$10$6QwX1PP8L9OexBGYosBB.ekpIWCX2J30yfPDfTo2l08R1JBfVsHAu', 'ผู้ดูแลระบบ', 'admin@dormitory.com', '081-000-0001', 'admin');

-- Tenant users (password: tenant123)
INSERT INTO users (username, password_hash, full_name, email, phone, role) VALUES
('tenant1', '$2b$10$Ot36iq3zhZxQc/neJ1TqNONgr0FTpQDLm.nIKUKjwux8DVUAjSo46', 'สมชาย ใจดี', 'somchai@email.com', '081-111-1111', 'tenant'),
('tenant2', '$2b$10$Ot36iq3zhZxQc/neJ1TqNONgr0FTpQDLm.nIKUKjwux8DVUAjSo46', 'สมหญิง รักเรียน', 'somying@email.com', '082-222-2222', 'tenant'),
('tenant3', '$2b$10$Ot36iq3zhZxQc/neJ1TqNONgr0FTpQDLm.nIKUKjwux8DVUAjSo46', 'วิชัย สุขสันต์', 'wichai@email.com', '083-333-3333', 'tenant');

-- Rooms
INSERT INTO rooms (room_number, floor, room_type, monthly_rent, water_rate, electricity_rate, status, description) VALUES
('101', 1, 'standard', 3500, 18, 8, 'occupied', 'ห้องมาตรฐาน ชั้น 1 ทิศตะวันออก'),
('102', 1, 'standard', 3500, 18, 8, 'occupied', 'ห้องมาตรฐาน ชั้น 1 ทิศตะวันตก'),
('103', 1, 'deluxe', 4500, 18, 8, 'available', 'ห้อง Deluxe ชั้น 1 ห้องใหญ่'),
('104', 1, 'standard', 3500, 18, 8, 'maintenance', 'ปิดซ่อมแซม กำลังทาสีใหม่'),
('201', 2, 'standard', 3800, 18, 8, 'occupied', 'ห้องมาตรฐาน ชั้น 2 วิวสวย'),
('202', 2, 'deluxe', 4800, 18, 8, 'available', 'ห้อง Deluxe ชั้น 2 ห้องใหญ่พิเศษ'),
('203', 2, 'standard', 3800, 18, 8, 'available', 'ห้องมาตรฐาน ชั้น 2'),
('204', 2, 'suite', 6500, 18, 8, 'available', 'ห้อง Suite ชั้น 2 พร้อมครัว'),
('301', 3, 'standard', 4000, 18, 8, 'available', 'ห้องมาตรฐาน ชั้น 3'),
('302', 3, 'deluxe', 5000, 18, 8, 'available', 'ห้อง Deluxe ชั้น 3 วิวดีมาก'),
('303', 3, 'suite', 7000, 18, 8, 'available', 'ห้อง Suite ชั้น 3 ห้องพักระดับพรีเมียม'),
('304', 3, 'standard', 4000, 18, 8, 'available', 'ห้องมาตรฐาน ชั้น 3 ทิศเหนือ');

-- Tenants
INSERT INTO tenants (user_id, room_id, first_name, last_name, national_id, phone, email, emergency_contact, emergency_phone, move_in_date, is_active) VALUES
(2, 1, 'สมชาย', 'ใจดี', '1100100100101', '081-111-1111', 'somchai@email.com', 'สมหมาย ใจดี', '081-111-1100', '2025-01-15', TRUE),
(3, 2, 'สมหญิง', 'รักเรียน', '1100100100102', '082-222-2222', 'somying@email.com', 'สุภาพ รักเรียน', '082-222-2200', '2025-03-01', TRUE),
(4, 5, 'วิชัย', 'สุขสันต์', '1100100100103', '083-333-3333', 'wichai@email.com', 'วิมล สุขสันต์', '083-333-3300', '2025-06-01', TRUE);

-- Bills
INSERT INTO bills (tenant_id, room_id, bill_month, bill_year, monthly_rent, water_units, water_amount, electricity_units, electricity_amount, other_fees, total_amount, due_date, status) VALUES
(1, 1, 4, 2026, 3500, 10, 180, 150, 1200, 0, 4880, '2026-04-15', 'paid'),
(1, 1, 5, 2026, 3500, 12, 216, 160, 1280, 0, 4996, '2026-05-15', 'pending'),
(2, 2, 4, 2026, 3500, 8, 144, 120, 960, 0, 4604, '2026-04-15', 'overdue'),
(2, 2, 5, 2026, 3500, 9, 162, 130, 1040, 0, 4702, '2026-05-15', 'pending'),
(3, 5, 4, 2026, 3800, 11, 198, 140, 1120, 0, 5118, '2026-04-15', 'paid'),
(3, 5, 5, 2026, 3800, 13, 234, 155, 1240, 0, 5274, '2026-05-15', 'pending');

-- Maintenance requests
INSERT INTO maintenance_requests (tenant_id, room_id, title, description, priority, status) VALUES
(1, 1, 'ก๊อกน้ำรั่ว', 'ก๊อกน้ำในห้องน้ำรั่ว น้ำหยดตลอดเวลา', 'high', 'in_progress'),
(2, 2, 'แอร์ไม่เย็น', 'เครื่องปรับอากาศไม่เย็น ต้องการช่างมาตรวจสอบ', 'medium', 'pending'),
(3, 5, 'หลอดไฟเสีย', 'หลอดไฟในห้องนอนเสีย ต้องการเปลี่ยน', 'low', 'resolved'),
(1, 1, 'ประตูล็อคไม่ได้', 'กุญแจประตูหลักชำรุด ล็อคไม่ได้ เร่งด่วนมาก', 'urgent', 'pending');

-- Update room status trigger function
CREATE OR REPLACE FUNCTION update_room_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = TRUE THEN
    UPDATE rooms SET status = 'occupied', updated_at = NOW() WHERE id = NEW.room_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
    UPDATE rooms SET status = 'available', updated_at = NOW() WHERE id = OLD.room_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_room_status_trigger
AFTER INSERT OR UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_room_status();

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const tenantHash = await bcrypt.hash('tenant123', 10);
  
  await pool.query("UPDATE users SET password_hash=$1 WHERE username='admin'", [adminHash]);
  await pool.query("UPDATE users SET password_hash=$1 WHERE role='tenant'", [tenantHash]);
  
  console.log('Passwords updated!');
  
  const res = await pool.query("SELECT username, password_hash FROM users");
  for (const u of res.rows) {
    const pw = u.username === 'admin' ? 'admin123' : 'tenant123';
    const ok = await bcrypt.compare(pw, u.password_hash);
    console.log(u.username + ': ' + (ok ? '✅ OK' : '❌ FAIL'));
  }
  pool.end();
}
fix().catch(console.error);

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error('กรุณากรอกข้อมูลให้ครบ');
    setLoading(true);
    try {
      const data = await login(form.username, form.password);
      toast.success(`ยินดีต้อนรับ ${data.user.full_name}`);
      navigate(data.user.role === 'admin' ? '/dashboard' : '/my-bills');
    } catch (err) {
      toast.error(err.response?.data?.message || 'เข้าสู่ระบบล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ username: 'admin', password: 'admin123' });
    else setForm({ username: 'tenant1', password: 'tenant123' });
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">🏠</div>
          <div>
            <h1>DormMS</h1>
            <p>ระบบบริหารงานหอพัก</p>
          </div>
        </div>

        <div className="login-demo">
          <p>🔑 Demo Accounts</p>
          <span>
            <button onClick={() => fillDemo('admin')} style={{background:'none',border:'none',color:'#a5b4fc',cursor:'pointer',fontSize:'13px',padding:0}}>
              👤 Admin: admin / admin123
            </button><br/>
            <button onClick={() => fillDemo('tenant')} style={{background:'none',border:'none',color:'#67e8f9',cursor:'pointer',fontSize:'13px',padding:0}}>
              🏠 Tenant: tenant1 / tenant123
            </button>
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{marginBottom:16}}>
            <label className="form-label">ชื่อผู้ใช้ <span className="form-required">*</span></label>
            <input
              className="form-input"
              placeholder="กรอกชื่อผู้ใช้"
              value={form.username}
              onChange={e => setForm(p => ({...p, username: e.target.value}))}
            />
          </div>
          <div className="form-group" style={{marginBottom:24}}>
            <label className="form-label">รหัสผ่าน <span className="form-required">*</span></label>
            <input
              type="password"
              className="form-input"
              placeholder="กรอกรหัสผ่าน"
              value={form.password}
              onChange={e => setForm(p => ({...p, password: e.target.value}))}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} disabled={loading}>
            {loading ? <><span className="loading-spin" /> กำลังเข้าสู่ระบบ...</> : '🔑 เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
}

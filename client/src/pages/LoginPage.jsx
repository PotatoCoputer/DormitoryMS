import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Building2, BarChart3, Wrench, Eye, EyeOff, ArrowRight, Sun, Moon, FileText, CheckCircle } from 'lucide-react';

const features = [
  { icon: FileText, title: 'ออกบิลอัตโนมัติ', desc: 'คำนวณค่าเช่า น้ำ ไฟ และสร้างใบแจ้งหนี้รายเดือนได้ในคลิกเดียว' },
  { icon: BarChart3, title: 'Dashboard ภาพรวม', desc: 'ดูรายได้ ห้องว่าง และบิลค้างชำระได้แบบ real-time' },
  { icon: Wrench, title: 'ระบบแจ้งซ่อม', desc: 'ผู้เช่าแจ้งปัญหา Admin รับทราบและอัพเดตสถานะได้ทันที' },
];

const stats = [
  { value: '12', label: 'ห้องพัก' },
  { value: '3', label: 'ประเภทห้อง' },
  { value: '99.9%', label: 'Uptime' },
];

const demoAccounts = [
  { role: 'Admin', username: 'admin', password: 'admin123', color: '#7c3aed' },
  { role: 'Tenant', username: 'tenant1', password: 'tenant123', color: '#3b82f6' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [isDark, setIsDark] = useState(() => (localStorage.getItem('theme') || 'dark') === 'dark');
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error('กรุณากรอกข้อมูลให้ครบ');
    setLoading(true);
    try {
      const result = await login(form.username, form.password);
      toast.success(`ยินดีต้อนรับ ${result.user.full_name}`);
      navigate(result.user.role === 'admin' ? '/dashboard' : '/my-bills');
    } catch (err) {
      toast.error(err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (username, password) => setForm({ username, password });

  return (
    <div className="login-page">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'เปลี่ยนเป็น Light Mode' : 'เปลี่ยนเป็น Dark Mode'}
        style={{ position:'fixed', top:16, right:16, zIndex:999, width:36, height:36, borderRadius:8, border:'1px solid var(--border-2)', background:'var(--bg-3)', color:'var(--txt-2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}
      >
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Left panel */}
      <div className="login-left" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Decorative orbs */}
        <div style={{ position:'absolute', top:-80, left:-80, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,.18) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,.12) 0%, transparent 70%)', pointerEvents:'none' }} />

        <div style={{ maxWidth: 420, width: '100%', position: 'relative', zIndex: 1 }}>
          {/* Brand */}
          <div className="login-brand" style={{ marginBottom: 32 }}>
            <div style={{ width:40, height:40, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(124,58,237,.35)' }}>
              <Building2 size={20} color="white" />
            </div>
            <span className="login-brand-name" style={{ fontSize:18, fontWeight:700 }}>DormMS</span>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:'-1px', lineHeight:1.15, marginBottom:12 }}>
              บริหารหอพัก <span style={{ background:'linear-gradient(135deg,#a78bfa,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>ครบวงจร</span>
            </h1>
            <p style={{ fontSize:14, color:'var(--txt-2)', lineHeight:1.75, maxWidth:320 }}>
              ระบบครบวงจรสำหรับผู้ดูแลหอพัก จัดการห้อง ผู้เช่า และการเงินได้ในที่เดียว
            </p>
          </div>

          {/* Features */}
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'var(--bg-3)', border:'1px solid var(--border-2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={14} color="var(--violet-light)" />
                </div>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:600, marginBottom:2 }}>{title}</div>
                  <div style={{ fontSize:12.5, color:'var(--txt-3)', lineHeight:1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Right panel - form */}
      <div className="login-right">
        <div className="login-card">
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 4 }}>เข้าสู่ระบบ</h1>
          <p className="subtitle">ยินดีต้อนรับกลับมา</p>

          {/* Demo accounts */}
          <div className="demo-box">
            <div className="demo-box-title">ทดสอบด้วยบัญชีตัวอย่าง</div>
            {demoAccounts.map(acc => (
              <div
                key={acc.username}
                className="demo-item"
                onClick={() => fillDemo(acc.username, acc.password)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: acc.color }} />
                  <span className="demo-item-label">{acc.role}</span>
                </div>
                <span className="demo-item-creds">{acc.username} / {acc.password}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">ชื่อผู้ใช้</label>
              <input
                className="form-input"
                placeholder="กรอกชื่อผู้ใช้"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">รหัสผ่าน</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="กรอกรหัสผ่าน"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ paddingRight: 40 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)', display: 'flex', alignItems: 'center' }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}
              disabled={loading}
            >
              {loading ? <span className="spin" /> : <>เข้าสู่ระบบ <ArrowRight size={14} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

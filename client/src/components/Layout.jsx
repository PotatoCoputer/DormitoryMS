import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, BedDouble, Users, FileText,
  Wrench, CreditCard, Home, LogOut, Building2,
  ChevronRight, Sun, Moon
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'ห้องพัก', icon: BedDouble, path: '/rooms' },
  { label: 'ผู้เช่า', icon: Users, path: '/tenants' },
  { label: 'ใบแจ้งหนี้', icon: FileText, path: '/bills' },
  { label: 'แจ้งซ่อม', icon: Wrench, path: '/maintenance' },
];

const tenantNav = [
  { label: 'บิลของฉัน', icon: CreditCard, path: '/my-bills' },
  { label: 'แจ้งซ่อม', icon: Wrench, path: '/my-maintenance' },
  { label: 'ข้อมูลห้อง', icon: Home, path: '/my-room' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Theme toggle
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(p => !p);

  const nav = user?.role === 'admin' ? adminNav : tenantNav;
  const pageTitle = nav.find(n => n.path === location.pathname)?.label || 'Dashboard';
  const initial = user?.full_name?.charAt(0)?.toUpperCase() || '?';

  const handleLogout = () => {
    logout();
    toast.success('ออกจากระบบแล้ว');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Building2 size={16} color="white" />
          </div>
          <div>
            <h2>DormMS</h2>
            <span>ระบบบริหารหอพัก</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">
            {user?.role === 'admin' ? 'จัดการระบบ' : 'เมนูผู้เช่า'}
          </div>
          {nav.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`nav-link ${active ? 'active' : ''}`}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              >
                <Icon className="nav-icon" size={15} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-block">
            <div className="user-avatar">{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name}
              </div>
              <div className="user-role">
                {user?.role === 'admin' ? 'Administrator' : 'ผู้เช่า'}
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={13} />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <h2 className="page-title">{pageTitle}</h2>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'เปลี่ยนเป็น Light Mode' : 'เปลี่ยนเป็น Dark Mode'}
              style={{
                width: 36, height: 36,
                borderRadius: 8,
                border: '1px solid var(--border-2)',
                background: 'var(--bg-3)',
                color: 'var(--txt-2)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--txt)'; e.currentTarget.style.background = 'var(--bg-4)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--txt-2)'; e.currentTarget.style.background = 'var(--bg-3)'; }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div className="header-date">
              {new Date().toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' })}
            </div>
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

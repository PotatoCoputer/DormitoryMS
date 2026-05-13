import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const adminNav = [
  { label: 'Dashboard', icon: '📊', path: '/dashboard' },
  { label: 'จัดการห้องพัก', icon: '🏠', path: '/rooms' },
  { label: 'ผู้เช่า', icon: '👥', path: '/tenants' },
  { label: 'ออกบิล', icon: '📄', path: '/bills' },
  { label: 'แจ้งซ่อม', icon: '🔧', path: '/maintenance' },
];

const tenantNav = [
  { label: 'บิลของฉัน', icon: '📄', path: '/my-bills' },
  { label: 'แจ้งซ่อม', icon: '🔧', path: '/my-maintenance' },
  { label: 'ข้อมูลห้อง', icon: '🏠', path: '/my-room' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = user?.role === 'admin' ? adminNav : tenantNav;

  const handleLogout = () => {
    logout();
    toast.success('ออกจากระบบแล้ว');
    navigate('/login');
  };

  const initial = user?.full_name?.charAt(0)?.toUpperCase() || '?';

  const pageTitle = nav.find(n => n.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="app-layout">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🏠</div>
          <div>
            <h2>DormMS</h2>
            <span>ระบบบริหารหอพัก</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">เมนูหลัก</div>
          {nav.map(item => (
            <button
              key={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initial}</div>
            <div className="user-info-text">
              <div className="name">{user?.full_name}</div>
              <div className="role">
                <span className={`badge badge-${user?.role}`}>{user?.role === 'admin' ? 'Admin' : 'ผู้เช่า'}</span>
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 ออกจากระบบ
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 22, display: 'none' }}
            className="menu-btn"
          >
            ☰
          </button>
          <h2 className="page-title">{pageTitle}</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

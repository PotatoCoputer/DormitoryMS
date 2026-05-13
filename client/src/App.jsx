import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RoomsPage from './pages/RoomsPage';
import TenantsPage from './pages/TenantsPage';
import BillsPage from './pages/BillsPage';
import MaintenancePage from './pages/MaintenancePage';
import MyBillsPage from './pages/MyBillsPage';
import MyRoomPage from './pages/MyRoomPage';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><span className="loading-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/my-bills" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><span className="loading-spin" /></div>;
  if (user) return <Navigate to={user.role === 'admin' ? '/dashboard' : '/my-bills'} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute adminOnly><DashboardPage /></PrivateRoute>} />
      <Route path="/rooms" element={<PrivateRoute adminOnly><RoomsPage /></PrivateRoute>} />
      <Route path="/tenants" element={<PrivateRoute adminOnly><TenantsPage /></PrivateRoute>} />
      <Route path="/bills" element={<PrivateRoute adminOnly><BillsPage /></PrivateRoute>} />
      <Route path="/maintenance" element={<PrivateRoute adminOnly><MaintenancePage /></PrivateRoute>} />
      <Route path="/my-bills" element={<PrivateRoute><MyBillsPage /></PrivateRoute>} />
      <Route path="/my-maintenance" element={<PrivateRoute><MaintenancePage /></PrivateRoute>} />
      <Route path="/my-room" element={<PrivateRoute><MyRoomPage /></PrivateRoute>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
            success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

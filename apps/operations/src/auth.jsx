import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { api, tokenStore } from './api.js';
import { OpsSidebar } from './components/OpsSidebar.jsx';
import { OpsHeader } from './components/OpsHeader.jsx';
import { ToastProvider } from './components/OpsToast.jsx';
import './ops.css';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function decodeRoles() {
  try {
    const payload = JSON.parse(atob(tokenStore.get().split('.')[1]));
    return payload.roles ?? [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }) {
  const [roles, setRoles] = useState(() => (tokenStore.get() ? decodeRoles() : null));
  const navigate = useNavigate();

  const login = async (email, password) => {
    const data = await api.login(email, password);
    tokenStore.set(data.accessToken);
    tokenStore.setRefresh(data.refreshToken);
    setRoles(data.user.roles);
  };

  const logout = async () => {
    await api.logout();
    setRoles(null);
    navigate('/login');
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setRoles(null);
      navigate('/login');
    };
    window.addEventListener('ay-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('ay-unauthorized', handleUnauthorized);
  }, [navigate]);

  return (
    <AuthCtx.Provider value={{ roles, login, logout }}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthCtx.Provider>
  );
}

export function ProtectedRoute() {
  const { roles } = useAuth();
  if (!roles) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function OpsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="ops-app-shell">
      <OpsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="ops-main-wrapper">
        <OpsHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="ops-content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

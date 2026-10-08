import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { api, tokenStore } from './api.js';

const AuthCtx = createContext(null);
export const useCustomerAuth = () => useContext(AuthCtx);

function readUser() {
  try {
    if (tokenStore.isRememberExpired && tokenStore.isRememberExpired()) {
      tokenStore.clear();
      return null;
    }
    const raw = sessionStorage.getItem('ay-user') || (tokenStore.isRemembered() ? localStorage.getItem('ay-user') : null);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const navigate = useNavigate();

  const persist = (data, rememberMe = true) => {
    tokenStore.set(data.accessToken, rememberMe);
    tokenStore.setRefresh(data.refreshToken, rememberMe);
    try {
      sessionStorage.setItem('ay-user', JSON.stringify(data.user));
      if (rememberMe) {
        localStorage.setItem('ay-user', JSON.stringify(data.user));
      } else {
        localStorage.removeItem('ay-user');
      }
    } catch { /* private mode */ }
    setUser(data.user);
  };

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh();
    tokenStore.clear();
    try {
      sessionStorage.removeItem('ay-user');
      localStorage.removeItem('ay-user');
    } catch { /* private mode */ }
    setUser(null);
    if (refresh) await api.logout(refresh).catch(() => {});
    navigate('/login');
  }, [navigate]);

  // Sync fresh profile state from server on mount
  useEffect(() => {
    let active = true;
    const access = tokenStore.get();
    const refresh = tokenStore.getRefresh();
    if (access || refresh) {
      api.me().then((me) => {
        if (!active || !me) return;
        setUser(me);
        try {
          sessionStorage.setItem('ay-user', JSON.stringify(me));
          if (tokenStore.isRemembered()) {
            localStorage.setItem('ay-user', JSON.stringify(me));
          }
        } catch {}
      }).catch(() => {});
    }
    return () => { active = false; };
  }, []);

  // Silent refresh on mount when a refresh token exists but access token is missing.
  const ensureSession = useCallback(async () => {
    const refresh = tokenStore.getRefresh();
    if (!refresh) {
      if (!tokenStore.get()) {
        try {
          sessionStorage.removeItem('ay-user');
          localStorage.removeItem('ay-user');
        } catch {}
        setUser(null);
      }
      return false;
    }
    try {
      const data = await api.refresh(refresh);
      tokenStore.set(data.accessToken);
      tokenStore.setRefresh(data.refreshToken);
      const me = await api.me().catch(() => null);
      if (me) {
        try {
          sessionStorage.setItem('ay-user', JSON.stringify(me));
          if (tokenStore.isRemembered()) {
            localStorage.setItem('ay-user', JSON.stringify(me));
          }
        } catch {}
        setUser(me);
      }
      return true;
    } catch {
      tokenStore.clear();
      try {
        sessionStorage.removeItem('ay-user');
        localStorage.removeItem('ay-user');
      } catch {}
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      tokenStore.clear();
      try {
        sessionStorage.removeItem('ay-user');
        localStorage.removeItem('ay-user');
      } catch {}
      setUser(null);
      const path = window.location.pathname;
      if (path.startsWith('/app') || path === '/request-care') {
        navigate(`/login?session_expired=1&redirect=${encodeURIComponent(path)}`);
      }
    };
    window.addEventListener('ay:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('ay:unauthorized', handleUnauthorized);
  }, [navigate]);

  useEffect(() => {
    const refresh = tokenStore.getRefresh();
    const access = tokenStore.get();
    if (!refresh && !access && user) {
      tokenStore.clear();
      try {
        sessionStorage.removeItem('ay-user');
        localStorage.removeItem('ay-user');
      } catch {}
      setUser(null);
    } else if (!access && refresh) {
      ensureSession();
    }
  }, [ensureSession, user]);

  return (
    <AuthCtx.Provider value={{ user, setUser, persist, logout, ensureSession }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function RequireCustomer() {
  const { user } = useCustomerAuth();
  if (!user && !tokenStore.getRefresh()) return <Navigate to="/login" replace />;
  return <Outlet />;
}

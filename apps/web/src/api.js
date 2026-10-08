function resolveBaseUrl(raw) {
  if (!raw) return '/api/v1';
  const clean = raw.trim().replace(/\/+$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
}

const BASE = resolveBaseUrl(import.meta.env.VITE_API_BASE_URL);

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message ?? 'Request failed');
    err.code = body.code;
    err.requestId = body.requestId;
    err.fieldErrors = body.fieldErrors;
    err.remainingAttempts = body.remainingAttempts;
    throw err;
  }
  return body;
}

const reqCache = new Map();
function cachedGet(path, ttlMs = 25_000) {
  const existing = reqCache.get(path);
  if (existing && Date.now() < existing.expiresAt) {
    return existing.promise;
  }
  const promise = request(path).catch((err) => {
    reqCache.delete(path);
    throw err;
  });
  reqCache.set(path, { promise, expiresAt: Date.now() + ttlMs });
  return promise;
}

function qs(params = {}) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') s.set(k, String(v));
  }
  const str = s.toString();
  return str ? `?${str}` : '';
}

const ACCESS_KEY = 'ay-access';
const REFRESH_KEY = 'ay-refresh';
const REMEMBER_ME_KEY = 'ay-remember-me';
const REMEMBER_UNTIL_KEY = 'ay-remember-until';
const USER_KEY = 'ay-user';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const tokenStore = {
  isRememberExpired: () => {
    try {
      const until = localStorage.getItem(REMEMBER_UNTIL_KEY);
      if (!until) return false;
      const expiry = Number(until);
      if (Number.isFinite(expiry) && Date.now() > expiry) {
        return true;
      }
    } catch {}
    return false;
  },

  isRemembered: () => {
    try {
      if (tokenStore.isRememberExpired()) {
        tokenStore.clear();
        return false;
      }
      return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    } catch {
      return false;
    }
  },

  get: () => {
    try {
      if (tokenStore.isRememberExpired()) {
        tokenStore.clear();
        return null;
      }
      const sess = sessionStorage.getItem(ACCESS_KEY);
      if (sess) return sess;
      if (tokenStore.isRemembered()) {
        return localStorage.getItem(ACCESS_KEY);
      }
      return null;
    } catch {
      return null;
    }
  },

  set: (t, rememberMe) => {
    try {
      if (t) {
        sessionStorage.setItem(ACCESS_KEY, t);
        if (rememberMe === true) {
          localStorage.setItem(ACCESS_KEY, t);
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
          localStorage.setItem(REMEMBER_UNTIL_KEY, String(Date.now() + THIRTY_DAYS_MS));
        } else if (rememberMe === false) {
          localStorage.removeItem(ACCESS_KEY);
          localStorage.removeItem(REMEMBER_ME_KEY);
          localStorage.removeItem(REMEMBER_UNTIL_KEY);
        } else if (tokenStore.isRemembered()) {
          localStorage.setItem(ACCESS_KEY, t);
        }
      } else {
        sessionStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(ACCESS_KEY);
      }
    } catch { /* private mode */ }
  },

  getRefresh: () => {
    try {
      if (tokenStore.isRememberExpired()) {
        tokenStore.clear();
        return null;
      }
      const sess = sessionStorage.getItem(REFRESH_KEY);
      if (sess) return sess;
      if (tokenStore.isRemembered()) {
        return localStorage.getItem(REFRESH_KEY);
      }
      return null;
    } catch {
      return null;
    }
  },

  setRefresh: (t, rememberMe) => {
    try {
      if (t) {
        sessionStorage.setItem(REFRESH_KEY, t);
        if (rememberMe === true) {
          localStorage.setItem(REFRESH_KEY, t);
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
          localStorage.setItem(REMEMBER_UNTIL_KEY, String(Date.now() + THIRTY_DAYS_MS));
        } else if (rememberMe === false) {
          localStorage.removeItem(REFRESH_KEY);
          localStorage.removeItem(REMEMBER_ME_KEY);
          localStorage.removeItem(REMEMBER_UNTIL_KEY);
        } else if (tokenStore.isRemembered()) {
          localStorage.setItem(REFRESH_KEY, t);
        }
      } else {
        sessionStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(REFRESH_KEY);
      }
    } catch { /* private mode */ }
  },

  clear: () => {
    try {
      sessionStorage.removeItem(ACCESS_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(REMEMBER_UNTIL_KEY);
      localStorage.removeItem(USER_KEY);
    } catch { /* private mode */ }
  },
};

let inFlightRefresh = null;

async function refreshTokens() {
  if (!inFlightRefresh) {
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) return null;
    inFlightRefresh = api
      .refresh(refreshToken)
      .then((data) => {
        tokenStore.set(data.accessToken);
        tokenStore.setRefresh(data.refreshToken);
        return data.accessToken;
      })
      .catch((err) => {
        tokenStore.clear();
        throw err;
      })
      .finally(() => {
        inFlightRefresh = null;
      });
  }
  return inFlightRefresh;
}

async function authed(path, options = {}) {
  const doFetch = (token) =>
    fetch(`${BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
      ...options,
    });

  let token = tokenStore.get();
  if (!token && tokenStore.getRefresh()) {
    try {
      token = await refreshTokens();
    } catch {}
  }

  let res = await doFetch(token);

  if (res.status === 401 && tokenStore.getRefresh()) {
    try {
      const nextToken = await refreshTokens();
      if (nextToken) {
        res = await doFetch(nextToken);
      }
    } catch {}
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      tokenStore.clear();
      try {
        sessionStorage.removeItem('ay-user');
        localStorage.removeItem('ay-user');
      } catch {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ay:unauthorized'));
      }
    }
    const err = new Error(body.message ?? 'Request failed');
    err.code = body.code;
    err.status = res.status;
    err.fieldErrors = body.fieldErrors;
    throw err;
  }
  return body;
}

export const api = {
  info: () => request('/').then((b) => b.data),
  health: () => request('/health').then((b) => b.data),
  me: () => authed('/account/me').then((b) => b.data),
  updateMe: (body) => authed('/account/me', { method: 'PATCH', body: JSON.stringify(body) }).then((b) => b.data),
  recipients: (params) => authed(`/account/recipients${qs(params)}`),
  createRecipient: (body) => authed('/account/recipients', { method: 'POST', body: JSON.stringify(body) }).then((b) => b.data),
  updateRecipient: (id, body) => authed(`/account/recipients/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then((b) => b.data),
  deleteRecipient: (id) => authed(`/account/recipients/${id}`, { method: 'DELETE' }).then((b) => b.data),
  authedDraftPut: (body) => authed('/requests/draft', { method: 'PUT', body: JSON.stringify(body) }).then((b) => b.data),
  authedDraftGet: (key) => authed(`/requests/draft?idempotency_key=${encodeURIComponent(key)}`).then((b) => b.data),
  authedSubmit: (body) => authed('/requests/submit', { method: 'POST', body: JSON.stringify(body) }).then((b) => b.data),
  authedList: (params) => authed(`/requests${qs(params)}`),
  authedGet: (id) => authed(`/requests/${id}`).then((b) => b.data),
  authedGetDetails: (id) => authed(`/requests/${id}/details`).then((b) => b.data),
  authedCancel: (id) => authed(`/requests/${id}/cancel`, { method: 'POST' }).then((b) => b.data),
  authedDeleteRequest: (id) => authed(`/requests/${id}`, { method: 'DELETE' }).then((b) => b.data),
  authedNotifications: (params) => authed(`/support/notifications${qs(params)}`),
  authedNotificationRead: (id) => authed(`/support/notifications/${id}/read`, { method: 'PATCH' }).then((b) => b.data),
  authedNotificationsReadAll: () => authed('/support/notifications/read-all', { method: 'POST' }).then((b) => b.data),
  authedTickets: (params) => authed(`/support/tickets${qs(params)}`),
  authedTicket: (id) => authed(`/support/tickets/${id}`).then((b) => b.data),
  authedTicketCreate: (body) => authed('/support/tickets', { method: 'POST', body: JSON.stringify(body) }).then((b) => b.data),
  authedTicketReply: (id, message) => authed(`/support/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) }).then((b) => b.data),
  authedTicketClose: (id) => authed(`/support/tickets/${id}/close`, { method: 'POST' }).then((b) => b.data),
  home: () => cachedGet('/content/home').then((b) => b.data),
  services: (params) => cachedGet(`/services${qs(params)}`),
  service: (slug) => cachedGet(`/services/${slug}`).then((b) => b.data),
  hospitals: (params) => cachedGet(`/hospitals${qs(params)}`),
  hospital: (slug) => cachedGet(`/hospitals/${slug}`).then((b) => b.data),
  faqs: (params) => cachedGet(`/content/faqs${qs(params)}`),
  block: (key) => cachedGet(`/content/blocks/${key}`).then((b) => b.data).catch((e) => {
    if (e.code === 'NOT_FOUND' || /404/.test(e.message)) return null;
    throw e;
  }),
  blocks: (keys) => cachedGet(`/content/blocks?keys=${encodeURIComponent(keys.join(','))}`).then((b) => b.data).catch(() => ({})),
  contactInfo: () => cachedGet('/content/contact').then((b) => b.data),
  submitContact: (body) => request('/contact', { method: 'POST', body: JSON.stringify(body) }).then((b) => b.data),

  // Customer auth (Phase 5). Tokens: short-lived access in memory/session,
  // rotating refresh persisted for "stay signed in".
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }).then((b) => b.data),
  otpRequest: (body) => request('/auth/otp/request', { method: 'POST', body: JSON.stringify(body) }).then((b) => b.data),
  otpVerify: (body) => request('/auth/otp/verify', { method: 'POST', body: JSON.stringify(body) }).then((b) => b.data),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }).then((b) => b.data),
  recoveryConfirm: (body) => request('/auth/recovery/confirm', { method: 'POST', body: JSON.stringify(body) }).then((b) => b.data),
  refresh: (refreshToken) =>
    request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }).then((b) => b.data),
  logout: (refreshToken) =>
    request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).then((b) => b.data).catch(() => ({ ok: true })),
};

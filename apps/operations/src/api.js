const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const TOKEN_KEY = 'ay-ops-access';
const REFRESH_KEY = 'ay-ops-refresh';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (t) => (t ? localStorage.setItem(REFRESH_KEY, t) : localStorage.removeItem(REFRESH_KEY)),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

let refreshPromise = null;

async function doRefresh() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshToken = tokenStore.getRefresh();
        if (!refreshToken) return false;
        const rr = await fetch(`${BASE}/ops/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!rr.ok) {
          tokenStore.clear();
          window.dispatchEvent(new Event('ay-unauthorized'));
          return false;
        }
        const rdata = await rr.json();
        tokenStore.set(rdata.data.accessToken);
        tokenStore.setRefresh(rdata.data.refreshToken);
        return true;
      } catch {
        tokenStore.clear();
        window.dispatchEvent(new Event('ay-unauthorized'));
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function request(path, { method = 'GET', body, auth = true, unwrap = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (res.status === 401 && auth && tokenStore.getRefresh()) {
    const refreshed = await doRefresh();
    if (refreshed) {
      return request(path, { method, body, auth, unwrap });
    }
  }
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(payload.message ?? 'Request failed');
    err.status = res.status;
    err.code = payload.code;
    err.fieldErrors = payload.fieldErrors;
    throw err;
  }
  return unwrap ? payload.data : payload;
}

export const api = {
  login: (email, password) => request('/ops/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  logout: () => {
    const refreshToken = tokenStore.getRefresh();
    tokenStore.clear();
    return refreshToken
      ? request('/ops/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }).catch(() => ({ ok: true }))
      : Promise.resolve({ ok: true });
  },
  list: async (entity, params = {}) => {
    const qs = new URLSearchParams({ page: '1', limit: '20', ...params }).toString();
    const payload = await request(`/ops/${entity}?${qs}`, { unwrap: false });
    return {
      data: Array.isArray(payload.data) ? payload.data : [],
      pagination: payload.pagination ?? null,
    };
  },
  get: (entity, id) => request(`/ops/${entity}/${id}`),
  getOne: (entity) => request(`/ops/${entity}`),
  raw: (path, method, body) => request(path, { method, body: body === undefined ? undefined : body }),
  create: (entity, body) => request(`/ops/${entity}`, { method: 'POST', body }),
  update: (entity, id, body) => request(`/ops/${entity}/${id}`, { method: 'PATCH', body }),
  put: (entity, body) => request(`/ops/${entity}`, { method: 'PUT', body }),
  delete: (entity, id) => request(`/ops/${entity}/${id}`, { method: 'DELETE' }),
  deleteBlock: (key) => request(`/ops/cms/content-blocks/${key}`, { method: 'DELETE' }),
};

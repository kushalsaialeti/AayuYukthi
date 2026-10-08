function resolveBaseUrl(raw) {
  if (!raw) return '/api/v1';
  const clean = raw.trim().replace(/\/+$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
}

const BASE = resolveBaseUrl(import.meta.env.VITE_API_BASE_URL);
const SESSION_KEY = 'ay-anon-session';

function deviceCategory() {
  try {
    const w = window.innerWidth;
    if (w < 700) return 'mobile';
    if (w < 1100) return 'tablet';
    return 'desktop';
  } catch {
    return 'unknown';
  }
}

export function anonymousSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) + '-anon';
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `transient-${Date.now()}-anon`;
  }
}

function accessToken() {
  try {
    return sessionStorage.getItem('ay-access');
  } catch {
    return null;
  }
}

function locale() {
  try {
    return localStorage.getItem('ay-locale') ?? 'en';
  } catch {
    return 'en';
  }
}

let rateLimitCooldownUntil = 0;
const recentEvents = new Map();

// Fire-and-forget: analytics must never slow or break the product flow.
export function track(eventName, metadata = {}, extra = {}) {
  try {
    const now = Date.now();
    if (now < rateLimitCooldownUntil) {
      return; // Respect rate-limit cooldown
    }

    // Suppress rapid-fire duplicate events within 300ms
    const eventKey = `${eventName}_${JSON.stringify(metadata)}`;
    const lastTime = recentEvents.get(eventKey);
    if (lastTime && now - lastTime < 300) {
      return;
    }
    recentEvents.set(eventKey, now);
    if (recentEvents.size > 50) {
      const oldestKey = recentEvents.keys().next().value;
      recentEvents.delete(oldestKey);
    }

    const token = accessToken();
    fetch(`${BASE}/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        event_name: eventName,
        anonymous_session_id: anonymousSessionId(),
        page: window.location.pathname,
        source: document.referrer || null,
        device_category: deviceCategory(),
        locale: locale(),
        metadata,
        ...extra,
      }),
      keepalive: true,
    })
      .then((res) => {
        if (res.status === 429) {
          rateLimitCooldownUntil = Date.now() + 10_000; // Back off for 10s if rate-limited
        }
      })
      .catch(() => {});
  } catch {
    /* analytics never throws */
  }
}

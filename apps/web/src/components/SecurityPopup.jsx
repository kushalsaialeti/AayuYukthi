import { useEffect, useState } from 'react';

// Global "joker" popup: when the API blocks an attack attempt (403
// SECURITY_BLOCKED) or trips a rate limit (429), the server responds with a
// taunting message instead of a useful error — this surfaces it as a popup so
// even a casual visitor sees their attempt was caught and reported.
// Mounted once in App(); pure listener, no props.

const TITLES = {
  SECURITY_BLOCKED: '🚫 Nice try, hacker!',
  RATE_LIMITED: '⏳ Slow down there!',
};

export function SecurityPopup() {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const onBlock = (e) => setEvent(e.detail ?? {});
    window.addEventListener('ay:security-block', onBlock);
    return () => window.removeEventListener('ay:security-block', onBlock);
  }, []);

  useEffect(() => {
    if (!event) return undefined;
    const timer = setTimeout(() => setEvent(null), 12_000);
    return () => clearTimeout(timer);
  }, [event]);

  if (!event) return null;
  const title = TITLES[event.code] ?? '🚨 Blocked!';

  return (
    <div className="sec-popup-backdrop" role="alertdialog" aria-live="assertive" aria-label={title}>
      <div className="sec-popup">
        <div className="sec-popup-head">
          <span className="sec-popup-alarm" aria-hidden="true">🔴</span>
          <strong>{title}</strong>
          <button type="button" className="sec-popup-close" onClick={() => setEvent(null)} aria-label="Close">×</button>
        </div>
        <p className="sec-popup-msg">{event.message}</p>
        <p className="sec-popup-meta">
          This attempt has been logged and escalated to our administrators.
          {event.requestId ? ` Reference: ${event.requestId}` : ''}
        </p>
        <button type="button" className="sec-popup-ok" onClick={() => setEvent(null)}>Understood</button>
      </div>
    </div>
  );
}

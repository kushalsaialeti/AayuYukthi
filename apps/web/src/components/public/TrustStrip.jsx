import { Icon } from './Icon.jsx';

// Trust strip: up to 4 CMS blocks (home.trust.1..4 → icon/title/body).
// Missing blocks are skipped — the strip shrinks instead of showing holes.
const TILE_TINTS = [
  { bg: 'rgba(0,67,73,.1)', fg: 'var(--pub-primary)' },
  { bg: 'rgba(206,229,255,.5)', fg: 'var(--pub-secondary)' },
  { bg: 'rgba(255,219,210,.6)', fg: 'var(--pub-tertiary)' },
  { bg: 'rgba(171,238,246,.6)', fg: 'var(--pub-on-primary-fixed)' },
];

export function TrustStrip({ items }) {
  const list = (items ?? []).filter((b) => b && (b.title_en || b.body_en)).slice(0, 4);
  if (!list.length) return null;
  return (
    <section className="pub-trust">
      <div className="pub-container">
        <div className="pub-trust-grid">
          {list.map((b, i) => (
            <div key={b.key} className="pub-trust-item">
              <div
                className="pub-trust-icon"
                style={{ background: TILE_TINTS[i % 4].bg, color: TILE_TINTS[i % 4].fg }}
              >
                <Icon name={b.icon} fallback="verified_user" size={26} />
              </div>
              <div>
                <h4>{b.title_en}</h4>
                <p>{b.body_en}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

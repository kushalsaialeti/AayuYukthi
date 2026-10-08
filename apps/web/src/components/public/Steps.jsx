import { Icon } from './Icon.jsx';

// Numbered step cards (home.how.1..5 → title/body; optional meta_N block for
// the footer line, icon from the block). Falls back to nothing when CMS is empty.
export function StepsPreview({ steps }) {
  const list = (steps ?? []).filter((b) => b && (b.title_en || b.body_en)).slice(0, 5);
  if (!list.length) return null;
  return (
    <div className="pub-grid-5">
      {list.map((b, i) => (
        <div key={b.key} className="pub-card">
          <div className={`pub-step-num${i === 0 ? '' : ' plain'}`}>{i + 1}</div>
          <h3>{b.title_en}</h3>
          <p className="body">{b.body_en}</p>
          {b.meta && (
            <div className="pub-card-meta" style={{ color: 'var(--pub-primary)' }}>
              <Icon name={b.icon} fallback="check_circle" size={16} />
              {b.meta}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Reassurance pillars (home.pillars.1..4 → icon/title/body).
export function Pillars({ items }) {
  const list = (items ?? []).filter((b) => b && (b.title_en || b.body_en)).slice(0, 4);
  if (!list.length) return null;
  return (
    <div className="pub-grid-4">
      {list.map((b) => (
        <div key={b.key} className="pub-card">
          <div className="pub-icon-tile" style={{ background: 'rgba(0,67,73,.1)', color: 'var(--pub-primary)' }}>
            <Icon name={b.icon} fallback="volunteer_activism" size={28} />
          </div>
          <h3>{b.title_en}</h3>
          <p className="body">{b.body_en}</p>
        </div>
      ))}
    </div>
  );
}

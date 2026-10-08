import { Icon } from '../public/Icon.jsx';

export function ServicePillars({ pillarBlocks = {} }) {
  const keys = ['services.pillar.1', 'services.pillar.2', 'services.pillar.3'];
  const defaultMeta = [
    { icon: 'verified_user', cls: 'c1', footerIcon: 'badge', footerTag: 'Accredited Care Specialists' },
    { icon: 'notifications_active', cls: 'c2', footerIcon: 'cell_tower', footerTag: 'Zero Anxiety For Remote Family' },
    { icon: 'balance', cls: 'c3', footerIcon: 'policy', footerTag: '100% Unbiased Patient Advocacy' },
  ];

  const pillars = keys
    .map((k, idx) => {
      const b = pillarBlocks[k];
      if (!b || (!b.title_en && !b.body_en)) return null;
      const meta = defaultMeta[idx] || defaultMeta[0];
      return {
        num: String(idx + 1).padStart(2, '0'),
        title: b.title_en,
        body: b.body_en,
        icon: b.icon || meta.icon,
        cls: meta.cls,
        footerIcon: meta.footerIcon,
        footerTag: meta.footerTag,
      };
    })
    .filter(Boolean);

  if (pillars.length === 0) return null;

  return (
    <section className="svc-pillars-section">
      <div className="pub-container">
        <div className="svc-pillars-head">
          <span className="svc-pillars-eyebrow">Guaranteed Standards</span>
          <h2 className="svc-pillars-title">How We Deliver Care</h2>
          <p className="svc-pillars-sub">
            We bridge the gap between your front door and the hospital room with reliable, compassionate systems.
          </p>
        </div>

        <div className="svc-pillars-grid">
          {pillars.map((p) => (
            <div key={p.num} className="svc-pillar-card">
              <div className={`svc-pillar-icon-box ${p.cls}`}>
                <Icon name={p.icon} size={28} />
              </div>
              <div className="svc-pillar-num" aria-hidden="true">
                {p.num}
              </div>
              <h3 className="svc-pillar-title">{p.title}</h3>
              <p className="svc-pillar-body">{p.body}</p>
              <div className={`svc-pillar-foot ${p.cls}`}>
                <Icon name={p.footerIcon} size={18} />
                <span>{p.footerTag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

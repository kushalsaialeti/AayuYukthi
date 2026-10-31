import { Icon } from '../public/Icon.jsx';

export function HospitalStandards({ standardsBlocks = {} }) {
  const eyebrow =
    standardsBlocks['hospitals.standards.eyebrow']?.body_en ||
    standardsBlocks['hospitals.standards.eyebrow']?.title_en ||
    null;

  const title =
    standardsBlocks['hospitals.standards.title']?.body_en ||
    standardsBlocks['hospitals.standards.title']?.title_en ||
    null;

  const body =
    standardsBlocks['hospitals.standards.body']?.body_en ||
    standardsBlocks['hospitals.standards.body']?.title_en ||
    null;

  const keys = ['hospitals.standard.1', 'hospitals.standard.2', 'hospitals.standard.3'];
  // Icons/layout only — no hardcoded outcome stats (e.g. percentage claims).
  const defaultMeta = [
    { icon: 'map', cls: 'c1' },
    { icon: 'receipt_long', cls: 'c2' },
    { icon: 'shield_person', cls: 'c3' },
  ];

  const standards = keys
    .map((k, idx) => {
      const b = standardsBlocks[k];
      if (!b || (!b.title_en && !b.body_en)) return null;
      const meta = defaultMeta[idx] || defaultMeta[0];
      return {
        title: b.title_en,
        body: b.body_en,
        icon: b.icon || meta.icon,
        cls: meta.cls,
      };
    })
    .filter(Boolean);

  if (standards.length === 0) return null;

  return (
    <section className="hsp-standards-section">
      <div className="pub-container">
        <div className="hsp-standards-head">
          <div>
            {eyebrow && <span className="hsp-standards-eyebrow">{eyebrow}</span>}
            {title && <h2 className="hsp-standards-title">{title}</h2>}
          </div>
          {body && <p className="hsp-standards-sub">{body}</p>}
        </div>

        <div className="hsp-standards-grid">
          {standards.map((item, idx) => (
            <div key={idx} className="hsp-standard-card">
              <div className={`hsp-standard-icon-box ${item.cls}`}>
                <Icon name={item.icon} size={26} />
              </div>
              <h3 className="hsp-standard-title">{item.title}</h3>
              <p className="hsp-standard-body">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Icon } from '../public/Icon.jsx';

export function HospitalStandards({ standardsBlocks = {} }) {
  const eyebrow =
    standardsBlocks['hospitals.standards.eyebrow']?.body_en ||
    standardsBlocks['hospitals.standards.eyebrow']?.title_en ||
    'Inside Partner Campuses';

  const title =
    standardsBlocks['hospitals.standards.title']?.body_en ||
    standardsBlocks['hospitals.standards.title']?.title_en ||
    'Built for navigation ease inside complex hospitals.';

  const body =
    standardsBlocks['hospitals.standards.body']?.body_en ||
    standardsBlocks['hospitals.standards.body']?.title_en ||
    'AayuYukthi companions are trained in hospital layouts, patient advocacy, and eliminating bureaucratic wait times.';

  const keys = ['hospitals.standard.1', 'hospitals.standard.2', 'hospitals.standard.3'];
  const defaultMeta = [
    { icon: 'map', cls: 'c1', footer: 'Zero confused wandering for families' },
    { icon: 'receipt_long', cls: 'c2', footer: 'Up to 70% reduction in standing fatigue' },
    { icon: 'shield_person', cls: 'c3', footer: '100% loyal to patient & caregiver needs' },
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
        footer: meta.footer,
      };
    })
    .filter(Boolean);

  if (standards.length === 0) return null;

  return (
    <section className="hsp-standards-section">
      <div className="pub-container">
        <div className="hsp-standards-head">
          <div>
            <span className="hsp-standards-eyebrow">{eyebrow}</span>
            <h2 className="hsp-standards-title">{title}</h2>
          </div>
          <p className="hsp-standards-sub">{body}</p>
        </div>

        <div className="hsp-standards-grid">
          {standards.map((item, idx) => (
            <div key={idx} className="hsp-standard-card">
              <div className={`hsp-standard-icon-box ${item.cls}`}>
                <Icon name={item.icon} size={26} />
              </div>
              <h3 className="hsp-standard-title">{item.title}</h3>
              <p className="hsp-standard-body">{item.body}</p>
              <div className="hsp-standard-foot">
                <Icon name="check_circle" size={16} />
                <span>{item.footer}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

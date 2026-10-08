import { Link } from 'react-router-dom';
import { ResponsiveImage } from '../../media.jsx';
import { Icon } from './Icon.jsx';

// Themed service card: icon tile (CMS `icon` on the block or service icon),
// title, CMS description, footer line (subtitle_en: price/duration) + detail link.
export function ServiceCard({ service, t, tx = (_e, _i, _f, s) => s }) {
  return (
    <article className="pub-card">
      <div>
        <div className="pub-icon-tile" style={{ background: 'rgba(0,67,73,.1)', color: 'var(--pub-primary)' }}>
          <Icon name={service.icon} fallback="calendar_month" size={26} />
        </div>
        <h3>{tx('services', service.id, 'title_en', service.title_en)}</h3>
        <p className="body">{tx('services', service.id, 'description_en', service.description_en)}</p>
      </div>
      <div className="pub-svc-foot">
        <span>{service.subtitle_en || ''}</span>
        <Link className="pub-link" to={`/services/${service.slug}`}>
          {t.learnMore} <Icon name="chevron_right" size={16} />
        </Link>
      </div>
    </article>
  );
}

export function ServicesGrid({ services, t, tx, limit = 6 }) {
  const list = (services ?? []).slice(0, limit);
  if (!list.length) return <div className="pub-empty"><p>{t.emptyServices}</p></div>;
  return (
    <div className="pub-grid-3">
      {list.map((s) => <ServiceCard key={s.id} service={s} t={t} tx={tx} />)}
    </div>
  );
}

import { HospitalImage } from './HospitalWireframeImage.jsx';

// Themed hospital card: image banner (CMS media, live image, wireframe fallback),
// location, name, CMS description, network link.
export function HospitalCard({ hospital, t, tx = (_e, _i, _f, s) => s, activeLabel = 'Coordination Active' }) {
  return (
    <article className="pub-hosp-card">
      <div className="pub-hosp-img">
        <HospitalImage hospital={hospital} alt={hospital.name_en} />
        <span className="pub-hosp-badge">{activeLabel}</span>
      </div>
      <div className="pub-hosp-body">
        <div>
          {[hospital.city, hospital.state].filter(Boolean).join(', ') && (
            <div className="pub-hosp-loc">
              <Icon name="location_on" size={16} />
              <span>{[hospital.city, hospital.state].filter(Boolean).join(', ')}</span>
            </div>
          )}
          <h3>{tx('hospitals', hospital.id, 'name_en', hospital.name_en)}</h3>
          {hospital.description_en && <p>{tx('hospitals', hospital.id, 'description_en', hospital.description_en)}</p>}
        </div>
        <div className="pub-hosp-foot">
          <Link className="pub-link" to={`/hospitals/${hospital.slug}`}>
            {t.viewDetails} <Icon name="chevron_right" size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HospitalsGrid({ hospitals, t, tx, activeLabel, limit = 4 }) {
  const list = (hospitals ?? []).slice(0, limit);
  if (!list.length) return <div className="pub-empty"><p>{t.emptyHospitals}</p></div>;
  return (
    <div className="pub-grid-4">
      {list.map((h) => <HospitalCard key={h.id} hospital={h} t={t} tx={tx} activeLabel={activeLabel} />)}
    </div>
  );
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../public/Icon.jsx';

export function ServiceModal({ service, onClose, tx = (_, __, ___, fallback) => fallback }) {
  useEffect(() => {
    if (!service) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [service, onClose]);

  if (!service) return null;

  const title = tx('services', service.id, 'title_en', service.title_en);
  const description = tx('services', service.id, 'description_en', service.description_en);
  const price = service.subtitle_en || 'Contact for custom pricing';
  const benefits = service.benefits_en || [];

  return (
    <div
      className="svc-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="svc-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="svc-modal-dialog">
        <button
          type="button"
          className="svc-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <Icon name="close" size={20} />
        </button>

        <div className="svc-modal-content">
          <span className={`svc-category-badge ${service.category || 'outpatient'}`} style={{ width: 'fit-content' }}>
            {service.category === 'logistics'
              ? 'Mobility & Transit'
              : service.category === 'administrative'
              ? 'Administrative & TPA'
              : service.category === 'recurring'
              ? 'Monthly & Senior Care'
              : 'Doctor & Clinic Visits'}
          </span>

          <h3 id="svc-modal-title" className="svc-hero-title" style={{ fontSize: '1.5rem', margin: '0.25rem 0' }}>
            {title}
          </h3>

          <p className="svc-card-desc" style={{ fontSize: '15px' }}>
            {description}
          </p>

          <div className="svc-modal-price-box">
            <span className="svc-price-label">Pricing Structure</span>
            <p className="svc-price-val" style={{ margin: '4px 0 0' }}>
              {price}
            </p>
          </div>

          {benefits.length > 0 && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px', color: 'var(--pub-on-surface)' }}>
                Included in this service:
              </h4>
              <ul className="svc-modal-inclusions">
                {benefits.map((b, i) => (
                  <li key={i}>
                    <Icon name="check_circle" size={17} className="svc-benefit-icon" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="svc-modal-footer">
          <button type="button" className="svc-btn-details" onClick={onClose}>
            Close
          </button>
          <Link
            to={`/request-care?service=${encodeURIComponent(service.slug)}`}
            className="svc-btn-request"
            onClick={onClose}
          >
            Proceed to Book
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Icon } from '../public/Icon.jsx';
import { ServiceVisual } from './ServiceVisual.jsx';

export function ServiceCard({
  service,
  onOpenDetails,
  tx = (_, __, ___, fallback) => fallback,
  isFeatured = false,
}) {
  const { id, slug, category = 'outpatient', icon, benefits_en = [] } = service;

  const title = tx('services', id, 'title_en', service.title_en);
  const description = tx('services', id, 'description_en', service.description_en);
  const priceDisplay = service.subtitle_en || getDefaultPriceLabel(category, slug);
  const priceCategoryLabel = getPriceCategoryLabel(category, slug);

  // Category badge & theme color
  const stripeColor = getStripeClass(category, isFeatured);
  const categoryLabel = getCategoryLabel(category, slug);

  return (
    <article className={`svc-card ${isFeatured ? 'featured' : ''}`} data-category={category}>
      {/* Top Stripe Accent */}
      <div className={`svc-card-stripe ${stripeColor}`} />

      <div className="svc-card-body">
        {/* Header: Category Badge + Icon */}
        <div className="svc-card-header">
          <span className={`svc-category-badge ${category}`}>
            {isFeatured && <Icon name="star" size={13} style={{ marginRight: 4 }} />}
            {categoryLabel}
          </span>
          <Icon
            name={icon || getDefaultIcon(category, slug)}
            size={22}
            className={stripeColor === 'tertiary' ? 'svc-benefit-icon tertiary' : 'svc-benefit-icon'}
          />
        </div>

        {/* Visual Media / SVG Illustration */}
        <ServiceVisual service={service} isFeatured={isFeatured} />

        {/* Title & Description */}
        <h3 className="svc-card-title">{title}</h3>
        <p className="svc-card-desc">{description}</p>

        {/* Key Benefits Checklist */}
        {benefits_en.length > 0 && (
          <ul className="svc-benefits-list">
            {benefits_en.slice(0, 3).map((benefit, i) => (
              <li key={i} className="svc-benefit-item">
                <Icon
                  name="check_circle"
                  size={18}
                  className={`svc-benefit-icon ${stripeColor}`}
                />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Bottom Pricing & Action Tray */}
        <div className="svc-card-bottom">
          <div className="svc-price-row">
            <span className="svc-price-label">{priceCategoryLabel}</span>
            <span className="svc-price-val">{priceDisplay}</span>
          </div>

          <div className="svc-card-actions">
            <button
              type="button"
              className="svc-btn-details"
              onClick={() => onOpenDetails(service)}
            >
              Details
            </button>
            <Link
              to={`/request-care?service=${encodeURIComponent(slug)}`}
              className="svc-btn-request"
            >
              Request Care
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function getStripeClass(category, isFeatured) {
  if (isFeatured || category === 'recurring') return 'tertiary';
  if (category === 'logistics') return 'secondary';
  return 'primary';
}

function getCategoryLabel(category, slug) {
  if (slug === 'appointment-coordination') return 'Doctor & Clinic Visits';
  if (slug === 'hospital-visit-accompaniment') return 'On-Ground Companion';
  if (slug === 'pickup-drop') return 'Mobility & Transit';
  if (slug === 'hospital-process-billing') return 'Administrative & TPA';
  if (slug === 'treatment-diagnostic-support') return 'Day Care & Imaging';
  if (slug === 'recurring-care-coordination') return 'Monthly & Senior Care';

  if (category === 'outpatient') return 'Doctor & Clinic Visits';
  if (category === 'logistics') return 'Mobility & Transit';
  if (category === 'administrative') return 'Administrative & TPA';
  if (category === 'recurring') return 'Monthly & Senior Care';
  return 'Care Service';
}

function getDefaultIcon(category, slug) {
  if (slug === 'appointment-coordination') return 'calendar_month';
  if (slug === 'hospital-visit-accompaniment') return 'accessible_forward';
  if (slug === 'pickup-drop') return 'directions_car';
  if (slug === 'hospital-process-billing') return 'description';
  if (slug === 'treatment-diagnostic-support') return 'biotech';
  if (slug === 'recurring-care-coordination') return 'volunteer_activism';

  if (category === 'logistics') return 'airport_shuttle';
  if (category === 'administrative') return 'receipt_long';
  if (category === 'recurring') return 'elderly';
  return 'stethoscope';
}

function getPriceCategoryLabel(category, slug) {
  if (slug === 'pickup-drop' || category === 'logistics') return 'Trip Rate';
  if (slug === 'hospital-process-billing' || category === 'administrative') return 'Consult Fee';
  if (slug === 'treatment-diagnostic-support') return 'Session Rate';
  if (slug === 'recurring-care-coordination' || category === 'recurring') return 'Monthly Plan';
  if (slug === 'hospital-visit-accompaniment') return 'Flexible Tier';
  return 'Starting Plan';
}

function getDefaultPriceLabel(category, slug) {
  if (slug === 'appointment-coordination') return 'From ₹499 / Visit';
  if (slug === 'hospital-visit-accompaniment') return 'Half: ₹1,299 • Full: ₹2,199';
  if (slug === 'pickup-drop') return 'From ₹899 / Trip';
  if (slug === 'hospital-process-billing') return 'From ₹799 / Consultation';
  if (slug === 'treatment-diagnostic-support') return 'From ₹1,199 / Session';
  if (slug === 'recurring-care-coordination') return 'From ₹2,999 / Month';
  return 'Custom Quote';
}

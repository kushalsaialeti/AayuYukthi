import { Link } from 'react-router-dom';
import { Icon } from '../public/Icon.jsx';

export function HospitalCustomBanner({ customBlocks = {} }) {
  const badge =
    customBlocks['hospitals.custom.badge']?.body_en ||
    customBlocks['hospitals.custom.badge']?.title_en ||
    'Universal Coverage Guarantee';

  const title =
    customBlocks['hospitals.custom.title']?.body_en ||
    customBlocks['hospitals.custom.title']?.title_en ||
    'Visiting a hospital or clinic not listed here?';

  const body =
    customBlocks['hospitals.custom.body']?.body_en ||
    customBlocks['hospitals.custom.body']?.title_en ||
    'AayuYukthi companions can escort you to ANY accredited hospital, standalone diagnostic lab, or specialty day-care center in Bhimavaram and surrounding areas. Submit your center details and we will verify coordinator dispatch within 15 minutes.';

  return (
    <section className="hsp-custom-section">
      <div className="pub-container">
        <div className="hsp-custom-banner">
          <div className="hsp-custom-glow" aria-hidden="true" />

          <div className="hsp-custom-grid">
            <div className="hsp-custom-info">
              <div className="hsp-custom-badge">
                <Icon name="travel_explore" size={18} />
                <span>{badge}</span>
              </div>
              <h2 className="hsp-custom-h2">{title}</h2>
              <p className="hsp-custom-p">{body}</p>
            </div>

            <div className="hsp-custom-actions">
              <Link to="/request-care" className="hsp-btn-custom">
                <Icon name="add_location_alt" size={20} />
                <span>Request Custom Hospital Accompaniment</span>
              </Link>
              <div className="hsp-custom-note">
                <Icon name="bolt" size={16} />
                <span>Instant WhatsApp dispatch confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

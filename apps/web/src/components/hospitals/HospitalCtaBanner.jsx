import { Link } from 'react-router-dom';
import { Icon } from '../public/Icon.jsx';

export function HospitalCtaBanner({ ctaBlocks = {}, contactInfo = null }) {
  const title =
    ctaBlocks['hospitals.cta.title']?.body_en ||
    ctaBlocks['hospitals.cta.title']?.title_en ||
    'Have an upcoming hospital consultation or admission?';

  const body =
    ctaBlocks['hospitals.cta.body']?.body_en ||
    ctaBlocks['hospitals.cta.body']?.title_en ||
    'Book a verified coordinator in under 2 minutes. We can meet you at your doorstep or directly at the hospital gate.';

  const phone = contactInfo?.phone || '+91 8816 223344';
  const telHref = `tel:${phone.replace(/[^0-9+]/g, '')}`;

  return (
    <section className="hsp-bottom-cta">
      <div className="pub-container">
        <div className="hsp-cta-box">
          <div className="hsp-cta-left">
            <div className="hsp-cta-icon-box">
              <Icon name="support_agent" size={30} />
            </div>
            <div>
              <h3 className="hsp-cta-title">{title}</h3>
              <p className="hsp-cta-desc">{body}</p>
            </div>
          </div>

          <div className="hsp-cta-buttons">
            <a href={telHref} className="hsp-cta-call">
              <Icon name="call" size={20} className="text-primary" />
              <span>Call Helpline</span>
            </a>
            <Link to="/request-care" className="hsp-cta-book">
              <span>Request Care Now</span>
              <Icon name="arrow_forward" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

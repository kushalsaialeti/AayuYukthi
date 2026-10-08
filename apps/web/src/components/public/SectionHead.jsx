export function SectionHead({ eyebrow, title, sub, linkTo, linkLabel }) {
  if (!title && !eyebrow) return null;
  return (
    <div className="pub-section-head split">
      <div>
        {eyebrow && <span className="pub-eyebrow">{eyebrow}</span>}
        {title && <h2 className="pub-h2">{title}</h2>}
        {sub && <p className="pub-sub">{sub}</p>}
      </div>
      {linkTo && linkLabel && (
        <a className="pub-link" href={linkTo}>
          {linkLabel} <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">arrow_forward</span>
        </a>
      )}
    </div>
  );
}

// Centered variant for testimonials/FAQ-style sections.
export function SectionHeadCenter({ eyebrow, title, sub }) {
  if (!title && !eyebrow) return null;
  return (
    <div style={{ textAlign: 'center', maxWidth: '42rem', margin: '0 auto 2.5rem' }}>
      {eyebrow && <span className="pub-eyebrow">{eyebrow}</span>}
      {title && <h2 className="pub-h2">{title}</h2>}
      {sub && <p className="pub-sub">{sub}</p>}
    </div>
  );
}

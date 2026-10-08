import React from 'react';

const DEFAULT_LEADERS = [
  {
    name: 'Ananya V. Deshmukh',
    role: 'Founder & Chief Care Officer',
    bio: 'Former Senior Operations Lead at premier tertiary hospital chains. Spearheading patient rights and non-clinical care accompaniment.',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Dr. K. Srinivas Rao, MD',
    role: 'Senior Geriatric Advisory Chair',
    bio: '30+ years in elderly inpatient rehabilitation. Establishes our companion training curricula on mobility assistance and vital signs observation.',
    img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Rajeev Nambiar',
    role: 'Head of Field Companion Safety',
    bio: 'Oversees background checks, hospital route mapping, and real-time coordinator GPS telemetry for maximum caregiver transparency.',
    img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
  },
];

export function AboutLeadership({ cms = {} }) {
  const badge = cms['about.leadership.badge'] || 'Governance & Leadership';
  const title = cms['about.leadership.title'] || 'Guided by Clinical & Operational Experts';
  const sub =
    cms['about.leadership.sub'] ||
    'Our council blends hospital administrators, senior geriatricians, and operational navigators to ensure uncompromising patient safety protocols.';

  const leaders = [
    {
      name: cms['about.leader1.name'] || DEFAULT_LEADERS[0].name,
      role: cms['about.leader1.role'] || DEFAULT_LEADERS[0].role,
      bio: cms['about.leader1.bio'] || DEFAULT_LEADERS[0].bio,
      img: cms['about.leader1.image'] || DEFAULT_LEADERS[0].img,
    },
    {
      name: cms['about.leader2.name'] || DEFAULT_LEADERS[1].name,
      role: cms['about.leader2.role'] || DEFAULT_LEADERS[1].role,
      bio: cms['about.leader2.bio'] || DEFAULT_LEADERS[1].bio,
      img: cms['about.leader2.image'] || DEFAULT_LEADERS[1].img,
    },
    {
      name: cms['about.leader3.name'] || DEFAULT_LEADERS[2].name,
      role: cms['about.leader3.role'] || DEFAULT_LEADERS[2].role,
      bio: cms['about.leader3.bio'] || DEFAULT_LEADERS[2].bio,
      img: cms['about.leader3.image'] || DEFAULT_LEADERS[2].img,
    },
  ];

  return (
    <section className="ay-about-leadership-section">
      <div className="pub-container">
        <div className="ay-about-leadership-header">
          <div>
            <span className="ay-about-section-badge">{badge}</span>
            <h2 className="ay-about-section-h2">{title}</h2>
          </div>
          <p className="ay-about-paragraph" style={{ maxWidth: '28rem', margin: 0 }}>
            {sub}
          </p>
        </div>

        <div className="ay-about-leadership-grid">
          {leaders.map((ldr, idx) => (
            <div key={idx} className="ay-about-leader-card">
              <img
                src={ldr.img}
                alt={ldr.name}
                className="ay-about-leader-img"
                loading="lazy"
              />
              <div>
                <h4 className="ay-about-leader-name">{ldr.name}</h4>
                <p className="ay-about-leader-role">{ldr.role}</p>
                <p className="ay-about-leader-bio">{ldr.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

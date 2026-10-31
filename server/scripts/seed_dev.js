// Local-dev seed ONLY. Never run against staging/production.
// Creates an ops head login + sample published CMS content.
import 'dotenv/config';
import pg from 'pg';
import { hashPassword } from '../src/modules/auth/password.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const email = 'ops@aayuyukthi.local';
  const hash = await hashPassword('ChangeMe123!');
  const { rows } = await client.query(
    `INSERT INTO users (email, password_hash, full_name, status) VALUES ($1,$2,'Local Ops Head','active')
     ON CONFLICT DO NOTHING RETURNING id`,
    [email, hash],
  );
  let userId = rows[0]?.id;
  if (!userId) {
    userId = (await client.query('SELECT id FROM users WHERE lower(email)=lower($1)', [email])).rows[0].id;
  }
  for (const role of ['operations_head', 'content_manager']) {
    await client.query('INSERT INTO user_roles (user_id, role, assigned_by) VALUES ($1,$2,$1) ON CONFLICT DO NOTHING', [userId, role]);
  }

  const servicesSeed = [
    {
      slug: 'appointment-coordination',
      title_en: 'Appointment Coordination',
      category: 'outpatient',
      subtitle_en: 'From ₹499 / Visit',
      icon: 'calendar_month',
      description_en: 'Doctor slot reservations, re-confirmations, medical summary preparations, and diagnostic timing alignment to minimize hospital lobby waiting times.',
      benefits_en: ['Direct booking with specialists', 'Zero waiting room friction', 'Document readiness review'],
      sort_order: 1,
    },
    {
      slug: 'hospital-visit-accompaniment',
      title_en: 'Hospital Visit Accompaniment',
      category: 'outpatient',
      subtitle_en: 'Half: ₹1,299 • Full: ₹2,199',
      icon: 'accessible_forward',
      description_en: 'An empathetic dedicated care coordinator stays physically beside you or your elderly family member through registration, OPD queues, doctor consults, and pharmacy collection.',
      benefits_en: ['Compassionate companion support', 'Wheelchair assistance available', 'Real-time family updates'],
      sort_order: 2,
    },
    {
      slug: 'pickup-drop',
      title_en: 'Pickup & Drop Support',
      category: 'logistics',
      subtitle_en: 'From ₹899 / Trip',
      icon: 'directions_car',
      description_en: 'Safe, doorstep chauffeured transit with companion assistance into and out of vehicles. Foldable wheelchair accommodation available upon request.',
      benefits_en: ['Door-to-door transit support', 'Planned hospital arrival', 'Trained patient-assistance drivers'],
      sort_order: 3,
    },
    {
      slug: 'hospital-process-billing',
      title_en: 'Hospital Process & Billing Assistance',
      category: 'administrative',
      subtitle_en: 'From ₹799 / Consultation',
      icon: 'description',
      description_en: 'TPA desk coordination, health insurance pre-authorizations, bill settlements, and discharge summary compilations made simple.',
      benefits_en: ['Cashless claim desk navigation', 'Discharge paperwork support', 'Itemized invoice review'],
      sort_order: 4,
    },
    {
      slug: 'treatment-diagnostic-support',
      title_en: 'Treatment & Diagnostic Visit Support',
      category: 'outpatient',
      subtitle_en: 'From ₹1,199 / Session',
      icon: 'biotech',
      description_en: 'Comprehensive support for specialized imaging (MRI/CT), dialysis sessions, chemo day-care, and routine periodic pathology tests.',
      benefits_en: ['Visit preparation support', 'Dedicated bay accompaniment', 'Safe return handover'],
      sort_order: 5,
    },
    {
      slug: 'recurring-care-coordination',
      title_en: 'Recurring Care Coordination',
      category: 'recurring',
      subtitle_en: 'From ₹2,999 / Month',
      icon: 'volunteer_activism',
      description_en: 'Monthly ongoing plans for senior citizens and chronic care patients needing regular follow-ups, diagnostic monitoring, and medicine deliveries.',
      benefits_en: ['Dedicated primary care manager', 'Automatic appointment cadence', 'Monthly visit summary'],
      sort_order: 6,
    },
  ];

  for (const s of servicesSeed) {
    await client.query(
      `INSERT INTO services (slug, title_en, description_en, benefits_en, subtitle_en, icon, category, sort_order, status, is_visible, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', true, $9, $9)
       ON CONFLICT (slug) DO UPDATE SET
         title_en = EXCLUDED.title_en,
         description_en = EXCLUDED.description_en,
         benefits_en = EXCLUDED.benefits_en,
         subtitle_en = EXCLUDED.subtitle_en,
         icon = EXCLUDED.icon,
         category = EXCLUDED.category,
         sort_order = EXCLUDED.sort_order,
         status = 'published',
         is_visible = true,
         updated_by = EXCLUDED.updated_by`,
      [s.slug, s.title_en, s.description_en, s.benefits_en, s.subtitle_en, s.icon, s.category, s.sort_order, userId],
    );
  }

  const hospitalsSeed = [
    {
      slug: 'varma-hospitals',
      name_en: 'Varma Hospitals',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Main Road, Bhimavaram, West Godavari, Andhra Pradesh 534201',
      description_en: 'Comprehensive multi-specialty healthcare center providing compassionate outpatient care, surgical interventions, and dedicated elderly diagnostics in Bhimavaram.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Wheelchair Logistics', 'OPD Navigation', 'Diagnostics Flow'],
    },
    {
      slug: 'imperial-hospitals',
      name_en: 'Imperial Hospitals',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram Town, West Godavari, Andhra Pradesh 534201',
      description_en: 'Advanced clinical and surgical hospital equipped with modern intensive care units, round-the-clock emergency assistance, and rapid outpatient services.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Wheelchair Logistics', 'Doctor Consult Escort', 'Pharmacy Support'],
    },
    {
      slug: 'akshara-speciality-hospitals',
      name_en: 'Akshara Speciality Hospitals',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram, West Godavari, Andhra Pradesh 534202',
      description_en: 'Specialized healthcare hub offering cardiology, nephrology, orthopedics, and integrated diagnostic laboratories for senior citizens.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Wheelchair Support', 'TPA Desk Help', 'Diagnostics Escort'],
    },
    {
      slug: 'mithra-medicare-hospital',
      name_en: 'Mithra Medicare Hospital',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Near Bus Stand Road, Bhimavaram, West Godavari, Andhra Pradesh 534201',
      description_en: 'Trusted community healthcare facility offering general medicine, pediatrics, geriatric evaluations, and health check packages.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Wheelchair Assistance', 'OPD Token Fast-track', 'Billing Desk Help'],
    },
    {
      slug: 'nallaparaju-venkata-raju-hospital',
      name_en: 'Nallaparaju Venkata Raju Hospital',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram, West Godavari, Andhra Pradesh 534201',
      description_en: 'Established medical center providing comprehensive inpatient care, minor surgical procedures, and dedicated nursing care in the heart of Bhimavaram.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Transit Assistance', 'Elderly Mobility Care', 'Prescription Pickup'],
    },
    {
      slug: 'rajarshi-hospitals',
      name_en: 'Rajarshi Hospitals',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram Town, West Godavari, Andhra Pradesh 534202',
      description_en: 'Multi-specialty hospital renowned for orthopedic surgery, trauma recovery, geriatric rehabilitation, and outpatient clinics.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Wheelchair Transfer', 'Doctor Consult Navigation', 'Discharge Assistance'],
    },
    {
      slug: 'bhimavaram-hospitals',
      name_en: 'Bhimavaram Hospitals',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram, West Godavari, Andhra Pradesh 534201',
      description_en: 'Prominent regional multi-specialty institute serving Bhimavaram and surrounding areas with modern operating theaters and multi-specialty clinics.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Wheelchair Logistics', 'OPD Navigation', 'Lab Diagnostics Escort'],
    },
    {
      slug: 'teja-super-speciality-hospital',
      name_en: 'Teja Super Speciality Hospital',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'PP Road, Bhimavaram, West Godavari, Andhra Pradesh 534201',
      description_en: 'Super-specialty center offering advanced neurology, gastroenterology, laparoscopic surgeries, and round-the-clock emergency trauma care.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Wheelchair Logistics', 'TPA Pre-Clearing', 'Pharmacy Fulfillment'],
    },
    {
      slug: 'vh-care-multi-speciality-hospital',
      name_en: 'VH Care Multi-speciality Hospital',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram, West Godavari, Andhra Pradesh 534203',
      description_en: 'Modern multi-specialty hospital focused on patient comfort, minimally invasive procedures, diagnostic ultrasound, and chronic disease clinics.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Wheelchair Logistics', 'OPD Token Assistance', 'Medicine Collection'],
    },
    {
      slug: 'sri-venkateswara-hospitals',
      name_en: 'Sri Venkateswara Hospitals',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram, West Godavari, Andhra Pradesh 534202',
      description_en: 'Family healthcare center delivering compassionate internal medicine, maternal health, geriatric consultations, and routine medical treatments.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Mobility Assistance', 'Doctor Consultation Escort', 'Billing Support'],
    },
    {
      slug: 'sri-lakshmi-hospitals',
      name_en: 'Sri Lakshmi Hospitals',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram, West Godavari, Andhra Pradesh 534201',
      description_en: 'Reputed local hospital providing specialized gynecological, surgical, orthopedic, and general physician outpatient consultations.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Wheelchair Logistics', 'Diagnostic Escort', 'Patient Advocacy'],
    },
    {
      slug: 'vinayaka-hospital',
      name_en: 'Vinayaka Hospital',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram, West Godavari, Andhra Pradesh 534201',
      description_en: 'Patient-centric hospital providing high-standard medical treatment, pediatric care, general surgical procedures, and preventive checkups.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Queue Fast-track', 'Wheelchair Support', 'Prescription Handling'],
    },
    {
      slug: 'sai-indian-hospitals',
      name_en: 'Sai Indian Hospitals',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram, West Godavari, Andhra Pradesh 534202',
      description_en: 'Comprehensive surgical and medical facility offering inpatient wards, day-care services, and specialized outpatient clinics in Bhimavaram.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Wheelchair Logistics', 'Transit Transfer', 'Discharge Coordination'],
    },
    {
      slug: 'neeladri-hospitals',
      name_en: 'Neeladri Hospitals',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram Town, West Godavari, Andhra Pradesh 534201',
      description_en: 'Dedicated multi-specialty hospital providing trusted medical care across cardiology, diabetology, pulmonology, and elder wellness programs.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Wheelchair Logistics', 'OPD Guidance', 'Diagnostic Test Flow'],
    },
    {
      slug: 'abhiram-orthopaedic-hospital',
      name_en: 'Abhiram Orthopaedic Hospital',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram, West Godavari, Andhra Pradesh 534202',
      description_en: 'Premier orthopedic and joint care hospital specializing in knee and hip replacement, trauma surgery, fracture care, and rehabilitation therapies.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Wheelchair Transit Assistance', 'X-Ray & MRI Escort', 'Rehab Navigation'],
    },
    {
      slug: 'maxivision-super-speciality-eye-hospitals',
      name_en: 'Maxivision Super Speciality Eye Hospitals',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      address_en: 'Bhimavaram, West Godavari, Andhra Pradesh 534201',
      description_en: 'Leading ophthalmic hospital providing world-class cataract surgeries, retina interventions, glaucoma care, and vision correction treatments.',
      campus_highlight_en: '',
      wait_info_en: '',
      features_en: ['Companion Escort', 'Dilation & Test Escort', 'Senior Citizen Walking Support', 'Drop Admin Help'],
    },
  ];

  for (const h of hospitalsSeed) {
    await client.query(
      `INSERT INTO hospitals (slug, name_en, description_en, city, state, address_en, campus_highlight_en, wait_info_en, features_en, status, is_visible, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published', true, $10, $10)
       ON CONFLICT (slug) DO UPDATE SET
         name_en = EXCLUDED.name_en,
         description_en = EXCLUDED.description_en,
         city = EXCLUDED.city,
         state = EXCLUDED.state,
         address_en = EXCLUDED.address_en,
         campus_highlight_en = EXCLUDED.campus_highlight_en,
         wait_info_en = EXCLUDED.wait_info_en,
         features_en = EXCLUDED.features_en,
         status = 'published',
         is_visible = true,
         updated_by = EXCLUDED.updated_by`,
      [h.slug, h.name_en, h.description_en, h.city, h.state, h.address_en, h.campus_highlight_en, h.wait_info_en, h.features_en, userId],
    );
  }

  await client.query(
    `INSERT INTO faqs (question_en, answer_en, category, is_published, created_by)
     VALUES ('What does AayuYukthi do?','We coordinate hospital journeys: appointments, pickup, and updates.','general',true,$1)
     ON CONFLICT DO NOTHING`,
    [userId],
  );
  for (const [key, title, body, icon] of [
    ['about.story', 'Our story', 'AayuYukthi began with a simple observation: hospital visits are hard to navigate alone. We coordinate the journey so families can focus on care.', null],
    ['about.mission', 'Our mission', 'Reliable, human support for every hospital journey.', null],
    ['about.vision', 'Our vision', 'A future where no one faces a hospital visit without support.', null],
    ['about.values', 'Our values', 'Trust, care, reliability, and accessibility in everything we do.', null],
    ['about.hero.badge', 'Founding Purpose', 'OUR FOUNDING PURPOSE • HUMAN-CENTERED ADVOCACY', 'verified'],
    ['about.hero.title', 'Hero Title', 'Making hospital journeys easier, dignified, and stress-free.', null],
    ['about.hero.description', 'Hero Description', 'AayuYukthi was born from a fundamental realization: navigating premier hospitals when unwell or caring for elderly loved ones is emotionally exhausting. We bridge the gap between home doorstep and clinical care with dedicated, empathetic companions.', null],
    // Metrics are value props, not fabricated statistics — no invented counts,
    // SLAs, or satisfaction scores (backend-audit content policy).
    ['about.metric1.value', 'Metric 1 Value', '1:1', null],
    ['about.metric1.label', 'Metric 1 Label', 'Companion Support', null],
    ['about.metric1.sub', 'Metric 1 Subtitle', 'One dedicated companion for the whole visit', null],
    ['about.metric2.value', 'Metric 2 Value', 'Door-to-gate', null],
    ['about.metric2.label', 'Metric 2 Label', 'Coverage', null],
    ['about.metric2.sub', 'Metric 2 Subtitle', 'From your doorstep to the hospital exit', null],
    ['about.metric3.value', 'Metric 3 Value', 'Upfront', null],
    ['about.metric3.label', 'Metric 3 Label', 'Pricing', null],
    ['about.metric3.sub', 'Metric 3 Subtitle', 'Confirmed before anything is booked — no hidden charges', null],
    ['about.metric4.value', 'Metric 4 Value', 'Live', null],
    ['about.metric4.label', 'Metric 4 Label', 'Family Updates', null],
    ['about.metric4.sub', 'Metric 4 Subtitle', 'Visit progress shared with your family as it happens', null],
    ['about.story.badge', 'Story Badge', 'Origin Narrative', null],
    ['about.story.title', 'Story Title', 'The Unseen Burden of Hospital Corridors', null],
    ['about.story.quote', 'Founder Quote', '“Hospitals heal illness, but navigating them should not create fresh illness. We envisioned an empathetic buffer—a calm, capable companion standing between vulnerable patients and operational friction.”', 'format_quote'],
    ['about.story.quote_author', 'Quote Author', 'The AayuYukthi care team', null],
    ['about.story.quote_role', 'Quote Author Role', '', null],
    ['about.val1.title', 'Value 1 Title', '1. Unconditional Care', 'favorite'],
    ['about.val1.body', 'Value 1 Description', 'Empathy is present in every touchpoint—holding hands through noisy corridors, offering calm words during test delays, and treating seniors with familial reverence.', null],
    ['about.val2.title', 'Value 2 Title', '2. Absolute Trust', 'verified_user'],
    ['about.val2.body', 'Value 2 Description', 'Non-commissioned advocates: our loyalties remain exclusively with the patient, never swayed by third-party agendas.', null],
    ['about.val3.title', 'Value 3 Title', '3. Punctual Reliability', 'alarm_on'],
    ['about.val3.body', 'Value 3 Description', 'We plan arrivals with buffer time so tired patients are never kept waiting unattended in a lobby.', null],
    ['about.val4.title', 'Value 4 Title', '4. Dignified Respect', 'accessibility_new'],
    ['about.val4.body', 'Value 4 Description', 'Empowering patient autonomy, preserving personal privacy during doctor examinations, and never treating elderly individuals like helpless dependents.', null],
    ['about.val5.title', 'Value 5 Title', '5. Universal Accessibility', 'translate'],
    ['about.val5.body', 'Value 5 Description', 'Native multilingual companion matching across English, Telugu, Hindi, Kannada, and Tamil to ensure total comfort without communication gaps.', null],
    ['about.val6.title', 'Value 6 Title', '6. Strict Responsibility', 'receipt_long'],
    ['about.val6.body', 'Value 6 Description', 'Clear, transparent hourly pricing. Absolute zero kickbacks or referral fees from laboratories, diagnostic centres, or pharmaceutical shops.', null],
    ['about.cta.badge', 'CTA Badge', 'WE ARE HERE TO HELP', 'support_agent'],
    ['about.cta.title', 'CTA Title', 'Experience peaceful healthcare accompaniment.', null],
    ['about.cta.body', 'CTA Description', 'Book a dedicated care companion for your parents or loved ones — same-day and scheduled visits available.', null],
    ['about.cta.disclaimer', 'CTA Disclaimer', 'Mandatory Non-Clinical Notice: AayuYukthi provides care coordination, logistical assistance, and patient advocacy. We are not a hospital, clinical medical provider, or emergency service. All medical choices, diagnosis, and treatment protocols remain strictly between licensed doctors and the patient.', null],
    // Profile Page CMS Blocks
    ['profile.header.badge', 'Account Badge', 'Family Caregiver Account Admin', 'verified_user'],
    ['profile.header.network', 'Care Network Hub', '', 'domain'],
    ['profile.health.status', 'Account Health Status', 'Active account', 'check_circle'],
    ['profile.stats.punctuality', 'Punctuality Score', 'On-time planning', 'avg_pace'],
    ['profile.stats.billing', 'Billing Balance', '₹0 Pending', 'account_balance_wallet'],
    ['profile.banner.policy', 'Zero Advance Policy Title', 'Zero Advance Deposit Policy', 'handshake'],
    ['profile.banner.policy_sub', 'Policy Description', 'Pay only after the visit is completed — charges are not triggered before you are home.', null],
    ['profile.emergency.notice', 'Escalation Notice', 'This contact receives visit status updates and can be reached if we are unable to reach you during the visit.', 'info'],
    ['profile.coordinator.name', 'Designated Coordinator Name', '', 'verified'],
    ['profile.coordinator.role', 'Coordinator Specialization', 'Hospital accompaniment coordinator', null],
    ['profile.coordinator.rating', 'Coordinator Rating & Escorts', '', null],
    ['profile.coordinator.bio', 'Coordinator Bio', 'Your coordinator is introduced to you before each visit, together with their staff identity.', null],
    ['profile.coordinator.phone', 'Coordinator Helpline Phone', '', 'call'],
    ['profile.trust.title', 'Trust Protocol Title', 'AayuYukthi Trust Protocol', 'verified_user'],
    ['profile.trust.body', 'Trust Protocol Description', 'Coordinators carry a staff identity card you can verify before the visit begins, and your visit details are shared only with the coordinator assigned to you.', null],
    ['profile.privacy.disclaimer', 'Data Governance', 'We handle your personal data under India\'s Digital Personal Data Protection Act, 2023. See our Privacy Policy.', 'privacy_tip'],
    ['home.disclaimer', '', 'AayuYukthi provides care coordination & accompaniment. We are not a hospital or emergency service.', null],
    ['home.eyebrow', '', 'CARE THAT COMES CLOSER', null],
    ['home.hero.title', '', 'Support through every hospital journey.', null],
    ['home.hero.description', '', 'AayuYukthi helps you coordinate hospital visits, appointments, and care-related logistics with ease, dignity, and zero stress for your loved ones.', null],
    ['home.hero.primary_label', '', 'Request Care', null],
    ['home.hero.primary_url', '', '/request-care', null],
    ['home.hero.secondary_label', '', 'Explore Services', null],
    ['home.hero.secondary_url', '', '/services', null],
    ['home.journey.label', '', 'Journey Steps', null],
    ['home.trust.1', 'Care Coordination', 'Dedicated personal companions for entire outpatient or diagnostic visits.', 'person_pin_circle'],
    ['home.trust.2', 'Reliable Support', 'Empathetic coordinators who treat your family with dignity and care.', 'verified_user'],
    ['home.trust.3', 'Hospital Navigation', 'Fast-track queues, paperwork handling, pharmacy pick-up, and billing support.', 'local_hospital'],
    ['home.trust.4', 'Family-Centered Care', 'Real-time status notifications sent directly to family members.', 'family_restroom'],
    ['home.how.eyebrow', '', 'Effortless Workflow', null],
    ['home.how.title', '', 'How AayuYukthi works', null],
    ['home.how.sub', '', 'A simple journey to peaceful, dignified medical visits.', null],
    ['home.how.1', 'Tell us what you need', 'Share appointment details, hospital choice, and assistance level.', 'chat'],
    ['home.how.2', 'Select recipient & transit', 'Specify for self, parents, or relatives. Add wheelchair transit.', 'accessible'],
    ['home.how.3', 'Coordinator assigned', 'A care companion confirms logistics and meets you at the entrance.', 'badge'],
    ['home.how.4', 'Real-time family updates', 'Live milestone tracking: arrival, consult, prescriptions, next steps.', 'notifications_active'],
    ['home.how.5', 'Journey completed', 'Safe drop-off, organized prescriptions, and full visit handover.', 'check_circle'],
    ['home.services.eyebrow', '', 'Empathetic Assistance', null],
    ['home.services.title', '', 'Support when you need it.', null],
    ['home.services.sub', '', 'Flexible packages engineered around patient comfort and family relief.', null],
    ['home.hospitals.eyebrow', '', 'Partner Ecosystem', null],
    ['home.hospitals.title', '', 'Hospitals we support', null],
    ['home.hospitals.sub', '', 'Seamless on-ground coordination across accredited medical centers.', null],
    ['home.pillars.eyebrow', '', 'The Human Touch', null],
    ['home.pillars.title', '', 'Why Families Choose AayuYukthi', null],
    ['home.pillars.sub', '', 'We take away the logistical burden so you can focus on your family.', null],
    ['home.pillars.1', 'Zero Visit Anxiety', 'Navigating hospital towers, billing counters, and medicine lines is handled by trained staff.', 'psychology_alt'],
    ['home.pillars.2', 'Empathetic Caregivers', 'Companions chosen for emotional intelligence, offering bedside comfort and dignity.', 'volunteer_activism'],
    ['home.pillars.3', 'Family Visibility', 'Timely updates at every milestone, wherever in the world you are.', 'devices'],
    ['home.pillars.4', 'Transparent Pricing', 'Clear packages with zero surprise fees. Know upfront what assistance includes.', 'price_check'],
    ['home.testimonials.eyebrow', '', 'Real Stories', null],
    ['home.testimonials.title', '', 'Peace of mind for families everywhere', null],
    ['home.faq.eyebrow', '', 'Got Questions?', null],
    ['home.faq.title', '', 'Frequently Asked Questions', null],
    ['home.cta.eyebrow', '', 'Start Your Journey', null],
    ['home.cta.title', '', 'Need support with your next hospital visit?', null],
    ['home.cta.body', '', 'Tell us what you need and let AayuYukthi coordinate your journey from doorstep to discharge.', null],
    ['home.cta.primary_label', '', 'Request Care Now', null],
    ['home.cta.primary_url', '', '/request-care', null],
    ['home.cta.secondary_label', '', 'Contact Us', null],
    ['home.cta.secondary_url', '', '/contact', null],
    // Services Page CMS Blocks
    ['services.hero.eyebrow', '', 'Our Care Offerings', null],
    ['services.hero.badge', '', 'Care companions for every stage of your hospital journey', null],
    ['services.hero.title', '', 'Support designed around your hospital journey.', null],
    ['services.hero.body', '', 'Thoughtfully coordinated on-ground assistance, logistics, and compassionate accompaniment across every stage of outpatient and hospital care.', null],
    ['services.hero.bento_title', 'Planned Arrivals', 'Coordinators reach ahead of your appointment slot', 'health_and_safety'],
    ['services.hero.bento_coverage', 'Coverage', 'Listed on our Hospitals page', null],
    ['services.pillar.1', 'Companions You Can Depend On', 'Companions are trained in hospital navigation, patient etiquette, and elderly support, and are introduced to you with their staff identity before the visit begins.', 'verified_user'],
    ['services.pillar.2', 'Visit Milestones to Your Family', 'Family members living in different cities receive timestamped status updates as the visit progresses — arrival, consultation, and prescriptions secured.', 'notifications_active'],
    ['services.pillar.3', 'Non-Clinical & Strictly Neutral', 'We do not accept commissions from labs or recommend specific surgical treatments. Our role is strictly neutral care coordination, advocacy, transit ease, and patient peace of mind.', 'balance'],
    ['services.inquiry.title', '', 'Have unique requirements or hospital scheduling questions?', null],
    ['services.inquiry.body', '', 'Speak directly with an AayuYukthi care counselor. We customize schedules, wheelchair logistics, multiday packages, and multilingual coordinator pairings.', null],
    // Hospitals Page CMS Blocks
    ['hospitals.hero.eyebrow', '', 'CARE LOCATIONS • WHERE WE OPERATE', null],
    ['hospitals.hero.title', '', 'Find hospitals supported by AayuYukthi.', null],
    ['hospitals.hero.body', '', 'Explore healthcare centers where our companions provide on-ground coordination and navigational relief.', null],
    ['hospitals.hero.pill_1', '', 'Companion Coordination Across Multi-Wing Campuses', 'verified'],
    ['hospitals.hero.pill_2', '', 'Care coordination & logistics service — independent of hospital administration', 'info'],
    ['hospitals.standards.eyebrow', '', 'How We Coordinate Inside Partner Campuses', null],
    ['hospitals.standards.title', '', 'Built for navigation ease inside complex hospitals.', null],
    ['hospitals.standards.body', '', 'AayuYukthi companions are trained in hospital layouts and patient advocacy, and work to reduce the time you lose in queues and paperwork.', null],
    ['hospitals.standard.1', 'Familiar with Complex Wings & Blocks', 'From basement imaging elevators to hydration chairs and calm waiting zones, our companions plan the quickest routes across multi-tower campuses.', 'map'],
    ['hospitals.standard.2', 'Desk & TPA Pre-Clearing', 'We handle physical queueing for OPD tokens, insurance documentation hand-offs, and pharmacy collection while you or your loved one rest comfortably in shaded seating.', 'receipt_long'],
    ['hospitals.standard.3', 'Strict Non-Affiliated Patient Advocacy', 'We are completely independent advocates focused solely on the patient’s convenience, physical comfort, and peace of mind. No medical bias, no institutional commissions.', 'shield_person'],
    ['hospitals.custom.badge', '', 'Coverage Beyond the List', 'travel_explore'],
    ['hospitals.custom.title', '', 'Visiting a hospital or clinic not listed here?', null],
    ['hospitals.custom.body', '', 'AayuYukthi companions can escort you to hospitals, standalone diagnostic labs, and specialty day-care centers beyond this list. Submit your center details and we will confirm whether we can cover your location and visit date.', null],
    ['hospitals.cta.title', '', 'Have an upcoming hospital consultation or admission?', 'support_agent'],
    ['hospitals.cta.body', '', 'Request a care companion for your visit. We can meet you at your doorstep or directly at the hospital gate.', null],
    // Customer Auth Page CMS Blocks (Login, Signup, OTP Verification)
    ['auth.login.badge', '', 'AayuYukthi Family Access • Secure Care Portal', 'verified_user'],
    ['auth.login.title', '', 'Your family’s trusted companion through every hospital visit.', null],
    ['auth.login.description', '', 'Access your active care requests, review hospital visit milestones in real time, and coordinate dedicated support for your parents or loved ones.', null],
    ['auth.login.feature_1', 'Live Milestone Tracking', 'Portal updates during arrival, consultation, diagnostics, and prescriptions — so you always know where the visit stands.', 'timeline'],
    ['auth.login.feature_2', 'Dedicated Companions', 'Empathetic coordinators offering bedside presence, wheelchair navigation, and patient advocacy.', 'badge'],
    ['auth.login.feature_3', 'Visit Details in One Place', 'Your requests, recipients, and visit details stay organized and accessible whenever you need them.', 'folder_special'],
    ['auth.login.testimonial_quote', '', '“Hospital visits are easier when someone is walking with you. We coordinate the visit and keep your family updated at every step.”', null],
    ['auth.login.testimonial_author', '', '— The AayuYukthi care desk', null],
    ['auth.login.testimonial_detail', '', '', null],
    ['auth.signup.badge', '', 'For Family Caregivers', 'verified_user'],
    ['auth.signup.title', '', 'You don\'t have to navigate hospital corridors alone.', null],
    ['auth.signup.description', '', 'Whether you are managing care from another city or balancing a demanding workday, AayuYukthi bridges the physical gap. Your parents are accompanied with dignity, gentleness, and clear real-time communication.', null],
    ['auth.signup.feature_1', 'Companions at the Gate', 'Coordinators meet your parents at the entry point you choose, with wheelchair assistance arranged in advance.', 'handshake'],
    ['auth.signup.feature_2', 'Milestone Updates', 'Clear status updates throughout the visit — arrival, consultation, and next steps.', 'notifications_active'],
    ['auth.signup.feature_3', 'Peace Across Distances', 'Full digital summaries, prescription pickups, and a safe escort back home.', 'family_restroom'],
    ['auth.signup.social_proof_title', '', 'Built for Family Caregivers', null],
    ['auth.signup.social_proof_cities', '', '', null],
    ['auth.signup.social_proof_quote', '', '', null],
    ['auth.otp.badge', '', 'Care Coordination', 'shield_with_heart'],
    ['auth.otp.title', '', 'Safeguarding your family’s healthcare journey.', null],
    ['auth.otp.description', '', 'We use two-factor verification to ensure medical schedules, care recipient details, and live hospital updates remain confidential.', null],
    ['auth.otp.feature_1', 'Instant Delivery', 'Passcode dispatched instantly to your registered email address via Resend.', 'mail'],
    ['auth.otp.feature_2', 'Dedicated Support Desk', 'Contact details for our care desk are listed on the Contact page.', 'headset_mic'],
    ['auth.otp.tip', '', 'Care coordinators will never ask for your 6-digit passcode over the phone, at hospital gates, or via unsecured links.', 'info'],
    ['auth.otp.coordinator_note', 'Assigned Care Coordinator', '', 'person'],
    ['auth.helpline.number', '', '', null],
    ['auth.helpline.tel', '', '', null],
    ['auth.compliance.ssl', '', 'Encrypted Connection (HTTPS)', 'lock'],
    ['auth.compliance.privacy', '', 'Privacy under India’s DPDP Act, 2023', 'gavel'],
    // Customer Portal & Requests CMS Blocks
    ['customer.requests.eyebrow', '', 'Care Requests & Service Logs', 'format_list_bulleted'],
    ['customer.requests.title', '', 'My Care Requests', null],
    ['customer.requests.description', '', 'Track upcoming hospital visits, monitor companion milestones, and revisit your request history.', null],
    ['customer.advisory.title', '', 'Need to change timing, recipient, or assistance?', 'verified_user'],
    ['customer.advisory.body', '', 'Contact us and we will confirm what can be adjusted before the visit.', null],
    ['customer.advisory.helpline', '', '', 'call'],
    ['customer.advisory.tel', '', '', null],
    ['customer.metro.active', '', '', 'location_on'],
    ['customer.status.online', '', '', 'sensors'],
    ['customer.emergency.badge', '', 'Emergency Notice', 'emergency'],
    ['customer.emergency.helpline', '', 'For medical emergencies, call 108 or 112', null],
    ['customer.emergency.desc', '', 'AayuYukthi is not an emergency service.', null],
    // Contact Page CMS Blocks — honest copy only: no invented stats, wait
    // times, hospital counts, or phone numbers. Real contact details live in
    // contact_settings (edited in CMS → Contact settings).
    ['contact.hero.eyebrow', '', 'CONTACT AAYUYUKTHI', null],
    ['contact.hero.title', '', 'How can we help?', null],
    ['contact.hero.subtitle', '', 'Call or message us about an upcoming hospital visit, accompaniment support, or recurring care planning. We will confirm what we can coordinate for you and what it will cost before anything is booked.', null],
    ['contact.hubs.eyebrow', '', 'Coverage', null],
    ['contact.hubs.title', '', 'Where we operate', null],
    ['contact.hubs.subtitle', '', 'We serve the cities listed on our Hospitals page. Contact us to confirm availability for your location and visit date.', null],
    ['contact.emergency.title', '', 'Important notice', null],
    ['contact.emergency.body', '', 'AayuYukthi is not an emergency response service, ambulance network, or hospital. For a life-threatening emergency, call 108 or 112 immediately, or go to the nearest hospital emergency room.', null],
  ]) {
    await client.query(
      `INSERT INTO content_blocks (key, title_en, body_en, status, icon, updated_by) VALUES ($1,$2,$3,'published',$4,$5)
       ON CONFLICT (key) DO UPDATE SET title_en = EXCLUDED.title_en, body_en = EXCLUDED.body_en, icon = EXCLUDED.icon, status = 'published'`,
      [key, title, body, icon, userId],
    );
  }
  for (const [title, desc, label, order] of [
    ['Preparing for the Visit', 'Document pre-check, transport scheduling, and timing verification.', 'Prep', 0],
    ['Accompanied Travel & Arrival', 'Doorstep greeting, assisted boarding, and curbside hospital reception.', 'Travel', 1],
    ['Registration & Navigation', 'Paperwork assistance, tokens, and clinic check-ins — no confusing queues.', 'Hospital Nav', 2],
    ['Bedside & Waiting Support', 'Attentive companionship during consultations, tests, and prescriptions.', 'Care Support', 3],
    ['Safe Return Home', 'Prescription collection, discharge clearance, and safe drop-off.', 'Return', 4],
  ]) {
    await client.query(
      `INSERT INTO hero_slides (title_en, description_en, short_label_en, primary_cta_label_en, primary_cta_url,
          secondary_cta_label_en, secondary_cta_url, sort_order, is_active, created_by)
       SELECT $1,$2,$3,'Request Care','/request-care','Explore Services','/services',$4,true,$5
       WHERE NOT EXISTS (SELECT 1 FROM hero_slides WHERE title_en = $1)`,
      [title, desc, label, order, userId],
    );
  }
  // Legal pages: served from CMS blocks (legal.privacy / legal.terms), never
  // hardcoded in the frontend. DO NOT overwrite operator edits on re-seed —
  // ON CONFLICT DO NOTHING only creates them once.
  for (const [key, title, body] of [
    ['legal.privacy', 'Privacy Policy', `
## Privacy Policy

AayuYukthi ("we", "us") provides care-coordination support for hospital visits. This policy explains what personal data we collect, why we use it, who we share it with, and the choices you have. It applies to our website, your account, and our operations platform.

## 1. Information we collect

- Account data: name, email address, phone number, preferred language, and your password (stored only as a salted, irreversible hash).
- Your unique portal ID (for example AY-7F3K9Q2Z), which identifies your account across the service.
- Care recipient details you choose to add: name, relationship to you, and date of birth.
- Visit information: hospital, service selected, appointment date and time, pickup details, and notes you provide when creating a request.
- Technical data: IP address, device and browser type, pages viewed, and event logs — used for security, abuse prevention, and reliability.
- Messages you send us through the contact form, support threads, or email.

## 2. How we use it

- To create your account and verify it with one-time passcodes sent to your phone or email.
- To deliver the coordination you ask for: assigning coordinators, arranging pickup, and sharing visit status with your family.
- To show you — and only you — your own requests, recipients, and notifications.
- To answer support and contact queries.
- To detect fraud, abuse, and attacks on the service.
- To meet legal and accounting obligations.

We do not sell your personal data. We do not use health-related information for advertising.

## 3. Consent and your choices

You consent to these uses when you create an account or submit a request. You may withdraw consent at any time by contacting us (details below); this may limit the services we can provide. Information about children or persons with disabilities is collected only with the consent of a parent or lawful guardian. The service is not intended for use by anyone under 18 acting alone.

## 4. Who we share it with

- Coordinators and partner staff delivering the visit you booked — only the details they need to deliver it.
- Service providers that host our database, serve images, send transactional email, and process payments (if any), each bound by their own confidentiality and security obligations.
- Authorities, only when disclosure is required by law or to protect someone's safety.

## 5. Retention and deletion

Account data is kept while your account is active. Request and payment records are kept for a reasonable period afterwards to meet accounting and legal requirements. You may request deletion of your account and personal data at any time; we will honour the request unless the law requires us to retain specific records.

## 6. Security

All traffic is encrypted in transit (HTTPS). Access to personal data inside our operations platform is restricted by role; your records are visible to your own account and to operations staff who need them to deliver your request. We log and actively monitor suspicious activity — attempted attacks are recorded and escalated to our administrators.

## 7. Cookies and local storage

We use strictly necessary storage only: session tokens that keep you signed in, and your language preference. There are no advertising or cross-site tracking cookies.

## 8. Your rights

You may request a copy of your data, correct inaccurate data, withdraw consent, or delete your account by writing to the contact below. We respond within 30 days.

## 9. Grievance contact

If you have a concern about how your data is handled, write to us using the contact details on our Contact page. Unresolved concerns may be raised with the competent data protection authority under the Digital Personal Data Protection Act, 2023.

## 10. Changes to this policy

We will post material changes to this page and, for significant changes, notify you inside your account.
`],
    ['legal.terms', 'Terms & Conditions', `
## Terms & Conditions

## 1. About the service

AayuYukthi provides non-clinical coordination and accompaniment for hospital visits: appointment and paperwork support, navigation inside hospitals, pickup and drop assistance, and status updates for families. We are not a hospital, clinic, doctor, nurse, ambulance, or emergency service. Nothing on this website is medical advice, and no doctor-patient relationship is created by using the service.

## 2. Eligibility

You must be 18 or older to create an account. You may create requests for family members you care for, and you confirm that you are permitted to share the information you enter about them.

## 3. Your account and portal ID

Your account carries a unique portal ID (for example AY-7F3K9Q2Z) used to identify you across the service. Keep your login credentials confidential — you are responsible for activity under your account. Tell us immediately if you believe your account has been compromised.

## 4. Requests, pricing, and payment

The price for a service is shown to you before a request is confirmed. Hospital bills, medicines, tests, parking, tolls, and other third-party charges are separate from our service fee unless explicitly stated. We do not mark up hospital bills.

## 5. Cancellation and refunds

Cancellation windows and any applicable cancellation fee are shown before you confirm a request. If we cancel or cannot fulfil a confirmed request, you receive a full refund of the service fee. Approved refunds are processed to the original payment method within 7–10 working days.

## 6. Your responsibilities

Provide accurate information, be available at the agreed time, and follow hospital rules and instructions from hospital staff. Our companions are not medical professionals: they do not give medical advice, administer medication, or perform clinical acts. You remain responsible for all medical decisions, which must be made with your treating doctors.

## 7. Conduct

Treat our staff and hospital staff with respect. Harassment, abuse, or unlawful requests are grounds for immediate suspension without refund.

## 8. Liability

To the maximum extent permitted by law, our liability for any claim arising out of a visit is limited to the service fee you paid for that visit. We are not liable for indirect or consequential loss, for the acts or omissions of hospitals or other third parties, or for events outside our reasonable control (natural disasters, government orders, strikes).

## 9. Intellectual property

The website, logo, design, and written content belong to AayuYukthi. You may not reproduce them for commercial purposes without written permission.

## 10. Privacy

Our Privacy Policy explains how we handle your personal data and forms part of these terms.

## 11. Suspension and termination

We may suspend or terminate accounts that violate these terms, provide false information, or create safety risks, with notice where reasonably practicable.

## 12. Governing law

These terms are governed by the laws of India. Disputes fall to the courts of competent jurisdiction at our registered place of business.

## 13. Changes to these terms

We may update these terms; the current version always appears on this page. Continued use after changes means you accept them.

## 14. Contact

Questions about these terms can be sent to us using the details on our Contact page.
`],
  ]) {
    await client.query(
      `INSERT INTO content_blocks (key, title_en, body_en, status, updated_by) VALUES ($1,$2,$3,'published',$4)
       ON CONFLICT (key) DO NOTHING`,
      [key, title, body, userId],
    );
  }

  // Contact details: only fill values the operator has not set, and only with
  // clearly-marked placeholders — never fabricate live contact info on a
  // shared database. Replace via CMS → Contact settings after seeding.
  await client.query(
    `UPDATE contact_settings SET phone=COALESCE(phone, '+91-XXXXXXXXXXX'), email=COALESCE(email, 'hello@your-domain.example'),
       address_en=COALESCE(address_en, 'Set your address in CMS'), hours_en=COALESCE(hours_en, 'Set your hours in CMS'), updated_by=$1
     WHERE id=1`,
    [userId],
  );

  console.log('seed: ok — ops login ops@aayuyukthi.local / ChangeMe123! | Bhimavaram hospitals initialized');
} finally {
  await client.end();
}

import { useState } from 'react';
import { track } from './analytics.js';

const STRINGS = {
  en: {
    brand: 'AayuYukthi',
    tagline: 'Hospital journey support & care coordination',
    nav: { how: 'How It Works', services: 'Services', hospitals: 'Hospitals', about: 'About', contact: 'Contact' },
    navHome: 'Home',
    requestCare: 'Request Care',
    loading: 'Loading…',
    tryAgain: 'Try again',
    loadError: 'Something went wrong while loading. Please try again.',
    emptyServices: 'No services are published yet. Please check back soon.',
    emptyHospitals: 'No hospitals match your search.',
    emptyFaqs: 'No questions yet.',
    back: 'Back',
    search: 'Search',
    searchPlaceholder: 'Search by name…',
    cityPlaceholder: 'City…',
    allCities: 'All cities',
    learnMore: 'Learn more',
    viewDetails: 'View details',
    ourServices: 'Our services',
    ourHospitals: 'Partner hospitals',
    faqsTitle: 'Frequently asked questions',
    testimonialsTitle: 'Stories from families',
    finalCtaTitle: 'Need support for a hospital visit?',
    finalCtaText: 'Tell us what you need — we coordinate the rest.',
    contactTitle: 'Contact us',
    contactName: 'Your name',
    contactEmail: 'Email',
    contactPhone: 'Phone (+91…)',
    contactSubject: 'Subject',
    contactMessage: 'How can we help?',
    contactSend: 'Send message',
    contactSending: 'Sending…',
    contactSuccess: 'Thank you. We received your message and will respond soon.',
    aboutTitle: 'About AayuYukthi',
    howTitle: 'How it works',
    footerTagline: 'Support and coordination for hospital journeys.',
    footerTrust: 'Verified companions & logistics',
    footerQuick: 'Quick Links',
    footerCare: 'Care Support',
    footerContact: 'Contact & Help',
    footerLegal: 'Care coordination services. Not an emergency medical service or hospital.',
    rights: 'All rights reserved.',
    login: 'Log in',
    signup: 'Sign up',
    myAccount: 'My account',
    logout: 'Logout',
    dashboard: 'Dashboard',
    myRequests: 'My Requests',
    recipients: 'Recipients',
    profile: 'Profile',
    notifications: 'Notifications',
    support: 'Support',
    requestReceived: 'Request received',
  },
  te: {
    brand: 'ఆయుయుక్తి',
    tagline: 'ఆసుపత్రి ప్రయాణ మద్దతు & సంరక్షణ సమన్వయం',
    nav: { how: 'ఎలా పనిచేస్తుంది', services: 'సేవలు', hospitals: 'ఆసుపత్రులు', about: 'మా గురించి', contact: 'సంప్రదించండి' },
    navHome: 'హోమ్',
    requestCare: 'సంరక్షణ కోరండి',
    loading: 'లోడ్ అవుతోంది…',
    tryAgain: 'మళ్లీ ప్రయత్నించండి',
    loadError: 'లోడ్ చేయడంలో సమస్య వచ్చింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    emptyServices: 'ప్రస్తుతం సేవలు అందుబాటులో లేవు. త్వరలో మళ్లీ చూడండి.',
    emptyHospitals: 'మీ శోధనకు ఆసుపత్రులు కనిపించలేదు.',
    emptyFaqs: 'ప్రశ్నలు ఇంకా లేవు.',
    back: 'వెనుకకు',
    search: 'వెతకండి',
    searchPlaceholder: 'పేరుతో వెతకండి…',
    cityPlaceholder: 'నగరం…',
    allCities: 'అన్ని నగరాలు',
    learnMore: 'మరింత తెలుసుకోండి',
    viewDetails: 'వివరాలు చూడండి',
    ourServices: 'మా సేవలు',
    ourHospitals: 'భాగస్వామి ఆసుపత్రులు',
    faqsTitle: 'తరచుగా అడిగే ప్రశ్నలు',
    testimonialsTitle: 'కుటుంబాల అనుభవాలు',
    finalCtaTitle: 'ఆసుపత్రి సందర్శనకు మద్దతు కావాలా?',
    finalCtaText: 'మీకు ఏమి కావాలో చెప్పండి — మిగతాది మేము సమన్వయం చేస్తాము.',
    contactTitle: 'మమ్మల్ని సంప్రదించండి',
    contactName: 'మీ పేరు',
    contactEmail: 'ఈమెయిల్',
    contactPhone: 'ఫోన్ (+91…)',
    contactSubject: 'విషయం',
    contactMessage: 'మేము ఎలా సహాయపడగలము?',
    contactSend: 'సందేశం పంపండి',
    contactSending: 'పంపుతోంది…',
    contactSuccess: 'ధన్యవాదాలు. మీ సందేశం అందింది, త్వరలో స్పందిస్తాము.',
    aboutTitle: 'ఆయుయుక్తి గురించి',
    howTitle: 'ఎలా పనిచేస్తుంది',
    footerTagline: 'ఆసుపత్రి ప్రయాణాలకు మద్దతు మరియు సమన్వయం.',
    footerTrust: 'ధృవీకరించబడిన సహచరులు & లాజిస్టిక్స్',
    footerQuick: 'త్వరిత లింకులు',
    footerCare: 'సంరక్షణ మద్దతు',
    footerContact: 'సంప్రదింపులు & సహాయం',
    footerLegal: 'సంరక్షణ సమన్వయ సేవలు. అత్యవసర వైద్య సేవ లేదా ఆసుపత్రి కాదు.',
    rights: 'అన్ని హక్కులు ప్రత్యేకించబడ్డాయి.',
    login: 'లాగిన్',
    signup: 'ఖాతా తెరవండి',
    myAccount: 'నా ఖాతా',
    logout: 'లాగ్అవుట్',
    dashboard: 'డాష్‌బోర్డ్',
    myRequests: 'నా అభ్యర్థనలు',
    recipients: 'సంరక్షణ పొందేవారు',
    profile: 'ప్రొఫైల్',
    notifications: 'నోటిఫికేషన్లు',
    support: 'సహాయం',
    requestReceived: 'అభ్యర్థన అందింది',
  },
};

export function LanguageSelector({ locale, onChange }) {
  return (
    <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <span className="badge" style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary-dark)' }}>
        {locale === 'te' ? 'తెలుగు' : 'EN'}
      </span>
      <select
        className="select"
        style={{ width: 'auto' }}
        aria-label="Language"
        value={locale}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="en">English</option>
        <option value="te">తెలుగు</option>
      </select>
    </label>
  );
}

export function useLocale() {
  const [locale, setLocale] = useState(() => {
    try {
      return localStorage.getItem('ay-locale') ?? 'en';
    } catch {
      return 'en';
    }
  });
  const change = (l) => {
    setLocale(l);
    try {
      localStorage.setItem('ay-locale', l);
    } catch {
      /* private mode — locale simply won't persist */
    }
    if (typeof document !== 'undefined') document.body.dataset.locale = l;
    track('LANGUAGE_CHANGED', { to: l });
  };
  if (typeof document !== 'undefined' && !document.body.dataset.locale) document.body.dataset.locale = locale;
  return { locale, setLocale: change, t: STRINGS[locale] ?? STRINGS.en };
}

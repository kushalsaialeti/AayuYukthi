import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useLocale } from './i18n.jsx';
import { api } from './api.js';
import { usePageView } from './components/layout.jsx';
import { Header as PubHeader } from './components/public/Header.jsx';
import { Footer as PubFooter } from './components/public/Footer.jsx';
import { SecurityPopup } from './components/SecurityPopup.jsx';
import { CustomerAuthProvider, RequireCustomer, useCustomerAuth } from './auth.jsx';
import { useScrollRestoration } from './hooks/useScrollRestoration.js';

// Route-level code splitting: every page is lazily loaded so a visitor only
// downloads the chunks for the page they are on (Vite splits per dynamic
// import; the shell + shared components stay in the entry chunk).
const lazyNamed = (loader) => React.lazy(loader);
const Signup = lazyNamed(() => import('./pages/Auth.jsx').then((m) => ({ default: m.Signup })));
const Login = lazyNamed(() => import('./pages/Auth.jsx').then((m) => ({ default: m.Login })));
const VerifyOtpPage = lazyNamed(() => import('./pages/Auth.jsx').then((m) => ({ default: m.VerifyOtpPage })));
const CustomerLayout = lazyNamed(() => import('./pages/Customer.jsx').then((m) => ({ default: m.CustomerLayout })));
const CustomerDashboard = lazyNamed(() => import('./pages/Customer.jsx').then((m) => ({ default: m.CustomerDashboard })));
const Onboarding = lazyNamed(() => import('./pages/Onboarding.jsx').then((m) => ({ default: m.Onboarding })));
const OnboardingSuccess = lazyNamed(() => import('./pages/Onboarding.jsx').then((m) => ({ default: m.OnboardingSuccess })));
const RecipientsPage = lazyNamed(() => import('./pages/Onboarding.jsx').then((m) => ({ default: m.RecipientsPage })));
const ProfilePage = lazyNamed(() => import('./pages/ProfilePage.jsx').then((m) => ({ default: m.ProfilePage })));
const RequestCare = lazyNamed(() => import('./pages/RequestCare.jsx').then((m) => ({ default: m.RequestCare })));
const CareRequestConfirmation = lazyNamed(() => import('./pages/CareRequestConfirmation.jsx').then((m) => ({ default: m.CareRequestConfirmation })));
const MyRequests = lazyNamed(() => import('./pages/MyRequests.jsx').then((m) => ({ default: m.MyRequests })));
const RequestDetail = lazyNamed(() => import('./pages/RequestDetail.jsx').then((m) => ({ default: m.RequestDetail })));
const NotificationsPage = lazyNamed(() => import('./pages/Support.jsx').then((m) => ({ default: m.NotificationsPage })));
const SupportList = lazyNamed(() => import('./pages/Support.jsx').then((m) => ({ default: m.SupportList })));
const SupportNew = lazyNamed(() => import('./pages/Support.jsx').then((m) => ({ default: m.SupportNew })));
const SupportThread = lazyNamed(() => import('./pages/Support.jsx').then((m) => ({ default: m.SupportThread })));
const Home = lazyNamed(() => import('./pages/Home.jsx').then((m) => ({ default: m.Home })));
const HowItWorks = lazyNamed(() => import('./pages/HowItWorks.jsx').then((m) => ({ default: m.HowItWorks })));
const Services = lazyNamed(() => import('./pages/Services.jsx').then((m) => ({ default: m.Services })));
const ServiceDetail = lazyNamed(() => import('./pages/Services.jsx').then((m) => ({ default: m.ServiceDetail })));
const Hospitals = lazyNamed(() => import('./pages/Hospitals.jsx').then((m) => ({ default: m.Hospitals })));
const HospitalDetail = lazyNamed(() => import('./pages/Hospitals.jsx').then((m) => ({ default: m.HospitalDetail })));
const About = lazyNamed(() => import('./pages/About.jsx').then((m) => ({ default: m.About })));
const Contact = lazyNamed(() => import('./pages/Contact.jsx').then((m) => ({ default: m.Contact })));
const Legal = lazyNamed(() => import('./pages/Legal.jsx').then((m) => ({ default: m.Legal })));

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: 24 }}>
          <h1>Something went wrong.</h1>
          <p>Please reload and try again.</p>
          <button className="btn btn-secondary" onClick={() => this.setState({ error: null })}>Try again</button>
        </main>
      );
    }
    return this.props.children;
  }
}

// Chunk-loading placeholder shown while the route's code downloads.
function RouteFallback() {
  return (
    <div className="container" style={{ padding: '64px 16px', textAlign: 'center' }} role="status" aria-live="polite">
      <div className="skeleton" style={{ height: 20, width: 260, margin: '0 auto 12px' }} aria-hidden="true" />
      <div className="skeleton" style={{ height: 14, width: 180, margin: '0 auto' }} aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// Public shell: themed (.pub) header + footer around marketing pages.
// Customer auth/app keeps the core token system (Navbar/CustomerLayout).
const PUBLIC_PREFIXES = ['/', '/how-it-works', '/services', '/hospitals', '/about', '/contact', '/request-care', '/privacy', '/terms'];
const AUTH_PREFIXES = ['/login', '/signup', '/verify-otp'];

function isPublicPath(pathname) {
  return PUBLIC_PREFIXES.some((p) => (p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(`${p}/`)));
}

function isAuthPath(pathname) {
  return AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function Shell() {
  const { locale, setLocale, t } = useLocale();
  const { user } = useCustomerAuth();
  const [contact, setContact] = useState(null);
  const location = useLocation();
  usePageView();
  useScrollRestoration();

  // Contact details are only rendered by the public shell — fetching them on
  // auth/app routes was a wasted request (audit finding).
  const needsContact = isPublicPath(location.pathname);
  useEffect(() => {
    if (!needsContact) return undefined;
    let alive = true;
    api.contactInfo().then((c) => { if (alive) setContact(c); }).catch(() => {});
    return () => { alive = false; };
  }, [needsContact]);

  if (isAuthPath(location.pathname)) {
    return <AppRoutes t={t} locale={locale} contact={contact} />;
  }

  // Public marketing & landing routes (/ , /how-it-works, /services, /hospitals, /request-care, etc.):
  // Allows visitors and logged-in users to experience the care-request funnel directly.
  if (isPublicPath(location.pathname)) {
    return (
      <div className="pub">
        <PubHeader t={t} locale={locale} setLocale={setLocale} user={user} />
        <main className="pub-main">
          <React.Suspense fallback={<RouteFallback />}>
            <PublicRoutes t={t} locale={locale} setLocale={setLocale} user={user} contact={contact} />
          </React.Suspense>
        </main>
        <PubFooter t={t} contact={contact} />
      </div>
    );
  }

  // Authenticated customer portal routes (/app, /app/*, /onboarding):
  // Rendered cleanly with CustomerLayout (no redundant global navbars).
  return <AppRoutes t={t} locale={locale} contact={contact} />;
}

function PublicRoutes({ t, locale, setLocale, user, contact }) {
  return (
    <Routes>
      <Route path="/" element={<Home t={t} locale={locale} setLocale={setLocale} user={user} />} />
      <Route path="/how-it-works" element={<HowItWorks t={t} />} />
      <Route path="/services" element={<Services t={t} locale={locale} />} />
      <Route path="/services/:slug" element={<ServiceDetail t={t} locale={locale} />} />
      <Route path="/hospitals" element={<Hospitals t={t} locale={locale} />} />
      <Route path="/hospitals/:slug" element={<HospitalDetail t={t} locale={locale} />} />
      <Route path="/request-care" element={<RequestCare locale={locale} />} />
      <Route path="/request-care/confirmed/:id" element={<CareRequestConfirmation />} />
      <Route path="/request-care/receipt/:id" element={<CareRequestConfirmation />} />
      <Route path="/about" element={<About t={t} locale={locale} />} />
      <Route path="/contact" element={<Contact t={t} contact={contact} />} />
      <Route path="/privacy" element={<Legal kind="privacy" t={t} />} />
      <Route path="/terms" element={<Legal kind="terms" t={t} />} />
      <Route path="*" element={<div className="pub-container" style={{ padding: '48px 0' }}><h1>404</h1><p>Page not found.</p></div>} />
    </Routes>
  );
}

function AppRoutes({ t, locale, contact }) {
  void contact;
  return (
    <React.Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/signup" element={<Signup t={t} />} />
        <Route path="/login" element={<Login t={t} />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route element={<RequireCustomer />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/onboarding/success" element={<OnboardingSuccess />} />
          <Route element={<CustomerLayout />}>
            <Route path="/app" element={<CustomerDashboard />} />
            <Route path="/request-care" element={<RequestCare locale={locale} />} />
            <Route path="/app/request-care" element={<RequestCare locale={locale} />} />
            <Route path="/request-care/confirmed/:id" element={<CareRequestConfirmation />} />
            <Route path="/request-care/receipt/:id" element={<CareRequestConfirmation />} />
            <Route path="/app/requests/:id/receipt" element={<CareRequestConfirmation />} />
            <Route path="/app/requests/:id/confirmed" element={<CareRequestConfirmation />} />
            <Route path="/app/recipients" element={<RecipientsPage />} />
            <Route path="/app/recipients/new" element={<RecipientsPage forceNew />} />
            <Route path="/recipients" element={<Navigate to="/app/recipients" replace />} />
            <Route path="/care-recipients" element={<Navigate to="/app/recipients" replace />} />
            <Route path="/app/profile" element={<ProfilePage />} />
            <Route path="/app/requests" element={<MyRequests />} />
            <Route path="/app/requests/:id" element={<RequestDetail />} />
            <Route path="/app/notifications" element={<NotificationsPage />} />
            <Route path="/app/support" element={<SupportList />} />
            <Route path="/app/support/new" element={<SupportNew />} />
            <Route path="/app/support/:id" element={<SupportThread />} />
          </Route>
        </Route>
        <Route path="*" element={<div className="container" style={{ padding: '48px 16px' }}><h1>404</h1><p className="muted">Page not found.</p></div>} />
      </Routes>
    </React.Suspense>
  );
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CustomerAuthProvider>
        <Shell />
        <SecurityPopup />
      </CustomerAuthProvider>
    </BrowserRouter>
  );
}

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useLocale } from './i18n.jsx';
import { api } from './api.js';
import { Navbar, Footer, usePageView } from './components/layout.jsx';
import { Header as PubHeader } from './components/public/Header.jsx';
import { Footer as PubFooter } from './components/public/Footer.jsx';
import { CustomerAuthProvider, RequireCustomer, useCustomerAuth } from './auth.jsx';
import { Signup, Login, VerifyOtpPage } from './pages/Auth.jsx';
import { CustomerLayout, CustomerDashboard } from './pages/Customer.jsx';
import { Onboarding, OnboardingSuccess, RecipientsPage } from './pages/Onboarding.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { RequestCare } from './pages/RequestCare.jsx';
import { MyRequests } from './pages/MyRequests.jsx';
import { RequestDetail } from './pages/RequestDetail.jsx';
import { NotificationsPage, SupportList, SupportNew, SupportThread } from './pages/Support.jsx';
import { Home } from './pages/Home.jsx';
import { HowItWorks } from './pages/HowItWorks.jsx';
import { Services, ServiceDetail } from './pages/Services.jsx';
import { Hospitals, HospitalDetail } from './pages/Hospitals.jsx';
import { About } from './pages/About.jsx';
import { Contact } from './pages/Contact.jsx';
import { useScrollRestoration } from './hooks/useScrollRestoration.js';

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

// Public shell: themed (.pub) header + footer around marketing pages.
// Customer auth/app keeps the core token system (Navbar/CustomerLayout).
const PUBLIC_PREFIXES = ['/', '/how-it-works', '/services', '/hospitals', '/about', '/contact', '/request-care'];
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

  useEffect(() => {
    api.contactInfo().then(setContact).catch(() => {});
  }, []);

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
          <PublicRoutes t={t} locale={locale} contact={contact} />
        </main>
        <PubFooter t={t} contact={contact} />
      </div>
    );
  }

  // Authenticated customer portal routes (/app, /app/*, /onboarding):
  // Rendered cleanly with CustomerLayout (no redundant global navbars).
  return <AppRoutes t={t} locale={locale} contact={contact} />;
}

function PublicRoutes({ t, locale, contact }) {
  return (
    <Routes>
      <Route path="/" element={<Home t={t} locale={locale} />} />
      <Route path="/how-it-works" element={<HowItWorks t={t} />} />
      <Route path="/services" element={<Services t={t} locale={locale} />} />
      <Route path="/services/:slug" element={<ServiceDetail t={t} locale={locale} />} />
      <Route path="/hospitals" element={<Hospitals t={t} locale={locale} />} />
      <Route path="/hospitals/:slug" element={<HospitalDetail t={t} locale={locale} />} />
      <Route path="/request-care" element={<RequestCare locale={locale} />} />
      <Route path="/about" element={<About t={t} locale={locale} />} />
      <Route path="/contact" element={<Contact t={t} contact={contact} />} />
      <Route path="*" element={<div className="pub-container" style={{ padding: '48px 0' }}><h1>404</h1><p>Page not found.</p></div>} />
    </Routes>
  );
}

function AppRoutes({ t, locale, contact }) {
  void contact;
  return (
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
  );
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CustomerAuthProvider>
        <Shell />
      </CustomerAuthProvider>
    </BrowserRouter>
  );
}

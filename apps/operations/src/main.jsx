import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '../../../packages/ui/tokens.css';
import { AuthProvider, ProtectedRoute, OpsLayout } from './auth.jsx';

// Route-level code splitting: every page below is loaded on demand. Some page
// files export several named components, so each lazy wrapper picks its own.
const Login = React.lazy(() => import('./pages/session.jsx').then((m) => ({ default: m.Login })));
const Dashboard = React.lazy(() => import('./pages/session.jsx').then((m) => ({ default: m.Dashboard })));
const ServicesList = React.lazy(() => import('./pages/Services.jsx').then((m) => ({ default: m.ServicesList })));
const ServiceForm = React.lazy(() => import('./pages/Services.jsx').then((m) => ({ default: m.ServiceForm })));
const HospitalsList = React.lazy(() => import('./pages/Hospitals.jsx').then((m) => ({ default: m.HospitalsList })));
const HospitalForm = React.lazy(() => import('./pages/Hospitals.jsx').then((m) => ({ default: m.HospitalForm })));
const HeroSlides = React.lazy(() => import('./pages/Content.jsx').then((m) => ({ default: m.HeroSlides })));
const Faqs = React.lazy(() => import('./pages/Content.jsx').then((m) => ({ default: m.Faqs })));
const Testimonials = React.lazy(() => import('./pages/Content.jsx').then((m) => ({ default: m.Testimonials })));
const Blocks = React.lazy(() => import('./pages/Content.jsx').then((m) => ({ default: m.Blocks })));
const LegalPolicies = React.lazy(() => import('./pages/LegalPolicies.jsx').then((m) => ({ default: m.LegalPolicies })));
const Contact = React.lazy(() => import('./pages/Content.jsx').then((m) => ({ default: m.Contact })));
const RecipientFormCMS = React.lazy(() => import('./pages/RecipientFormCMS.jsx').then((m) => ({ default: m.RecipientFormCMS })));
const Media = React.lazy(() => import('./pages/Media.jsx').then((m) => ({ default: m.Media })));
const RequestsQueue = React.lazy(() => import('./pages/Requests.jsx').then((m) => ({ default: m.RequestsQueue })));
const RequestDetail = React.lazy(() => import('./pages/Requests.jsx').then((m) => ({ default: m.RequestDetail })));
const CustomersList = React.lazy(() => import('./pages/Customers.jsx').then((m) => ({ default: m.CustomersList })));
const CustomerDetail = React.lazy(() => import('./pages/Customers.jsx').then((m) => ({ default: m.CustomerDetail })));
const SupportQueue = React.lazy(() => import('./pages/Support.jsx').then((m) => ({ default: m.SupportQueue })));
const SupportDetail = React.lazy(() => import('./pages/Support.jsx').then((m) => ({ default: m.SupportDetail })));
const Analytics = React.lazy(() => import('./pages/Analytics.jsx').then((m) => ({ default: m.Analytics })));
const AuditLogs = React.lazy(() => import('./pages/Audit.jsx').then((m) => ({ default: m.AuditLogs })));
const ApiDirectory = React.lazy(() => import('./pages/ApiDirectory.jsx').then((m) => ({ default: m.ApiDirectory })));
const Security = React.lazy(() => import('./pages/Security.jsx').then((m) => ({ default: m.Security })));

function RouteFallback() {
  return (
    <div className="ops-route-loading" role="status" aria-live="polite">
      <span className="ops-spinner" aria-hidden="true" />
      <span>Loading page…</span>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <React.Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<OpsLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="requests" element={<RequestsQueue />} />
                <Route path="requests/:id" element={<RequestDetail />} />
                <Route path="customers" element={<CustomersList />} />
                <Route path="customers/:id" element={<CustomerDetail />} />
                <Route path="support" element={<SupportQueue />} />
                <Route path="support/:id" element={<SupportDetail />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="security" element={<Security />} />
                <Route path="system/apis" element={<ApiDirectory />} />
                <Route path="apis" element={<ApiDirectory />} />
                <Route path="services" element={<ServicesList />} />
                <Route path="services/:id" element={<ServiceForm />} />
                <Route path="hospitals" element={<HospitalsList />} />
                <Route path="hospitals/:id" element={<HospitalForm />} />
                <Route path="cms/hero-slides" element={<HeroSlides />} />
                <Route path="cms/faqs" element={<Faqs />} />
                <Route path="cms/testimonials" element={<Testimonials />} />
                <Route path="cms/blocks" element={<Blocks />} />
                <Route path="cms/legal" element={<LegalPolicies />} />
                <Route path="cms/policies" element={<LegalPolicies />} />
                <Route path="cms/recipient-form" element={<RecipientFormCMS />} />
                <Route path="cms/contact" element={<Contact />} />
                <Route path="media" element={<Media />} />
              </Route>
            </Route>
          </Routes>
        </React.Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

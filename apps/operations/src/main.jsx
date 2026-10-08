import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '../../../packages/ui/tokens.css';
import { AuthProvider, ProtectedRoute, OpsLayout } from './auth.jsx';
import { Login, Dashboard } from './pages/session.jsx';
import { ServicesList, ServiceForm } from './pages/Services.jsx';
import { HospitalsList, HospitalForm } from './pages/Hospitals.jsx';
import { HeroSlides, Faqs, Testimonials, Blocks, Contact } from './pages/Content.jsx';
import { RecipientFormCMS } from './pages/RecipientFormCMS.jsx';
import { Media } from './pages/Media.jsx';
import { RequestsQueue, RequestDetail } from './pages/Requests.jsx';
import { CustomersList, CustomerDetail } from './pages/Customers.jsx';
import { SupportQueue, SupportDetail } from './pages/Support.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { AuditLogs } from './pages/Audit.jsx';
import { ApiDirectory } from './pages/ApiDirectory.jsx';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
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
              <Route path="cms/recipient-form" element={<RecipientFormCMS />} />
              <Route path="cms/contact" element={<Contact />} />
              <Route path="media" element={<Media />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

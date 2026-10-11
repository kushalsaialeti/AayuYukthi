import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useCustomerAuth } from '../auth.jsx';
import { useDocumentMeta, Loading, LoadError } from '../components/layout.jsx';
import '../components/request/request.css';

export function CareRequestConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useCustomerAuth();
  const user = auth?.user;
  useDocumentMeta('Care Request Confirmed', 'Official confirmation receipt for your accompaniment request.');

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReceipt = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch fresh order details via dedicated receipt API
      let data;
      try {
        data = await api.authedReceipt(id);
      } catch {
        // Fallback to standard request get
        data = await api.authedGet(id);
      }
      setReceipt(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipt();
  }, [id]);

  if (loading) {
    return (
      <div className="rq-page-shell" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading t={{ loading: 'Loading care request confirmation...' }} />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="rq-page-shell" style={{ padding: '40px 16px' }}>
        <LoadError t={{ retry: 'Retry' }} onRetry={loadReceipt} />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/request-care" className="rq-btn-secondary" style={{ textDecoration: 'none' }}>
            Return to Request Care
          </Link>
        </div>
      </div>
    );
  }

  const reqId = receipt.id || id;
  const patientName = receipt.recipient?.name || receipt.recipient_name || 'Care Patient';
  const relationship = receipt.recipient?.relationship || receipt.recipient_relationship || 'Family';
  const serviceTitle = receipt.service?.title || receipt.service_title || 'Hospital Accompaniment';
  const hospitalName = receipt.hospital?.name || receipt.hospital_name || 'Hospital Campus';
  const hospitalCity = receipt.hospital?.city || 'Partner Centre';
  const appointmentType = receipt.appointment_type || 'Consultation & Accompaniment';
  const appointmentDate = receipt.appointment_date
    ? new Date(receipt.appointment_date).toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Scheduled on Coordination';
  const updatePhone = receipt.update_phone || user?.phone_e164 || 'Account Contact';
  const pickupRequired = Boolean(receipt.pickup_required);
  const pickupAddress = receipt.pickup_address;
  const status = receipt.status || 'REQUEST_RECEIVED';

  const statusLabel = status === 'CONFIRMED'
    ? 'Confirmed'
    : status === 'SCHEDULED'
    ? 'Scheduled'
    : 'Request Received & Under Review';

  return (
    <div className="rq-page-shell">
      <div className="rq-container" style={{ maxWidth: '640px' }}>
        <div className="rq-card" style={{ padding: '36px 28px', textAlign: 'center' }}>
          {/* Success Checkmark Badge */}
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#ecfdf5',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#059669' }}>
              check_circle
            </span>
          </div>

          <h1 className="rq-title" style={{ fontSize: '26px', marginBottom: '8px' }}>
            Care Request Confirmed!
          </h1>
          <p className="rq-description" style={{ maxWidth: '480px', margin: '0 auto 24px' }}>
            Your accompaniment request has been secured. Our hospital coordination desk is reviewing files and preparing companion dispatch.
          </p>

          {/* Official Request ID Box */}
          <div
            style={{
              background: 'var(--rq-surface-alt, #f8fafc)',
              borderRadius: '12px',
              border: '1px solid var(--rq-border, #e2e8f0)',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--rq-text-muted, #64748b)' }}>
                Official Care Request ID
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--rq-text, #0f172a)', fontFamily: 'monospace' }}>
                {reqId}
              </div>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: '#ecfdf5',
                color: '#047857',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
              <span>{statusLabel}</span>
            </div>
          </div>

          {/* Mandatory Caregiver / Caretaker Arrival Notice */}
          <div
            style={{
              background: '#eff6ff',
              borderRadius: '12px',
              border: '1px solid #bfdbfe',
              padding: '16px 20px',
              marginBottom: '28px',
              textAlign: 'left',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#2563eb', flexShrink: 0, marginTop: '2px' }}>
              schedule
            </span>
            <div style={{ fontSize: '14px', lineHeight: 1.5, color: '#1e3a8a' }}>
              <strong>Important Note:</strong> Dedicated care companion / caretaker details (Name, photo badge ID, and verified mobile number) will be shared <strong>1 hour before</strong> your scheduled service request time via SMS &amp; WhatsApp.
            </div>
          </div>

          {/* Official Order Receipt Card */}
          <div
            style={{
              background: 'var(--rq-surface-alt, #f8fafc)',
              borderRadius: '14px',
              border: '1px solid var(--rq-border, #e2e8f0)',
              padding: '24px',
              textAlign: 'left',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--rq-border, #e2e8f0)',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--rq-text-muted, #64748b)' }}>
                Care Service Receipt
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--rq-primary, #059669)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
                <span>Print Receipt</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--rq-text-muted, #64748b)', marginBottom: '2px' }}>Patient / Recipient</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--rq-text, #0f172a)' }}>
                  {patientName} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--rq-text-muted)' }}>({relationship})</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--rq-text-muted, #64748b)', marginBottom: '2px' }}>Care Service</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--rq-text, #0f172a)' }}>
                  {serviceTitle}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--rq-text-muted, #64748b)', marginBottom: '2px' }}>Destination Hospital</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--rq-text, #0f172a)' }}>
                  {hospitalName} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--rq-text-muted)' }}>({hospitalCity})</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--rq-text-muted, #64748b)', marginBottom: '2px' }}>Scheduled Date</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--rq-text, #0f172a)' }}>
                  {appointmentDate}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--rq-text-muted, #64748b)', marginBottom: '2px' }}>Visit Purpose</div>
                <div style={{ fontSize: '14px', color: 'var(--rq-text, #0f172a)' }}>
                  {appointmentType}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--rq-text-muted, #64748b)', marginBottom: '2px' }}>Transit &amp; Pickup</div>
                <div style={{ fontSize: '14px', color: 'var(--rq-text, #0f172a)' }}>
                  {pickupRequired ? `Doorstep Transit: ${pickupAddress || 'Provided Address'}` : 'Meet at Hospital Main Reception'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--rq-text-muted, #64748b)', marginBottom: '2px' }}>Journey Updates Contact</div>
                <div style={{ fontSize: '14px', color: 'var(--rq-text, #0f172a)' }}>
                  {updatePhone}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--rq-text-muted, #64748b)', marginBottom: '2px' }}>User Consent Status</div>
                <div style={{ fontSize: '14px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                  <span>Terms &amp; Privacy Policy Accepted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to={`/app/requests/${reqId}`}
              className="rq-btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span className="material-symbols-outlined">track_changes</span>
              <span>Track Live Journey</span>
            </Link>

            <Link
              to="/request-care"
              className="rq-btn-secondary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span className="material-symbols-outlined">add</span>
              <span>Book Another Request</span>
            </Link>

            <Link
              to="/app/requests"
              className="rq-btn-secondary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>My Requests</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

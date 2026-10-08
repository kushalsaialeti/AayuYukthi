import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorAlert, EmptyState, useFormState } from '../components/ui.jsx';
import { useToast } from '../components/OpsToast.jsx';

const STATUSES = [
  'REQUEST_RECEIVED',
  'UNDER_REVIEW',
  'COORDINATION_IN_PROGRESS',
  'CONFIRMED',
  'SCHEDULED',
  'SERVICE_IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'ACTION_REQUIRED',
];

const pretty = (s) => (s ? s.replaceAll('_', ' ') : '');

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'CONFIRMED':
    case 'SCHEDULED':
    case 'COMPLETED':
      return 'ops-badge-confirmed';
    case 'SERVICE_IN_PROGRESS':
    case 'COORDINATION_IN_PROGRESS':
      return 'ops-badge-active';
    case 'REQUEST_RECEIVED':
    case 'UNDER_REVIEW':
      return 'ops-badge-pending';
    case 'ACTION_REQUIRED':
      return 'ops-badge-action-required';
    case 'CANCELLED':
      return 'ops-badge-cancelled';
    default:
      return 'ops-badge-pending';
  }
};

export function RequestsQueue() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '', assigned: '' });

  const load = async (f = filters) => {
    setError(null);
    try {
      const params = { page: '1', limit: '50' };
      if (f.q) params.q = f.q;
      if (f.status) params.status = f.status;
      if (f.assigned) params.assigned = f.assigned;
      setData(await api.list('requests', params));
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load({ q: '', status: '', assigned: '' });
  }, []);

  const handleStatusFilter = (st) => {
    const updated = { ...filters, status: filters.status === st ? '' : st };
    setFilters(updated);
    load(updated);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    load(filters);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
            Care Requests &amp; Dispatch Queue
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
            Real-time live queue of accompaniment bookings across Bhimavaram network hospitals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/system/apis"
            className="ops-btn ops-btn-secondary"
            title="View tabular directory of application APIs and their usage"
            style={{ textDecoration: 'none' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>api</span>
            API Directory &amp; Usage
          </Link>
          <button
            type="button"
            className="ops-btn ops-btn-secondary"
            onClick={() => load(filters)}
            title="Refresh queue"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Quick Status Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <button
          type="button"
          className={`ops-btn ops-btn-sm ${!filters.status ? 'ops-btn-primary' : 'ops-btn-secondary'}`}
          onClick={() => handleStatusFilter('')}
        >
          All Requests
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`ops-btn ops-btn-sm ${filters.status === s ? 'ops-btn-primary' : 'ops-btn-secondary'}`}
            onClick={() => handleStatusFilter(s)}
          >
            {pretty(s)}
          </button>
        ))}
      </div>

      {/* Search & Assignment Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ops-outline)',
              fontSize: '18px',
            }}
          >
            search
          </span>
          <input
            className="ops-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search patient, family, hospital, or service…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
        </div>

        <select
          className="ops-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={filters.assigned}
          onChange={(e) => {
            const updated = { ...filters, assigned: e.target.value };
            setFilters(updated);
            load(updated);
          }}
        >
          <option value="">All Team Assignees</option>
          <option value="me">Assigned to Me</option>
          <option value="unassigned">Unassigned Only</option>
        </select>

        <button className="ops-btn ops-btn-secondary" type="submit">
          Apply Filters
        </button>
      </form>

      <ErrorAlert error={error} onRetry={() => load(filters)} />

      {!data && !error && (
        <div className="ops-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--ops-outline)' }}>
            sync
          </span>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--ops-outline)' }}>Loading care requests…</p>
        </div>
      )}

      {data && (data.data?.length ?? 0) === 0 && (
        <EmptyState message="No care requests found matching your filter criteria." />
      )}

      {data && (data.data?.length ?? 0) > 0 && (
        <div className="ops-table-container">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Customer &amp; Family</th>
                <th>Care Service</th>
                <th>Destination Hospital</th>
                <th>Dispatch Status</th>
                <th>Assigned Companion</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--ops-surface-container-high)',
                          color: 'var(--ops-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          flexShrink: 0,
                        }}
                      >
                        {r.customer_name ? r.customer_name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--ops-on-surface)' }}>{r.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>{r.customer_email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ops-on-surface)' }}>{r.service_title}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--ops-primary)' }}>
                        local_hospital
                      </span>
                      <span style={{ fontWeight: 500 }}>{r.hospital_name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`ops-badge ${getStatusBadgeClass(r.status)}`}>
                      {pretty(r.status)}
                    </span>
                  </td>
                  <td>
                    {r.assignee_name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--ops-secondary)' }}>
                          badge
                        </span>
                        <span>{r.assignee_name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--ops-outline)', fontSize: '0.8125rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      to={`/requests/${r.id}`}
                      className="ops-btn ops-btn-secondary ops-btn-sm"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        open_in_new
                      </span>
                      Manage Dispatch
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function RequestDetail() {
  const { id } = useParams();
  const [req, setReq] = useState(null);
  const [team, setTeam] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [busySaving, setBusySaving] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);
  const [busyDossier, setBusyDossier] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  // Organized Form State for Journey, Logistics & Live Operational Telemetry
  const [editForm, setEditForm] = useState({
    hospital_id: '',
    service_id: '',
    appointment_type: '',
    appointment_date: '',
    schedule_at: '',
    pickup_required: false,
    pickup_address: '',
    additional_requirements: '',
    assigned_to: '',
    doctor_name: '',
    room_number: '',
    station_manager: '',
    station_location: '',
    station_intercom: '',
    station_phone: '',
    companion_phone: '',
    companion_badge_id: '',
  });

  // Workflow Status Form
  const [statusForm, setStatusForm] = useState({
    to_status: '',
    customer_message: '',
    note_internal: '',
  });

  // Medical Visit Dossier Form
  const [dossierForm, setDossierForm] = useState({
    visit_summary: '',
    note_internal: '',
  });

  const load = async (silent = false) => {
    if (!silent) setError(null);
    try {
      const [detail, teamList, hospRes, svcRes] = await Promise.all([
        api.get('requests', id),
        api.getOne('customers/team').catch(() => []),
        api.list('hospitals', { limit: '100' }).catch(() => ({ data: [] })),
        api.list('services', { limit: '100' }).catch(() => ({ data: [] })),
      ]);
      setReq(detail);
      setTeam(teamList || []);
      setHospitals(hospRes?.data || []);
      setServices(svcRes?.data || []);

      setEditForm({
        hospital_id: detail.hospital?.id || '',
        service_id: detail.service?.id || '',
        appointment_type: detail.appointment_type || '',
        appointment_date: detail.appointment_date ? String(detail.appointment_date).slice(0, 10) : '',
        schedule_at: detail.schedule_at ? String(detail.schedule_at).slice(0, 16) : '',
        pickup_required: Boolean(detail.pickup_required),
        pickup_address: detail.pickup_address || '',
        additional_requirements: detail.additional_requirements || '',
        assigned_to: detail.assigned_to || '',
        doctor_name: detail.doctor_name || '',
        room_number: detail.room_number || '',
        station_manager: detail.station_manager || '',
        station_location: detail.station_location || '',
        station_intercom: detail.station_intercom || '',
        station_phone: detail.station_phone || '',
        companion_phone: detail.companion_phone || '',
        companion_badge_id: detail.companion_badge_id || '',
      });

      setDossierForm({
        visit_summary: detail.visit_summary || '',
        note_internal: '',
      });

      setStatusForm({
        to_status: detail.allowed_transitions?.[0] || '',
        customer_message: '',
        note_internal: '',
      });
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await load(true);
    setIsRefreshing(false);
    toast.success('Live request data refreshed!');
  };

  const handleFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // Save Journey, Hospital, Scheduling, Transit, Companion, Doctor & Telemetry updates
  const handleSaveAllLogistics = async (e) => {
    if (e) e.preventDefault();
    setBusySaving(true);
    setError(null);
    try {
      const updated = await api.raw(`/ops/requests/${id}`, 'PATCH', {
        hospital_id: editForm.hospital_id || undefined,
        service_id: editForm.service_id || undefined,
        appointment_type: editForm.appointment_type || null,
        appointment_date: editForm.appointment_date || null,
        schedule_at: editForm.schedule_at || null,
        pickup_required: editForm.pickup_required,
        pickup_address: editForm.pickup_address || null,
        additional_requirements: editForm.additional_requirements || null,
        assigned_to: editForm.assigned_to || null,
        doctor_name: editForm.doctor_name || null,
        room_number: editForm.room_number || null,
        station_manager: editForm.station_manager || null,
        station_location: editForm.station_location || null,
        station_intercom: editForm.station_intercom || null,
        station_phone: editForm.station_phone || null,
        companion_phone: editForm.companion_phone || null,
        companion_badge_id: editForm.companion_badge_id || null,
      });
      setReq(updated);
      toast.success('Journey, doctor, telemetry & logistics saved successfully!');
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to update request');
    } finally {
      setBusySaving(false);
    }
  };

  // Transition Workflow Status
  const handleChangeStatus = async (e) => {
    e.preventDefault();
    setBusyStatus(true);
    setError(null);
    try {
      const updated = await api.raw(`/ops/requests/${id}/status`, 'PATCH', {
        to_status: statusForm.to_status,
        note_internal: statusForm.note_internal || null,
        customer_message: statusForm.customer_message || null,
      });
      setReq(updated);
      setStatusForm({
        to_status: updated.allowed_transitions?.[0] || '',
        note_internal: '',
        customer_message: '',
      });
      toast.success(`Workflow status transitioned to ${pretty(updated.status)}`);
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to update status');
    } finally {
      setBusyStatus(false);
    }
  };

  // Publish Medical Visit Summary & Completion Dossier
  const handlePublishDossier = async (e) => {
    e.preventDefault();
    if (!dossierForm.visit_summary.trim()) {
      toast.error('Please enter the doctor consultation summary or discharge advice');
      return;
    }
    setBusyDossier(true);
    setError(null);
    try {
      const updated = await api.raw(`/ops/requests/${id}`, 'PATCH', {
        visit_summary: dossierForm.visit_summary.trim(),
        customer_message: `Medical Visit Summary: ${dossierForm.visit_summary.trim()}`,
        note_internal: dossierForm.note_internal.trim() || null,
      });
      setReq(updated);
      setDossierForm({ visit_summary: '', note_internal: '' });
      toast.success('Medical visit dossier published live to family dashboard!');
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to publish visit summary');
    } finally {
      setBusyDossier(false);
    }
  };

  if (error && !req) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link to="/requests" className="ops-btn ops-btn-secondary ops-btn-sm" style={{ width: 'fit-content' }}>
          ← Back to Requests Queue
        </Link>
        <ErrorAlert error={error} onRetry={() => load()} />
      </div>
    );
  }

  if (!req) {
    return (
      <div className="ops-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--ops-outline)', animation: 'spin 1.5s linear infinite' }}>
          sync
        </span>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--ops-outline)' }}>Loading care request cockpit…</p>
      </div>
    );
  }

  const shortCode = `#SRV-${(req.id || '').replace(/-/g, '').slice(-6).toUpperCase()}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Global Actions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        backgroundColor: 'var(--ops-surface-container-lowest)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--ops-radius-xl)',
        border: '1px solid var(--ops-outline-subtle)',
        boxShadow: 'var(--ops-shadow-sm)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link to="/requests" className="ops-btn ops-btn-secondary ops-btn-sm" style={{ padding: '0.25rem 0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>arrow_back</span>
              Queue
            </Link>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-primary)' }}>
              {shortCode}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>
              ({req.id})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--ops-on-surface)' }}>
              {req.service?.title || 'Hospital Accompaniment'}
            </h1>
            <span className={`ops-badge ${getStatusBadgeClass(req.status)}`} style={{ fontSize: '0.8125rem', padding: '0.3rem 0.7rem' }}>
              {pretty(req.status)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="ops-btn ops-btn-secondary"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Reload latest request data from backend"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '18px',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }}
            >
              sync
            </span>
            <span>{isRefreshing ? 'Refreshing…' : 'Refresh Live'}</span>
          </button>

          <button
            type="button"
            className="ops-btn ops-btn-primary"
            onClick={handleSaveAllLogistics}
            disabled={busySaving}
            title="Save changes to journey schedule, hospital, pickup, directives & companion"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {busySaving ? 'hourglass_empty' : 'save'}
            </span>
            <span>{busySaving ? 'Saving Changes…' : 'Save Request Updates'}</span>
          </button>
        </div>
      </div>

      <ErrorAlert error={error} />

      {/* Main Form Workstation: Clean Divided Sections */}
      <form onSubmit={handleSaveAllLogistics} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* SECTION 1: Patient & Family Contact Profile (Read-Only Context) */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                badge
              </span>
              1. Patient &amp; Family Profile
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)', fontWeight: 600 }}>
              Read-Only Verified Profile
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--ops-surface-container-low)',
              borderRadius: 'var(--ops-radius-md)',
              border: '1px solid var(--ops-outline-subtle)'
            }}>
              <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--ops-outline)', fontWeight: 700 }}>
                Care Recipient
              </span>
              <p style={{ margin: '0.2rem 0 0', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--ops-on-surface)' }}>
                {req.recipient.name}
              </p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8125rem', color: 'var(--ops-secondary)' }}>
                Relationship: <strong>{req.recipient.relationship}</strong>
                {req.recipient.date_of_birth ? ` • DOB: ${req.recipient.date_of_birth}` : ''}
              </p>
              {req.recipient.phone && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
                  Recipient Tel: {req.recipient.phone}
                </p>
              )}
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--ops-surface-container-low)',
              borderRadius: 'var(--ops-radius-md)',
              border: '1px solid var(--ops-outline-subtle)'
            }}>
              <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--ops-outline)', fontWeight: 700 }}>
                Account Owner / Booking Customer
              </span>
              <p style={{ margin: '0.2rem 0 0', fontWeight: 700, fontSize: '1.0625rem' }}>
                <Link to={`/customers/${req.customer.id}`} style={{ color: 'var(--ops-primary)', textDecoration: 'none' }}>
                  {req.customer.name}
                </Link>
              </p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8125rem', color: 'var(--ops-secondary)' }}>
                {req.customer.email}
              </p>
              {req.customer.phone && (
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
                  Customer Tel: {req.customer.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: Hospital & Service Package Management (Editable) */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                local_hospital
              </span>
              2. Hospital &amp; Service Package Configuration
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-primary)', fontWeight: 600 }}>
              Editable in CMS
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="ops-form-field">
              <label className="ops-form-label">
                Destination Partner Hospital
                <span style={{ color: 'var(--ops-primary)', fontSize: '0.75rem' }}>(Live Network)</span>
              </label>
              <select
                className="ops-select"
                value={editForm.hospital_id}
                onChange={(e) => handleFormChange('hospital_id', e.target.value)}
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name_en || h.name} {h.city ? `(${h.city})` : ''}
                  </option>
                ))}
              </select>
              <span className="ops-form-hint">Selected medical facility for the patient's visit.</span>
            </div>

            <div className="ops-form-field">
              <label className="ops-form-label">
                Care Service Package
              </label>
              <select
                className="ops-select"
                value={editForm.service_id}
                onChange={(e) => handleFormChange('service_id', e.target.value)}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title_en || s.title}
                  </option>
                ))}
              </select>
              <span className="ops-form-hint">Standard or customized accompaniment tier.</span>
            </div>

            <div className="ops-form-field" style={{ gridColumn: '1 / -1' }}>
              <label className="ops-form-label">
                Consultation / Appointment Department &amp; Type
              </label>
              <input
                className="ops-input"
                value={editForm.appointment_type}
                onChange={(e) => handleFormChange('appointment_type', e.target.value)}
                placeholder="E.g. Cardiology OPD & 2D-Echocardiogram Consultation"
              />
              <span className="ops-form-hint">
                Specialization or specific clinic (OPD, Oncology, Orthopedics, Dialysis, Lab investigations).
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Journey Schedule & Time Slot (Editable) */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                calendar_month
              </span>
              3. Journey Scheduling &amp; Slot Management
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-primary)', fontWeight: 600 }}>
              Live Calendar Sync
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="ops-form-field">
              <label className="ops-form-label">Appointment Date (YYYY-MM-DD)</label>
              <input
                type="date"
                className="ops-input"
                value={editForm.appointment_date}
                onChange={(e) => handleFormChange('appointment_date', e.target.value)}
              />
              <span className="ops-form-hint">Scheduled day of hospital visit.</span>
            </div>

            <div className="ops-form-field">
              <label className="ops-form-label">Scheduled Time Slot / Telemetry Slot</label>
              <input
                type="text"
                className="ops-input"
                value={editForm.schedule_at}
                onChange={(e) => handleFormChange('schedule_at', e.target.value)}
                placeholder="E.g. 09:30 AM IST or ISO timestamp"
              />
              <span className="ops-form-hint">Expected arrival time at the hospital porch / clinic desk.</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: Doorstep Transit & Pickup Logistics (Editable) */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                directions_car
              </span>
              4. Doorstep Transit, Pickup &amp; Mobility Directives
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-primary)', fontWeight: 600 }}>
              Field Dispatch Directives
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--ops-surface-container-low)',
              borderRadius: 'var(--ops-radius-md)'
            }}>
              <input
                type="checkbox"
                id="pickup_required_toggle"
                checked={editForm.pickup_required}
                onChange={(e) => handleFormChange('pickup_required', e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <label htmlFor="pickup_required_toggle" style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                Doorstep Vehicle Pickup &amp; Safe Transit Required
              </label>
              <span style={{
                fontSize: '0.6875rem',
                backgroundColor: editForm.pickup_required ? 'var(--ops-success-container)' : 'var(--ops-surface-container-high)',
                color: editForm.pickup_required ? 'var(--ops-success)' : 'var(--ops-outline)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--ops-radius-pill)',
                fontWeight: 700
              }}>
                {editForm.pickup_required ? 'PICKUP ENABLED' : 'SELF-TRANSIT'}
              </span>
            </div>

            {editForm.pickup_required && (
              <div className="ops-form-field">
                <label className="ops-form-label">Doorstep Pickup Residential Address</label>
                <textarea
                  className="ops-textarea"
                  rows={2}
                  value={editForm.pickup_address}
                  onChange={(e) => handleFormChange('pickup_address', e.target.value)}
                  placeholder="Door number, apartment name, street, landmark in Bhimavaram or West Godavari..."
                />
                <span className="ops-form-hint">Driver and escort pickup coordinates.</span>
              </div>
            )}

            <div className="ops-form-field">
              <label className="ops-form-label">
                Special Mobility, Medical Directives &amp; Spoken Language
              </label>
              <textarea
                className="ops-textarea"
                rows={3}
                value={editForm.additional_requirements}
                onChange={(e) => handleFormChange('additional_requirements', e.target.value)}
                placeholder="E.g. Wheelchair assistance required at Porch 1, Telugu & English fluent companion, elderly patient walks slowly, fast-track token coordination required..."
              />
              <span className="ops-form-hint">
                These directives are automatically parsed into badges on the customer's live card and the companion's briefing sheet.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 5: Care Companion Assignment (Editable) */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                support_agent
              </span>
              5. Care Companion &amp; Field Staff Assignment
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-primary)', fontWeight: 600 }}>
              Field Dispatch
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignItems: 'center' }}>
            <div className="ops-form-field">
              <label className="ops-form-label">
                Assigned Dedicated Companion
              </label>
              <select
                className="ops-select"
                value={editForm.assigned_to}
                onChange={(e) => handleFormChange('assigned_to', e.target.value)}
              >
                <option value="">-- Unassigned (Available in Care Desk Pool) --</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.roles ? m.roles.join(', ') : 'Staff'})
                  </option>
                ))}
              </select>
              <span className="ops-form-hint">The assigned companion will be displayed on the customer's live tracking card.</span>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--ops-surface-container-low)',
              borderRadius: 'var(--ops-radius-md)',
              border: '1px solid var(--ops-outline-subtle)'
            }}>
              <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--ops-outline)', fontWeight: 700 }}>
                Active Companion Status
              </span>
              {req.assignee_name ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--ops-primary)' }}>
                    verified
                  </span>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ops-on-surface)' }}>
                      {req.assignee_name}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ops-secondary)' }}>
                      BLS Certified Care Companion • Active Escort
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
                  Currently Unassigned. Select a staff member from the list to assign.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 6: Attending Doctor & OPD Consultation Desk (Editable in CMS) */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                stethoscope
              </span>
              6. Attending Doctor &amp; OPD Consultation Room
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-primary)', fontWeight: 600 }}>
              Live Customer Dossier Sync
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="ops-form-field">
              <label className="ops-form-label">
                Attending / Consulting Doctor Name
              </label>
              <input
                className="ops-input"
                value={editForm.doctor_name}
                onChange={(e) => handleFormChange('doctor_name', e.target.value)}
                placeholder="E.g. Dr. Srinivas Rao (Sr. Cardiologist)"
              />
              <span className="ops-form-hint">
                Streams to the patient's escort timeline and milestone cards.
              </span>
            </div>

            <div className="ops-form-field">
              <label className="ops-form-label">
                OPD Room Number / Consultation Desk
              </label>
              <input
                className="ops-input"
                value={editForm.room_number}
                onChange={(e) => handleFormChange('room_number', e.target.value)}
                placeholder="E.g. OPD Room 204 (Tower B, 2nd Floor)"
              />
              <span className="ops-form-hint">
                Informs the family and escort where the consultation is occurring.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 7: Companion Direct Contact & Telemetry Badge (Editable in CMS) */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                contact_emergency
              </span>
              7. Companion Telemetry &amp; Direct Contact
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-primary)', fontWeight: 600 }}>
              Field Directives
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="ops-form-field">
              <label className="ops-form-label">
                Companion Direct Mobile / Hotline
              </label>
              <input
                className="ops-input"
                value={editForm.companion_phone}
                onChange={(e) => handleFormChange('companion_phone', e.target.value)}
                placeholder="E.g. +91 98765 43210"
              />
              <span className="ops-form-hint">
                Direct phone number displayed on the customer's Companion card.
              </span>
            </div>

            <div className="ops-form-field">
              <label className="ops-form-label">
                Companion Staff Badge / Accreditation ID
              </label>
              <input
                className="ops-input"
                value={editForm.companion_badge_id}
                onChange={(e) => handleFormChange('companion_badge_id', e.target.value)}
                placeholder="E.g. AY-BHM-409"
              />
              <span className="ops-form-hint">
                Verification badge shown on customer tracking screen.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 8: Hospital Liaison Desk & Intercom Telemetry (Editable in CMS) */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                desk
              </span>
              8. Hospital Liaison Desk &amp; Intercom Telemetry
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-primary)', fontWeight: 600 }}>
              On-Ground Care Desk
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="ops-form-field">
              <label className="ops-form-label">Station Desk Manager / Lead</label>
              <input
                className="ops-input"
                value={editForm.station_manager}
                onChange={(e) => handleFormChange('station_manager', e.target.value)}
                placeholder="E.g. Sister Rekha P."
              />
              <span className="ops-form-hint">Duty sister or station supervisor.</span>
            </div>

            <div className="ops-form-field">
              <label className="ops-form-label">Station Physical Location</label>
              <input
                className="ops-input"
                value={editForm.station_location}
                onChange={(e) => handleFormChange('station_location', e.target.value)}
                placeholder="E.g. Tower B, Desk 4"
              />
              <span className="ops-form-hint">Meeting point inside the hospital.</span>
            </div>

            <div className="ops-form-field">
              <label className="ops-form-label">Internal Intercom / Extension</label>
              <input
                className="ops-input"
                value={editForm.station_intercom}
                onChange={(e) => handleFormChange('station_intercom', e.target.value)}
                placeholder="E.g. Ext. 4102"
              />
              <span className="ops-form-hint">Internal line for coordination.</span>
            </div>

            <div className="ops-form-field">
              <label className="ops-form-label">Station Direct Phone</label>
              <input
                className="ops-input"
                value={editForm.station_phone}
                onChange={(e) => handleFormChange('station_phone', e.target.value)}
                placeholder="E.g. +91 8816 223344"
              />
              <span className="ops-form-hint">Direct helpline for family.</span>
            </div>
          </div>
        </div>

        {/* Global Save Button for Sections 2-8 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="submit"
            className="ops-btn ops-btn-primary"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem' }}
            disabled={busySaving}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {busySaving ? 'hourglass_empty' : 'save'}
            </span>
            <span>{busySaving ? 'Saving Updates…' : 'Save All Journey, Doctor & Logistics Updates'}</span>
          </button>
        </div>
      </form>

      {/* 2-Column Action Workspace: Status Transition & Medical Dossier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* SECTION 9: Workflow Status Transition & Dispatch Control */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                swap_horiz
              </span>
              9. Workflow Dispatch &amp; Status Transition
            </h2>
            <span className={`ops-badge ${getStatusBadgeClass(req.status)}`}>
              {pretty(req.status)}
            </span>
          </div>

          <form onSubmit={handleChangeStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="ops-form-field">
              <label className="ops-form-label">
                Transition Workflow Status
                <span className="ops-form-hint">Strict Closed Status Machine</span>
              </label>
              <select
                className="ops-select"
                value={statusForm.to_status}
                onChange={(e) => setStatusForm((s) => ({ ...s, to_status: e.target.value }))}
              >
                <option value="">-- Select Status Transition --</option>
                {(req.allowed_transitions || []).map((st) => (
                  <option key={st} value={st}>
                    → Move to {pretty(st)}
                  </option>
                ))}
              </select>
            </div>

            <div className="ops-form-field">
              <label className="ops-form-label">
                Customer-Facing Dispatch Notification
                {statusForm.to_status === 'ACTION_REQUIRED' && (
                  <span style={{ color: 'var(--ops-error)', fontSize: '0.75rem' }}>(Required)</span>
                )}
              </label>
              <textarea
                className="ops-textarea"
                rows={2}
                value={statusForm.customer_message}
                onChange={(e) => setStatusForm((s) => ({ ...s, customer_message: e.target.value }))}
                placeholder="Sent live to customer dashboard & alerts (e.g. Companion S. Murthy has reached Gate 1 porch with wheelchair)..."
                required={statusForm.to_status === 'ACTION_REQUIRED'}
              />
            </div>

            <div className="ops-form-field">
              <label className="ops-form-label">
                Internal Operational Staff Note
                <span className="ops-form-hint">Private log for staff coordination</span>
              </label>
              <textarea
                className="ops-textarea"
                rows={2}
                value={statusForm.note_internal}
                onChange={(e) => setStatusForm((s) => ({ ...s, note_internal: e.target.value }))}
                placeholder="E.g. Verified appointment token with OPD Receptionist Sister Rekha..."
              />
            </div>

            <button
              type="submit"
              className="ops-btn ops-btn-primary"
              disabled={busyStatus || !statusForm.to_status}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {busyStatus ? 'hourglass_empty' : 'update'}
              </span>
              <span>{busyStatus ? 'Updating Status…' : 'Transition Workflow Status'}</span>
            </button>
          </form>
        </div>

        {/* SECTION 10: Medical Visit Summary & Completion Dossier */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                medical_information
              </span>
              10. Medical Visit Summary &amp; Dossier
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-success)', fontWeight: 600 }}>
              Family Delivery
            </span>
          </div>

          <form onSubmit={handlePublishDossier} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="ops-form-field">
              <label className="ops-form-label">
                Doctor Consultation Summary &amp; Discharge Advice
              </label>
              <textarea
                className="ops-textarea"
                rows={4}
                value={dossierForm.visit_summary}
                onChange={(e) => setDossierForm((d) => ({ ...d, visit_summary: e.target.value }))}
                placeholder="E.g. Dr. K. Srinivas reviewed ECG & Echo. Advised Telma 40mg daily with breakfast. Next follow-up review scheduled in 4 weeks. Prescription handed over to patient."
              />
              <span className="ops-form-hint">
                This summary appears prominently in the family's "My Care Requests" card and Visit Summary dossier.
              </span>
            </div>

            <div className="ops-form-field">
              <label className="ops-form-label">
                Internal Clinical Verification Note
              </label>
              <textarea
                className="ops-textarea"
                rows={2}
                value={dossierForm.note_internal}
                onChange={(e) => setDossierForm((d) => ({ ...d, note_internal: e.target.value }))}
                placeholder="E.g. Physical discharge copy scanned and uploaded to patient records..."
              />
            </div>

            <button
              type="submit"
              className="ops-btn ops-btn-primary"
              disabled={busyDossier || !dossierForm.visit_summary.trim()}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {busyDossier ? 'hourglass_empty' : 'send'}
              </span>
              <span>{busyDossier ? 'Publishing Dossier…' : 'Publish Visit Dossier to Family'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* SECTION 11: Real-Time Audit Log & Dispatch Status Timeline */}
      <div className="ops-card">
        <div className="ops-card-header">
          <h2 className="ops-card-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
              history
            </span>
            11. Dispatch Audit &amp; Status Timeline
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)', fontWeight: 600 }}>
            {req.timeline ? `${req.timeline.length} Events Logged` : '0 Events'}
          </span>
        </div>

        {req.timeline && req.timeline.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {req.timeline.map((t, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--ops-surface-container-low)',
                  borderRadius: 'var(--ops-radius-md)',
                  borderLeft: '4px solid var(--ops-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`ops-badge ${getStatusBadgeClass(t.to_status)}`}>
                      {pretty(t.to_status)}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
                      Updated by <strong>{t.changed_by_name ?? 'Operations Desk'}</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>
                    {new Date(t.created_at).toLocaleString()}
                  </span>
                </div>

                {t.customer_message && (
                  <div style={{
                    margin: '0.25rem 0',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'rgba(0, 67, 73, 0.05)',
                    borderRadius: 'var(--ops-radius-sm)',
                    fontSize: '0.8125rem',
                    color: 'var(--ops-on-surface)'
                  }}>
                    <strong style={{ color: 'var(--ops-primary)' }}>Notice to Family:</strong> {t.customer_message}
                  </div>
                )}

                {t.note_internal && (
                  <div
                    style={{
                      margin: '0.25rem 0 0',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#fffbeb',
                      borderRadius: 'var(--ops-radius-sm)',
                      fontSize: '0.8125rem',
                      color: '#92400e',
                    }}
                  >
                    <strong>Internal Staff Note:</strong> {t.note_internal}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--ops-outline)' }}>No timeline entries recorded yet.</p>
        )}
      </div>

      {/* SECTION 12: Request Lifecycle APIs & System Usage Table */}
      <div className="ops-card">
        <div className="ops-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
              api
            </span>
            <h2 className="ops-card-title">
              12. Request Telemetry &amp; System APIs Directory
            </h2>
          </div>
          <Link to="/system/apis" className="ops-btn ops-btn-secondary ops-btn-sm" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
            View Full System API Catalog
          </Link>
        </div>

        <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
          Detailed tabular list of APIs powering care requests, real-time telemetry, companion assignment, and CMS updates:
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>API Route / Endpoint</th>
                <th>Access / Auth</th>
                <th>Module / Usage in Application</th>
                <th>Rate Limiting</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="ops-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>GET</span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>/api/v1/requests/:id/details</td>
                <td>
                  <span className="ops-badge ops-badge-active">Customer JWT</span>
                </td>
                <td>
                  <strong>Dedicated Request Details API:</strong> Returns rich live telemetry, dynamic milestones, assigned companion credentials, doctor &amp; OPD room, hospital liaison desk, and post-visit dossier.
                </td>
                <td>8 req / min</td>
              </tr>
              <tr>
                <td>
                  <span className="ops-badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 800 }}>PATCH</span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>/api/v1/ops/requests/:id</td>
                <td>
                  <span className="ops-badge ops-badge-confirmed">Operations Staff</span>
                </td>
                <td>
                  <strong>CMS Logistics &amp; Telemetry Editor:</strong> Updates doctor name, OPD room, companion phone &amp; badge ID, station manager, intercom, and publishes visit summary dossiers.
                </td>
                <td>8 req / min</td>
              </tr>
              <tr>
                <td>
                  <span className="ops-badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 800 }}>PATCH</span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>/api/v1/ops/requests/:id/status</td>
                <td>
                  <span className="ops-badge ops-badge-confirmed">Operations Staff</span>
                </td>
                <td>
                  <strong>Workflow Transition Engine:</strong> Executes strict state machine transitions with customer-facing dispatch SMS/alerts and internal audit logs.
                </td>
                <td>8 req / min</td>
              </tr>
              <tr>
                <td>
                  <span className="ops-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>GET</span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>/api/v1/requests</td>
                <td>
                  <span className="ops-badge ops-badge-active">Customer JWT</span>
                </td>
                <td>
                  <strong>My Requests Queue:</strong> Customer dashboard list of past and active care requests with basic status summaries and pagination.
                </td>
                <td>8 req / min</td>
              </tr>
              <tr>
                <td>
                  <span className="ops-badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 800 }}>POST</span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>/api/v1/requests</td>
                <td>
                  <span className="ops-badge ops-badge-active">Customer JWT</span>
                </td>
                <td>
                  <strong>Intake &amp; Booking API:</strong> Creates a new hospital escort request selecting family recipient, hospital, and service tier.
                </td>
                <td>8 req / min</td>
              </tr>
              <tr>
                <td>
                  <span className="ops-badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 800 }}>POST</span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>/api/v1/requests/:id/cancel</td>
                <td>
                  <span className="ops-badge ops-badge-active">Customer JWT</span>
                </td>
                <td>
                  <strong>Self-Service Cancellation:</strong> Allows customer to cancel requests that are in RECEIVED, UNDER_REVIEW, or ACTION_REQUIRED states.
                </td>
                <td>8 req / min</td>
              </tr>
              <tr>
                <td>
                  <span className="ops-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>GET</span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>/api/v1/ops/requests</td>
                <td>
                  <span className="ops-badge ops-badge-confirmed">Operations Staff</span>
                </td>
                <td>
                  <strong>Operations Queue:</strong> Real-time searchable and filterable queue across all requests in the Bhimavaram network.
                </td>
                <td>8 req / min</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


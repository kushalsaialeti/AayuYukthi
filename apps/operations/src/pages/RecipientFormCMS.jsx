import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import { Field, ErrorAlert } from '../components/ui.jsx';
import { ImageUploadField } from '../components/ImageUploadField.jsx';
import { useToast } from '../components/OpsToast.jsx';

const DEFAULT_RECIPIENT_CONFIG = {
  banner: {
    step: 'Step 1 of Care Setup',
    title: 'Add Care Recipient',
    description:
      'Enter essential details to customize hospital accompaniment, wheelchair logistics, and caregiver communication during critical transit and OPD consultations.',
    trustPills: [
      { icon: 'support_agent', text: 'Verified Companion Protocol' },
      { icon: 'accessible_forward', text: 'Zero-Friction Transit Logistics' },
      { icon: 'lock', text: 'Caregiver-Controlled Visibility' },
    ],
  },
  relationships: [
    { value: 'Mother', label: 'Mother' },
    { value: 'Father', label: 'Father' },
    { value: 'Spouse', label: 'Spouse' },
    { value: 'Child', label: 'Child' },
    { value: 'In-Law', label: 'In-Law (Mother/Father)' },
    { value: 'Relative', label: 'Relative / Guardian' },
    { value: 'Self', label: 'Self (Direct Account)' },
  ],
  metros: [
    { value: 'Bhimavaram', label: 'Bhimavaram & Surrounding (Active Service)' },
  ],
  hospitals: [
    'Varma Hospitals, Bhimavaram',
    'Imperial Hospitals, Bhimavaram',
    'Akshara Speciality Hospitals, Bhimavaram',
    'Mithra Medicare Hospital, Bhimavaram',
    'Nallaparaju Venkata Raju Hospital, Bhimavaram',
    'Rajarshi Hospitals, Bhimavaram',
    'Bhimavaram Hospitals, Bhimavaram',
    'Teja Super Speciality Hospital, Bhimavaram',
    'VH Care Multi-speciality Hospital, Bhimavaram',
    'Sri Venkateswara Hospitals, Bhimavaram',
    'Sri Lakshmi Hospitals, Bhimavaram',
    'Vinayaka Hospital, Bhimavaram',
    'Sai Indian Hospitals, Bhimavaram',
    'Neeladri Hospitals, Bhimavaram',
    'Abhiram Orthopaedic Hospital, Bhimavaram',
    'Maxivision Super Speciality Eye Hospitals, Bhimavaram',
  ],
  mobilityOptions: [
    {
      id: 'wheelchair',
      label: 'Wheelchair Required',
      description: 'We will arrange hospital wheelchair handoff at Gate 1 porch upon taxi or personal car arrival.',
      icon: 'accessible',
      isWheelchair: true,
    },
    {
      id: 'slow_walker',
      label: 'Slow Walker / Arm Support',
      description: 'Companion provides continuous physical stabilization during long corridor walks and incline ramps.',
      icon: 'elderly',
    },
    {
      id: 'independent',
      label: 'Independent Walker',
      description: 'Comfortable walking, only needs navigation, token queue standing, and prescription fulfillment.',
      icon: 'directions_walk',
    },
    {
      id: 'sensory',
      label: 'Visual / Hearing Support',
      description: 'Companion speaks clearly at natural volume, monitors display monitors, and repeats doctor guidance.',
      icon: 'record_voice_over',
    },
  ],
  languages: ['Telugu', 'English', 'Hindi'],
  guarantee: {
    title: 'AayuYukthi Companion Guarantee',
    description: 'Every companion is police-verified, CPR trained, and equipped with our digital hospital floor-plan GPS.',
  },
  nextSteps: [
    {
      step: 1,
      title: 'Recipient Profile Saved',
      description: 'Safe credentials stored in your caregiver dashboard.',
    },
    {
      step: 2,
      title: '1-Click Booking Ready',
      description: 'Instantly dispatch a trained companion for future appointments.',
    },
    {
      step: 3,
      title: 'Live Transit Tracking',
      description: 'Follow gate entry, OPD room queues, and medicine dispatch.',
    },
  ],
};

export function RecipientFormCMS() {
  const [config, setConfig] = useState(DEFAULT_RECIPIENT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const toast = useToast();

  // Load existing block from backend
  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.list('cms/content-blocks');
      const blocks = res?.data || [];
      const found = blocks.find((b) => b.key === 'recipient_form.config');
      if (found && found.body_en) {
        try {
          const parsed = JSON.parse(found.body_en);
          setConfig((prev) => ({
            ...prev,
            ...parsed,
            banner: { ...prev.banner, ...(parsed.banner || {}) },
          }));
        } catch {
          // If unparseable, stay with default
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.put('cms/content-blocks', {
        key: 'recipient_form.config',
        title_en: 'Care Recipient Form Configuration',
        body_en: JSON.stringify(config, null, 2),
        icon: 'person_add',
        status: 'published',
      });
      setSuccessMsg('Successfully published Care Recipient Form configuration! Changes are now live in the web application.');
      toast.success('Care recipient form directives published to live website');
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to publish configuration');
    } finally {
      setSaving(false);
    }
  };

  // Helper state changers
  const updateBanner = (field, val) => {
    setConfig((prev) => ({
      ...prev,
      banner: { ...prev.banner, [field]: val },
    }));
  };

  // Metros management
  const [newMetroVal, setNewMetroVal] = useState('');
  const [newMetroLbl, setNewMetroLbl] = useState('');
  const addMetro = () => {
    if (!newMetroVal.trim()) return;
    setConfig((prev) => ({
      ...prev,
      metros: [...prev.metros, { value: newMetroVal.trim(), label: newMetroLbl.trim() || newMetroVal.trim() }],
    }));
    setNewMetroVal('');
    setNewMetroLbl('');
  };
  const removeMetro = (idx) => {
    setConfig((prev) => ({
      ...prev,
      metros: prev.metros.filter((_, i) => i !== idx),
    }));
  };

  // Hospitals management
  const [newHospital, setNewHospital] = useState('');
  const addHospital = () => {
    if (!newHospital.trim()) return;
    setConfig((prev) => ({
      ...prev,
      hospitals: [...prev.hospitals, newHospital.trim()],
    }));
    setNewHospital('');
  };
  const removeHospital = (idx) => {
    setConfig((prev) => ({
      ...prev,
      hospitals: prev.hospitals.filter((_, i) => i !== idx),
    }));
  };

  // Languages management
  const [newLang, setNewLang] = useState('');
  const addLanguage = () => {
    if (!newLang.trim()) return;
    setConfig((prev) => ({
      ...prev,
      languages: [...prev.languages, newLang.trim()],
    }));
    setNewLang('');
  };
  const removeLanguage = (idx) => {
    setConfig((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== idx),
    }));
  };

  if (loading) return <p>Loading Recipient Form CMS settings…</p>;

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Care Recipient Setup (CMS)</h1>
          <p style={{ color: 'var(--color-muted)', margin: '4px 0 0' }}>
            Configure fields, metros, preferred hospitals, escort options, and guidance for the "Add Care Recipient" form.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Publishing…' : 'Publish to Live Form'}
        </button>
      </div>

      <ErrorAlert error={error} onRetry={loadConfig} />

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#dcfce7', color: '#166534', marginBottom: 16, fontWeight: 500 }}>
          {successMsg}
        </div>
      )}

      {/* 1. Banner Copy & Steps */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>1. Header Banner & Trust Copy</h2>
        <Field label="Step Badge Label">
          <input
            className="input"
            value={config.banner?.step || ''}
            onChange={(e) => updateBanner('step', e.target.value)}
          />
        </Field>
        <Field label="Page Title">
          <input
            className="input"
            value={config.banner?.title || ''}
            onChange={(e) => updateBanner('title', e.target.value)}
          />
        </Field>
        <Field label="Description">
          <textarea
            className="textarea"
            rows={2}
            value={config.banner?.description || ''}
            onChange={(e) => updateBanner('description', e.target.value)}
          />
        </Field>
      </div>

      {/* 2. Operational Metros */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>2. Operational Metros / Cities</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: -4 }}>
          Cities where escort and transit fleets are available.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
          {(config.metros || []).map((m, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-surface)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
              <span>
                <strong>{m.value}</strong> &mdash; <span style={{ color: 'var(--color-muted)' }}>{m.label}</span>
              </span>
              <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => removeMetro(idx)}>
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            className="input"
            placeholder="City ID (e.g. Pune)"
            value={newMetroVal}
            onChange={(e) => setNewMetroVal(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            className="input"
            placeholder="Display Label (e.g. Pune (Fleet Ready))"
            value={newMetroLbl}
            onChange={(e) => setNewMetroLbl(e.target.value)}
            style={{ flex: 2 }}
          />
          <button type="button" className="btn btn-secondary" onClick={addMetro}>
            Add Metro
          </button>
        </div>
      </div>

      {/* 3. Primary Preferred Hospitals */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>3. Preferred Hospitals List</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: -4 }}>
          Hospitals suggested in the recipient primary care dropdown.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
          {(config.hospitals || []).map((h, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-surface)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
              <span>{h}</span>
              <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => removeHospital(idx)}>
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            className="input"
            placeholder="Hospital Name & Branch (e.g. Apollo Hospital, Jayanagar)"
            value={newHospital}
            onChange={(e) => setNewHospital(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="button" className="btn btn-secondary" onClick={addHospital}>
            Add Hospital
          </button>
        </div>
      </div>

      {/* 4. Companion Spoken Languages */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>4. Spoken Dialects / Languages</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: -4 }}>
          Languages displayed as selection chips in Section 04.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {(config.languages || []).map((lang, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'var(--color-primary-tint, #cbe2fd)',
                color: 'var(--color-primary-dark, #004349)',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {lang}
              <button
                type="button"
                onClick={() => removeLanguage(idx)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', fontWeight: 'bold' }}
                title="Remove"
              >
                &times;
              </button>
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            placeholder="New language (e.g. Marathi, Bengali)"
            value={newLang}
            onChange={(e) => setNewLang(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <button type="button" className="btn btn-secondary" onClick={addLanguage}>
            Add Language
          </button>
        </div>
      </div>

      {/* 5. Mobility Escort Options */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>5. Mobility &amp; Escort Options</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {(config.mobilityOptions || []).map((opt, idx) => (
            <div key={opt.id} style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{opt.label}</strong>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Icon: {opt.icon}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '4px 0 0' }}>{opt.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Guarantee & Next Steps */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>6. Companion Guarantee &amp; Next Steps</h2>
        <Field label="Guarantee Title">
          <input
            className="input"
            value={config.guarantee?.title || ''}
            onChange={(e) => setConfig((p) => ({ ...p, guarantee: { ...p.guarantee, title: e.target.value } }))}
          />
        </Field>
        <Field label="Guarantee Description">
          <textarea
            className="textarea"
            rows={2}
            value={config.guarantee?.description || ''}
            onChange={(e) => setConfig((p) => ({ ...p, guarantee: { ...p.guarantee, description: e.target.value } }))}
          />
        </Field>
      </div>

      {/* 7. Live Preview Bento Card & Visuals */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>7. Live Preview Card &amp; Visuals</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: -4 }}>
          Customize images and titles rendered in the live profile preview card on the recipient setup page.
        </p>
        <Field label="Preview Card Header Title">
          <input
            className="input"
            value={config.previewTitle || ''}
            placeholder="Profile Preview"
            onChange={(e) => setConfig((p) => ({ ...p, previewTitle: e.target.value }))}
          />
        </Field>
        <ImageUploadField
          label="Care Recipient Fallback Photo / Avatar"
          value={config.profileImage || ''}
          onChange={(url) => setConfig((p) => ({ ...p, profileImage: url }))}
          helper="Upload from device/Google Drive or paste URL. Stored as compressed WebP for instant loading."
        />
        <ImageUploadField
          label="Care Coordinator / Companion Support Card Image"
          value={config.coordinatorImage || ''}
          onChange={(url) => setConfig((p) => ({ ...p, coordinatorImage: url }))}
          helper="Visual photo displayed in 'What happens next?' support card. Stored as compressed WebP."
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Publishing…' : 'Publish to Live Form'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (window.confirm('Reset form fields to default mockup values?')) {
              setConfig(DEFAULT_RECIPIENT_CONFIG);
            }
          }}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

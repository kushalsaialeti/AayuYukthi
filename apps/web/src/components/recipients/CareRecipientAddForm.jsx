import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { DEFAULT_RECIPIENT_CMS_CONFIG } from './defaultConfig.js';
import { RecipientBanner } from './RecipientBanner.jsx';
import { RecipientBasicInfo } from './RecipientBasicInfo.jsx';
import { RecipientCoordinates } from './RecipientCoordinates.jsx';
import { RecipientMobility } from './RecipientMobility.jsx';
import { RecipientDirectives } from './RecipientDirectives.jsx';
import { RecipientEmergencyContact } from './RecipientEmergencyContact.jsx';
import { RecipientPreviewCard } from './RecipientPreviewCard.jsx';
import { RecipientActionBar } from './RecipientActionBar.jsx';
import './recipient-form.css';

export function parseRecipientNotes(notesString) {
  if (!notesString) return {};
  try {
    if (notesString.trim().startsWith('{') && notesString.trim().endsWith('}')) {
      return JSON.parse(notesString);
    }
  } catch {}
  return { careDirectives: notesString };
}

export function serializeRecipientNotes(values) {
  const meta = {
    homeAddress: values.homeAddress,
    cityMetro: values.cityMetro,
    pincode: values.pincode,
    hospital: values.hospital,
    uhid: values.uhid,
    mobility: values.mobility,
    wheelchairType: values.wheelchairType,
    languages: values.languages,
    careDirectives: values.careDirectives,
    isPrimaryContact: values.isPrimaryContact,
    secContact: values.secName ? {
      name: values.secName,
      relation: values.secRel,
      phone: values.secPhone ? (values.secPhone.startsWith('+91') ? values.secPhone : `+91${values.secPhone}`) : '',
    } : null,
  };

  return JSON.stringify(meta);
}

export function CareRecipientAddForm({
  initialData,
  onSuccess,
  onCancel,
  user,
}) {
  const [config, setConfig] = useState(DEFAULT_RECIPIENT_CMS_CONFIG);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const initialNotes = parseRecipientNotes(initialData?.notes);

  const [formValues, setFormValues] = useState({
    fullName: initialData?.full_name || '',
    relationship: initialData?.relationship || '',
    dob: initialData?.date_of_birth || '',
    gender: initialData?.gender ? (initialData.gender.charAt(0).toUpperCase() + initialData.gender.slice(1)) : '',
    recipientPhone: initialData?.phone_e164 ? initialData.phone_e164.replace(/^\+91/, '') : '',
    homeAddress: initialNotes.homeAddress || '',
    cityMetro: initialNotes.cityMetro || '',
    pincode: initialNotes.pincode || '',
    hospital: initialNotes.hospital || '',
    uhid: initialNotes.uhid || '',
    mobility: initialNotes.mobility || [],
    wheelchairType: initialNotes.wheelchairType || 'hospital',
    languages: initialNotes.languages || [],
    careDirectives: initialNotes.careDirectives || '',
    isPrimaryContact: initialNotes.isPrimaryContact !== false,
    secName: initialNotes.secContact?.name || '',
    secRel: initialNotes.secContact?.relation || '',
    secPhone: initialNotes.secContact?.phone ? initialNotes.secContact.phone.replace(/^\+91/, '') : '',
  });

  // Load CMS configuration & hospitals
  useEffect(() => {
    let active = true;

    // Fetch CMS block if available
    api.block('recipient_form.config')
      .then((block) => {
        if (!active || !block?.body_en) return;
        try {
          const parsed = JSON.parse(block.body_en);
          setConfig((prev) => ({
            ...prev,
            ...parsed,
            banner: { ...prev.banner, ...(parsed.banner || {}) },
          }));
        } catch {
          // If body is plain text, keep defaults
        }
      })
      .catch(() => {});

    // Fetch live hospitals directory to populate hospital choices
    api.hospitals({ limit: 100 })
      .then((res) => {
        if (!active) return;
        const list = res?.data || [];
        if (list.length > 0) {
          const hospitalNames = list.map((h) => `${h.name_en || h.name}, ${h.city || 'Bengaluru'}`);
          setConfig((prev) => ({
            ...prev,
            hospitals: Array.from(new Set([...prev.hospitals, ...hospitalNames])),
          }));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (redirectToRequestCare = false) => {
    setErrorMessage(null);
    if (!formValues.fullName.trim()) {
      setErrorMessage('Please enter the full legal name.');
      return;
    }
    if (!formValues.dob) {
      setErrorMessage('Please enter the date of birth.');
      return;
    }
    if (!formValues.homeAddress.trim()) {
      setErrorMessage('Please enter the primary pickup / home address.');
      return;
    }

    setIsSubmitting(true);

    const serializedNotes = serializeRecipientNotes(formValues);

    let cleanPhone = null;
    if (formValues.recipientPhone && formValues.recipientPhone.trim()) {
      const digits = formValues.recipientPhone.replace(/\D/g, '');
      cleanPhone = digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
    }

    const payload = {
      full_name: formValues.fullName.trim(),
      relationship: formValues.relationship,
      date_of_birth: formValues.dob,
      gender: formValues.gender,
      phone_e164: cleanPhone,
      notes: serializedNotes,
    };

    try {
      let result;
      if (initialData?.id) {
        result = await api.updateRecipient(initialData.id, payload);
      } else {
        result = await api.createRecipient(payload);
      }

      const savedRecipient = result?.recipient || result;

      if (onSuccess) {
        onSuccess(savedRecipient, redirectToRequestCare ? 'request-care' : 'list');
      }
    } catch (err) {
      setErrorMessage(err.fieldErrors ? Object.values(err.fieldErrors).join(' ') : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave(false);
  };

  return (
    <div className="rf-page-wrapper">
      <RecipientBanner config={config} onBackToList={onCancel} />

      {errorMessage && (
        <div style={{
          padding: '1rem',
          borderRadius: '0.75rem',
          backgroundColor: 'var(--rf-error-container)',
          color: 'var(--rf-error)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '14px',
          fontWeight: 600
        }} role="alert">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form id="recipientForm" onSubmit={handleSubmit} className="rf-form-grid">
        {/* Left Column: Structured Form Fields */}
        <div className="rf-main-col">
          <RecipientBasicInfo
            values={formValues}
            onChange={handleChange}
            config={config}
          />

          <RecipientCoordinates
            values={formValues}
            onChange={handleChange}
            config={config}
          />

          <RecipientMobility
            values={formValues}
            onChange={handleChange}
            config={config}
          />

          <RecipientDirectives
            values={formValues}
            onChange={handleChange}
            config={config}
          />

          <RecipientEmergencyContact
            values={formValues}
            onChange={handleChange}
            user={user}
          />
        </div>

        {/* Right Column: Contextual Card, Photo Assist & Live Summary Bento */}
        <RecipientPreviewCard
          values={formValues}
          config={config}
        />
      </form>

      {/* Form Actions: Prominent Action Bar */}
      <RecipientActionBar
        onCancel={onCancel}
        onSaveAndBook={() => handleSave(true)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

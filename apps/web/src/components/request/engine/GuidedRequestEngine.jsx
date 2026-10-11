import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api.js';
import { track } from '../../../analytics.js';
import { useCustomerAuth } from '../../../auth.jsx';
import { useRequestDraft } from '../state/useRequestDraft.js';
import { RecipientQuestion } from '../primitives/RecipientQuestion.jsx';
import { ServiceQuestion } from '../primitives/ServiceQuestion.jsx';
import { HospitalQuestion } from '../primitives/HospitalQuestion.jsx';
import { TextQuestion } from '../primitives/TextQuestion.jsx';
import { DateQuestion } from '../primitives/DateQuestion.jsx';
import { AddressQuestion } from '../primitives/AddressQuestion.jsx';
import { ReviewQuestion } from '../primitives/ReviewQuestion.jsx';
import { AuthQuestion } from '../primitives/AuthQuestion.jsx';
import { ScrollProgress } from '../../ui/ScrollProgress.jsx';
import '../request.css';

const STEP_TITLES = {
  1: 'Who needs support?',
  2: 'Which service?',
  3: 'Which hospital?',
  4: 'Visit purpose & directives',
  5: 'When? (Schedule)',
  6: 'Logistics & Mandatory consent',
  7: 'Review & Verification',
};

export function GuidedRequestEngine({
  services = [],
  hospitals = [],
  recipients = [],
  activeRecipientIds = [],
  cmsBlocks = {},
  onRefreshRecipients,
  initialServiceId,
  initialHospitalId,
}) {
  const { user } = useCustomerAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const {
    step,
    draft,
    errors,
    submitting,
    idempotencyKey,
    updateField,
    toggleServiceId,
    validateStep,
    nextStep,
    prevStep,
    goToStep,
    setErrors,
    setSubmitting,
    clearDraft,
  } = useRequestDraft(user);

  // Helper to extract step-specific CMS text
  const getStepCms = (stepNum) => {
    const prefix = `request.step${stepNum}`;
    return {
      eyebrow: cmsBlocks[`${prefix}.eyebrow`]?.body_en || cmsBlocks[`${prefix}.eyebrow`]?.title_en,
      title: cmsBlocks[`${prefix}.title`]?.body_en || cmsBlocks[`${prefix}.title`]?.title_en,
      desc: cmsBlocks[`${prefix}.desc`]?.body_en || cmsBlocks[`${prefix}.desc`]?.title_en,
    };
  };

  // Auth CMS settings
  const authCmsConfig = useMemo(() => {
    const emailBlock = cmsBlocks['auth.email_enabled'];
    const phoneBlock = cmsBlocks['auth.phone_enabled'];
    return {
      authEmailEnabled: emailBlock ? emailBlock.body_en !== 'false' : true,
      authPhoneEnabled: phoneBlock ? phoneBlock.body_en === 'true' : false,
      ...getStepCms(7),
    };
  }, [cmsBlocks]);

  // If initial service or hospital came from URL / homepage query
  useEffect(() => {
    if (initialServiceId && !draft.serviceId) {
      updateField('serviceId', initialServiceId);
    }
    if (initialHospitalId && !draft.hospitalId) {
      updateField('hospitalId', initialHospitalId);
    }
  }, [initialServiceId, initialHospitalId, draft.serviceId, draft.hospitalId, updateField]);

  // Focus management
  useEffect(() => {
    if (containerRef.current) {
      const heading = containerRef.current.querySelector('h1, h2');
      if (heading && typeof heading.focus === 'function') {
        heading.focus();
      }
      if (typeof containerRef.current.scrollIntoView === 'function') {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [step]);

  // Derived values for summary & review
  const selectedRecipient = useMemo(() => {
    return recipients.find((r) => r.id === draft.recipientId);
  }, [recipients, draft.recipientId]);

  const selectedServices = useMemo(() => {
    const sIds = Array.isArray(draft.serviceIds) && draft.serviceIds.length > 0
      ? draft.serviceIds
      : (draft.serviceId ? [draft.serviceId] : []);
    return services.filter((s) => sIds.includes(s.id));
  }, [services, draft.serviceIds, draft.serviceId]);

  const serviceTitles = useMemo(() => {
    return selectedServices.map((s) => s.title_en || s.name);
  }, [selectedServices]);

  const selectedService = selectedServices[0] || services.find((s) => s.id === draft.serviceId);

  const selectedHospital = useMemo(() => {
    return hospitals.find((h) => h.id === draft.hospitalId);
  }, [hospitals, draft.hospitalId]);

  // Handle final submission (Step 7)
  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors({});
    track('REQUEST_SUBMITTED', { service_id: draft.serviceId, hospital_id: draft.hospitalId });

    try {
      let finalRecipientId = draft.recipientId;

      // If user entered new recipient data during the flow, create the recipient first
      if (!finalRecipientId && draft.newRecipient?.fullName) {
        const created = await api.createRecipient({
          full_name: draft.newRecipient.fullName,
          relationship: draft.newRecipient.relationship || 'other',
          phone_e164: draft.newRecipient.phone || undefined,
          date_of_birth: draft.newRecipient.dateOfBirth || undefined,
        });
        finalRecipientId = created.recipient?.id || created.id;
        updateField('recipientId', finalRecipientId);
        if (onRefreshRecipients) onRefreshRecipients();
      }

      if (!finalRecipientId) {
        goToStep(1);
        setErrors({ recipient: 'Please select or add a care recipient' });
        setSubmitting(false);
        return;
      }

      const serviceNames = selectedServices.map((s) => s.title_en || s.name).join(', ');
      let additionalReqs = draft.additionalRequirements || '';
      if (selectedServices.length > 1) {
        const multiNote = `[Selected Services: ${serviceNames}]`;
        if (!additionalReqs.includes('[Selected Services:')) {
          additionalReqs = additionalReqs ? `${multiNote}\n${additionalReqs}` : multiNote;
        }
      }

      const submitPayload = {
        idempotency_key: idempotencyKey,
        recipient_id: finalRecipientId,
        service_id: draft.serviceId || draft.serviceIds?.[0],
        service_ids: draft.serviceIds?.length ? draft.serviceIds : (draft.serviceId ? [draft.serviceId] : []),
        hospital_id: draft.hospitalId,
        appointment_type: draft.appointmentType || 'Hospital Consultation',
        appointment_date: draft.appointmentDate || null,
        schedule_at: draft.scheduleAt || null,
        pickup_required: Boolean(draft.pickupRequired),
        pickup_address: draft.pickupRequired ? (draft.pickupAddress || null) : null,
        dropoff_address: draft.pickupRequired ? (draft.dropoffAddress || null) : null,
        update_phone: draft.updatePhone || user?.phone_e164 || null,
        additional_requirements: additionalReqs || null,
      };

      const res = await api.authedSubmit(submitPayload);
      clearDraft();

      if (res?.saved_as_draft) {
        track('REQUEST_QUEUED_AS_DRAFT', { recipient_id: finalRecipientId });
        navigate('/app/requests?tab=drafts&notice=queued');
      } else {
        const newReqId = res?.id || res?.request?.id;
        track('REQUEST_COMPLETED', { request_id: newReqId });
        navigate(`/request-care/confirmed/${newReqId}`);
      }
    } catch (err) {
      track('REQUEST_SUBMISSION_FAILED', { error: err.message });
      setErrors({ submit: err.message || 'Submission failed. Please check your connection and retry.' });
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercentage = Math.round((step / 7) * 100);

  return (
    <div className="rq-page-shell">
      {/* MagicUI ScrollProgress — active during care-request form filling (Steps 1 to 7) */}
      {step >= 1 && step <= 7 && <ScrollProgress />}

      <div className="rq-container" ref={containerRef}>
        {/* Top Header & Progress Bar */}
        <header className="rq-header">
          <div className="rq-top-bar">
            {step > 1 ? (
              <button
                type="button"
                className="rq-back-btn"
                onClick={prevStep}
                aria-label="Previous step"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                <span>Back</span>
              </button>
            ) : (
              <div style={{ width: 60 }} />
            )}
            <div className="rq-step-counter">
              Step {step} of 7 • {STEP_TITLES[step] || ''}
            </div>
          </div>
          <div
            className="rq-progress-track"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`Step ${step} of 7`}
          >
            <div className="rq-progress-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
        </header>

        {/* Main Step Body */}
        <main className="rq-card">
          {step === 1 && (
            <RecipientQuestion
              recipients={recipients}
              activeRecipientIds={activeRecipientIds}
              selectedRecipientId={draft.recipientId}
              newRecipient={draft.newRecipient}
              onSelectRecipient={(id) => updateField('recipientId', id)}
              onUpdateNewRecipient={(newRec) => updateField('newRecipient', newRec)}
              cmsConfig={getStepCms(1)}
              error={errors.recipient}
            />
          )}

          {step === 2 && (
            <ServiceQuestion
              services={services}
              selectedServiceId={draft.serviceId}
              selectedServiceIds={draft.serviceIds || []}
              onSelectService={(id) => {
                updateField('serviceId', id);
                track('SERVICE_SELECTED', { service_id: id });
              }}
              onToggleService={(id) => {
                toggleServiceId(id);
                track('SERVICE_TOGGLED', { service_id: id });
              }}
              cmsConfig={getStepCms(2)}
              error={errors.service}
            />
          )}

          {step === 3 && (
            <HospitalQuestion
              hospitals={hospitals}
              selectedHospitalId={draft.hospitalId}
              onSelectHospital={(id) => {
                updateField('hospitalId', id);
                track('HOSPITAL_SELECTED', { hospital_id: id });
              }}
              cmsConfig={getStepCms(3)}
              error={errors.hospital}
            />
          )}

          {step === 4 && (
            <TextQuestion
              stepNumber={4}
              stepLabel={getStepCms(4).eyebrow || 'Step 4 of 7 • Purpose & Special Directives'}
              title={getStepCms(4).title || 'What is the purpose of this hospital visit?'}
              description={getStepCms(4).desc || 'Help our care companion prepare appropriate records, queue tokens, and mobility support.'}
              value={draft.appointmentType}
              onChange={(val) => updateField('appointmentType', val)}
              placeholder="e.g. Cardiology OPD Consult, MRI Brain Scan, Post-Surgery Followup"
              suggestions={[
                'Doctor OPD Consultation',
                'Diagnostic Scans & Lab Tests',
                'Post-Surgery Review',
                'Chemotherapy / Dialysis Daycare',
                'Second Medical Opinion',
              ]}
              error={errors.appointmentType}
            />
          )}

          {step === 5 && (
            <DateQuestion
              dateValue={draft.appointmentDate}
              onDateChange={(val) => updateField('appointmentDate', val)}
              timeSlotValue={draft.timeSlot}
              onTimeSlotChange={(val) => updateField('timeSlot', val)}
              cmsConfig={getStepCms(5)}
              error={errors.appointmentDate}
            />
          )}

          {step === 6 && (
            <AddressQuestion
              pickupRequired={draft.pickupRequired}
              onPickupRequiredChange={(val) => updateField('pickupRequired', val)}
              pickupAddress={draft.pickupAddress}
              onPickupAddressChange={(val) => updateField('pickupAddress', val)}
              dropoffAddress={draft.dropoffAddress}
              onDropoffAddressChange={(val) => updateField('dropoffAddress', val)}
              updatePhone={draft.updatePhone}
              onUpdatePhoneChange={(val) => updateField('updatePhone', val)}
              currentUserPhone={user?.phone_e164}
              consentAccepted={draft.consentAccepted}
              onConsentAcceptedChange={(val) => updateField('consentAccepted', val)}
              cmsConfig={getStepCms(6)}
              error={errors.pickupAddress}
              consentError={errors.consent}
              phoneError={errors.updatePhone}
            />
          )}

          {step === 7 && (
            <div>
              <ReviewQuestion
                draft={draft}
                recipientName={selectedRecipient?.full_name || draft.newRecipient?.fullName}
                serviceTitle={selectedService?.title_en}
                serviceTitles={serviceTitles}
                hospitalName={selectedHospital?.name_en}
                cmsConfig={getStepCms(7)}
                onEditStep={(target) => goToStep(target)}
              />

              {/* Identity Verification Section */}
              <div style={{ marginTop: '24px' }}>
                {user ? (
                  <div
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #10b981',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
                        <span>Verified Caregiver Identity</span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#065f46', marginTop: '2px' }}>
                        {user.full_name || 'Caregiver Account'} {user.email ? `(${user.email})` : user.phone_e164 ? `(${user.phone_e164})` : ''}
                      </div>
                      <div style={{ fontSize: '13px', color: '#047857', marginTop: '2px' }}>
                        Caregiver authentication verified. Ready to submit and secure hospital accompaniment.
                      </div>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#10b981', flexShrink: 0 }}>
                      verified_user
                    </span>
                  </div>
                ) : (
                  <div>
                    <div style={{ margin: '16px 0 8px', fontSize: '14px', fontWeight: 600, color: 'var(--rq-text)' }}>
                      Identity Verification Required
                    </div>
                    <AuthQuestion
                      role={draft.newRecipient?.relationship}
                      recipientName={draft.newRecipient?.fullName}
                      cmsConfig={authCmsConfig}
                      onAuthSuccess={() => {
                        // User verified!
                      }}
                      error={errors.auth}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="rq-error-msg" role="alert" style={{ marginTop: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px' }}>
              <span className="material-symbols-outlined">error</span>
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Action Buttons */}
          <footer className="rq-actions">
            {step > 1 ? (
              <button
                type="button"
                className="rq-btn-secondary"
                onClick={prevStep}
                disabled={submitting}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                <span>Previous</span>
              </button>
            ) : (
              <div />
            )}

            {step < 7 && (
              <button
                type="button"
                className="rq-btn-primary"
                onClick={nextStep}
              >
                <span>Continue</span>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </button>
            )}

            {step === 7 && (
              <button
                type="button"
                className="rq-btn-primary"
                onClick={handleSubmit}
                disabled={!user || submitting}
              >
                <span>{submitting ? 'Submitting...' : 'Confirm & Submit Care Request'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {user ? 'send' : 'lock'}
                </span>
              </button>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}

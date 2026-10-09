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
import { ContactQuestion } from '../primitives/ContactQuestion.jsx';
import { ReviewQuestion } from '../primitives/ReviewQuestion.jsx';
import { AuthQuestion } from '../primitives/AuthQuestion.jsx';
import { SuccessStep } from '../primitives/SuccessStep.jsx';
import { ScrollProgress } from '../../ui/ScrollProgress.jsx';
import '../request.css';

const STEP_TITLES = {
  1: 'Who needs support?',
  2: 'Which service?',
  3: 'Which hospital?',
  4: 'What is the visit?',
  5: 'When?',
  6: 'Pickup / Drop',
  7: 'Who receives updates?',
  8: 'Additional requirements',
  9: 'Review details',
  10: 'Verify caregiver account',
  11: 'Submitting request...',
  12: 'Request confirmed',
};

export function GuidedRequestEngine({
  services = [],
  hospitals = [],
  recipients = [],
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
    submissionResult,
    idempotencyKey,
    updateField,
    updateFields,
    toggleServiceId,
    validateStep,
    nextStep,
    prevStep,
    goToStep,
    setErrors,
    setSubmitting,
    setSubmissionResult,
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

  // Auth CMS settings (Email on by default, Phone off by default)
  const authCmsConfig = useMemo(() => {
    const emailBlock = cmsBlocks['auth.email_enabled'];
    const phoneBlock = cmsBlocks['auth.phone_enabled'];
    return {
      authEmailEnabled: emailBlock ? emailBlock.body_en !== 'false' : true,
      authPhoneEnabled: phoneBlock ? phoneBlock.body_en === 'true' : false,
      ...getStepCms(10),
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

  // Focus management: move focus to heading on step transition
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

  // Handle final submission (Step 11)
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
      setSubmissionResult(res);
      clearDraft();
      goToStep(12);
      track('REQUEST_COMPLETED', { request_id: res?.id || res?.request?.id });
    } catch (err) {
      track('REQUEST_SUBMISSION_FAILED', { error: err.message });
      setErrors({ submit: err.message || 'Submission failed. Please check your connection and retry.' });
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercentage = Math.round((Math.min(step, 10) / 10) * 100);

  return (
    <div className="rq-page-shell">
      {/* MagicUI ScrollProgress — strictly active during care-request form filling (Steps 1 to 10) */}
      {step >= 1 && step <= 10 && <ScrollProgress />}

      <div className="rq-container" ref={containerRef}>
        {/* Top Header & Progress Bar */}
        {step <= 10 && (
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
                Step {step} of 10 • {getStepCms(step).title || STEP_TITLES[step] || ''}
              </div>
            </div>
            <div
              className="rq-progress-track"
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label={`Step ${step} of 10`}
            >
              <div className="rq-progress-fill" style={{ width: `${progressPercentage}%` }} />
            </div>
          </header>
        )}

        {/* Main Step Body */}
        <main className="rq-card">
          {step === 1 && (
            <RecipientQuestion
              recipients={recipients}
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
              stepLabel={getStepCms(4).eyebrow || 'Visit Purpose'}
              title={getStepCms(4).title || 'What is the purpose of this hospital visit?'}
              description={getStepCms(4).desc || 'Help our companion prepare appropriate files, token queues, and wheelchair support.'}
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
              cmsConfig={getStepCms(6)}
              error={errors.pickupAddress}
            />
          )}

          {step === 7 && (
            <ContactQuestion
              updatePhone={draft.updatePhone}
              onUpdatePhoneChange={(val) => updateField('updatePhone', val)}
              currentUserPhone={user?.phone_e164}
              cmsConfig={getStepCms(7)}
              error={errors.updatePhone}
            />
          )}

          {step === 8 && (
            <TextQuestion
              stepNumber={8}
              stepLabel={getStepCms(8).eyebrow || 'Special Requirements'}
              title={getStepCms(8).title || 'Any mobility assistance or special directives?'}
              description={getStepCms(8).desc || 'Tell us if the patient requires wheelchair ramp access, Telugu/Hindi speaking escort, or lift assistance.'}
              value={draft.additionalRequirements}
              onChange={(val) => updateField('additionalRequirements', val)}
              placeholder="e.g. Patient requires wheelchair from arrival gate. Prefers companion fluent in Telugu."
              suggestions={[
                'Wheelchair Assistance Required',
                'Telugu Speaking Escort',
                'Hindi Speaking Escort',
                'Slow Walker / Cane Support',
                'Prescription Dossier Handover',
              ]}
              isTextarea
              error={errors.additionalRequirements}
            />
          )}

          {step === 9 && (
            <ReviewQuestion
              draft={draft}
              recipientName={selectedRecipient?.full_name || draft.newRecipient?.fullName}
              serviceTitle={selectedService?.title_en}
              serviceTitles={serviceTitles}
              hospitalName={selectedHospital?.name_en}
              cmsConfig={getStepCms(9)}
              onEditStep={(target) => goToStep(target)}
            />
          )}

          {step === 10 && (
            <AuthQuestion
              role={draft.newRecipient?.relationship}
              recipientName={draft.newRecipient?.fullName}
              cmsConfig={authCmsConfig}
              onAuthSuccess={() => {
                // If user just verified, they can now submit!
              }}
              error={errors.auth}
            />
          )}

          {step === 11 && (
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <div className="rq-option-icon" style={{ margin: '0 auto 20px', width: '56px', height: '56px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>hourglass_top</span>
              </div>
              <h2 className="rq-title">{getStepCms(11).title || 'Securing Care Request...'}</h2>
              <p className="rq-description">
                {getStepCms(11).desc || 'Submitting your details securely to our operations hospital coordination desk.'}
              </p>
            </div>
          )}

          {step === 12 && (
            <SuccessStep
              requestResult={submissionResult}
              recipientName={selectedRecipient?.full_name || draft.newRecipient?.fullName}
              serviceTitle={selectedService?.title_en}
              serviceTitles={serviceTitles}
              hospitalName={selectedHospital?.name_en}
              cmsConfig={getStepCms(12)}
              onReset={clearDraft}
            />
          )}

          {errors.submit && (
            <div className="rq-error-msg" role="alert" style={{ marginTop: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px' }}>
              <span className="material-symbols-outlined">error</span>
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Action Buttons */}
          {step <= 10 && (
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

              {step < 9 && (
                <button
                  type="button"
                  className="rq-btn-primary"
                  onClick={nextStep}
                >
                  <span>Continue</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </button>
              )}

              {step === 9 && (
                <button
                  type="button"
                  className="rq-btn-primary"
                  onClick={() => {
                    track('REQUEST_REVIEWED');
                    if (user) {
                      // Already authenticated, proceed straight to submit
                      handleSubmit();
                    } else {
                      // Move to authentication step
                      nextStep();
                    }
                  }}
                  disabled={submitting}
                >
                  <span>{user ? 'Confirm & Submit Request' : 'Proceed to Verification'}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {user ? 'send' : 'lock'}
                  </span>
                </button>
              )}

              {step === 10 && (
                <button
                  type="button"
                  className="rq-btn-primary"
                  onClick={handleSubmit}
                  disabled={!user || submitting}
                >
                  <span>{submitting ? 'Submitting...' : 'Submit Care Request'}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                </button>
              )}
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}

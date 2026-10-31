import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../../../api.js';
import { track } from '../../../analytics.js';

const STORAGE_KEY = 'ay_guided_draft_v2';
const KEY_STORAGE = 'ay_guided_draft_idempotency_key';

function getOrCreateKey() {
  try {
    let k = sessionStorage.getItem(KEY_STORAGE);
    if (!k) {
      k = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) + '-req';
      sessionStorage.setItem(KEY_STORAGE, k);
    }
    return k;
  } catch {
    return `draft-${Date.now()}-req`;
  }
}

const INITIAL_DRAFT = {
  // Step 1: Recipient
  recipientId: null,
  newRecipient: null, // { fullName, relationship, phone, dateOfBirth }
  // Step 2: Services (supports single or multiple services)
  serviceId: null,
  serviceIds: [],
  // Step 3: Hospital
  hospitalId: null,
  // Visit purpose defaults to consultation
  appointmentType: 'Hospital Consultation & Accompaniment',
  additionalRequirements: '',
  // Step 4 (was 5): Schedule Date & Time
  appointmentDate: '',
  appointmentTime: '09:00:00',
  timeSlot: 'Morning (08:00 AM – 12:00 PM)',
  scheduleAt: null,
  // Step 5 (was 6): Doorstep Pickup (Single required option) + Mandatory WhatsApp + Consent
  pickupRequired: true,
  pickupAddress: '',
  dropoffAddress: '',
  updatePhone: '',
  consentAccepted: false,
};

export function useRequestDraft(user) {
  const idempotencyKey = useMemo(getOrCreateKey, []);
  const hasRestoredRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  const [step, setStep] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`${STORAGE_KEY}_step`);
      const n = Number(saved);
      // Strictly clamp between 1 and 6
      return n >= 1 && n <= 6 ? n : 1;
    } catch {
      return 1;
    }
  });

  const [draft, setDraft] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return { ...INITIAL_DRAFT, ...JSON.parse(raw) };
    } catch {}
    return INITIAL_DRAFT;
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Sync to local session storage whenever draft or step changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      sessionStorage.setItem(`${STORAGE_KEY}_step`, String(step));
    } catch {}
  }, [draft, step]);

  // Sync draft to server if user is authenticated (debounced 400ms)
  const syncServerDraft = useCallback((currentDraft, currentStep) => {
    if (!user) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await api.authedDraftPut({
          idempotency_key: idempotencyKey,
          current_step: Math.min(currentStep, 7),
          payload: {
            recipient_id: currentDraft.recipientId,
            service_id: currentDraft.serviceId,
            service_ids: currentDraft.serviceIds?.length > 0 ? currentDraft.serviceIds : (currentDraft.serviceId ? [currentDraft.serviceId] : []),
            hospital_id: currentDraft.hospitalId,
            appointment_type: currentDraft.appointmentType,
            appointment_date: currentDraft.appointmentDate || null,
            schedule_at: currentDraft.scheduleAt || null,
            pickup_required: currentDraft.pickupRequired,
            pickup_address: currentDraft.pickupAddress || null,
            dropoff_address: currentDraft.dropoffAddress || null,
            update_phone: currentDraft.updatePhone || null,
            additional_requirements: currentDraft.additionalRequirements || null,
            consent_accepted: currentDraft.consentAccepted || false,
          },
        });
        track('REQUEST_DRAFT_SAVED', { step: currentStep });
      } catch {
        // Best effort draft sync
      }
    }, 400);
  }, [user?.id, idempotencyKey]);

  // Attempt server draft restore ONCE upon authentication
  useEffect(() => {
    if (!user || hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    api.authedDraftGet(idempotencyKey)
      .then((serverDraft) => {
        if (serverDraft?.payload) {
          const p = serverDraft.payload;
          const restoredServiceIds = Array.isArray(p.service_ids) && p.service_ids.length > 0
            ? p.service_ids
            : (p.service_id ? [p.service_id] : []);
          setDraft((prev) => ({
            ...prev,
            recipientId: p.recipient_id || prev.recipientId,
            serviceId: p.service_id || restoredServiceIds[0] || prev.serviceId,
            serviceIds: restoredServiceIds.length > 0 ? restoredServiceIds : prev.serviceIds,
            hospitalId: p.hospital_id || prev.hospitalId,
            appointmentType: p.appointment_type || prev.appointmentType,
            appointmentDate: p.appointment_date || prev.appointmentDate,
            scheduleAt: p.schedule_at || prev.scheduleAt,
            pickupRequired: p.pickup_required ?? prev.pickupRequired,
            pickupAddress: p.pickup_address || prev.pickupAddress,
            dropoffAddress: p.dropoff_address || prev.dropoffAddress,
            updatePhone: p.update_phone || prev.updatePhone,
            additionalRequirements: p.additional_requirements || prev.additionalRequirements,
            consentAccepted: p.consent_accepted ?? prev.consentAccepted,
          }));
          track('REQUEST_DRAFT_RESUMED', { step: serverDraft.current_step });
        }
      })
      .catch(() => {});
  }, [user?.id, idempotencyKey]);

  // Field updater
  const updateField = useCallback((field, value) => {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'serviceIds') {
        next.serviceId = Array.isArray(value) && value.length > 0 ? value[0] : null;
      } else if (field === 'serviceId') {
        next.serviceIds = value ? [value] : [];
      }
      return next;
    });
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  const toggleServiceId = useCallback((serviceId) => {
    setDraft((prev) => {
      const current = Array.isArray(prev.serviceIds) ? prev.serviceIds : (prev.serviceId ? [prev.serviceId] : []);
      const exists = current.includes(serviceId);
      const nextIds = exists ? current.filter((id) => id !== serviceId) : [...current, serviceId];
      return {
        ...prev,
        serviceIds: nextIds,
        serviceId: nextIds[0] || null,
      };
    });
    setErrors((prev) => {
      if (!prev.service) return prev;
      const copy = { ...prev };
      delete copy.service;
      return copy;
    });
  }, []);

  const updateFields = useCallback((fieldsObj) => {
    setDraft((prev) => ({ ...prev, ...fieldsObj }));
    setErrors({});
  }, []);

  // Validation function per step (6 Steps total)
  const validateStep = useCallback((stepNumber, data = draft) => {
    const errs = {};
    if (stepNumber === 1) {
      if (!data.recipientId && !data.newRecipient?.fullName?.trim()) {
        errs.recipient = 'Please select a care recipient or enter their name';
      }
    } else if (stepNumber === 2) {
      const hasService = (Array.isArray(data.serviceIds) && data.serviceIds.length > 0) || Boolean(data.serviceId);
      if (!hasService) {
        errs.service = 'Please choose at least one care service';
      }
    } else if (stepNumber === 3) {
      if (!data.hospitalId) {
        errs.hospital = 'Please select a hospital or medical centre';
      }
    } else if (stepNumber === 4) {
      // Step 4: Schedule Date & Time
      if (!data.appointmentDate) {
        errs.appointmentDate = 'Please select an appointment date';
      } else {
        const todayStr = new Date().toISOString().slice(0, 10);
        if (data.appointmentDate < todayStr) {
          errs.appointmentDate = 'Appointment date cannot be in the past';
        }
      }
    } else if (stepNumber === 5) {
      // Step 5: Doorstep Pickup & Mandatory Consent
      if (!data.pickupAddress || data.pickupAddress.trim().length < 5) {
        errs.pickupAddress = 'Please enter a complete residence pickup address (at least 5 characters)';
      }
      if (!data.updatePhone || !/^[+0-9\s-]{10,20}$/.test(data.updatePhone.trim())) {
        errs.updatePhone = 'Please enter a valid WhatsApp mobile number (minimum 10 digits)';
      }
      if (!data.consentAccepted) {
        errs.consent = 'You must accept the Terms & Conditions and Privacy Policy to proceed';
      }
    } else if (stepNumber === 6) {
      // Step 6: Review & Identity Verification
      if (!user) {
        errs.auth = 'Please complete identity verification to confirm your care request';
      }
    }
    return errs;
  }, [draft, user]);

  // Step transitions
  const nextStep = useCallback(() => {
    const stepErrors = validateStep(step, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false;
    }
    setErrors({});
    const newStep = Math.min(step + 1, 6);
    setStep(newStep);
    track('REQUEST_STEP_COMPLETED', { step });
    track('REQUEST_STEP_VIEWED', { step: newStep });
    syncServerDraft(draft, newStep);
    return true;
  }, [step, draft, validateStep, syncServerDraft]);

  const prevStep = useCallback(() => {
    if (step <= 1) return;
    const newStep = step - 1;
    setStep(newStep);
    setErrors({});
    track('REQUEST_STEP_BACK', { from: step, to: newStep });
    syncServerDraft(draft, newStep);
  }, [step, draft, syncServerDraft]);

  const goToStep = useCallback((targetStep) => {
    if (targetStep >= 1 && targetStep <= 6) {
      setStep(targetStep);
      setErrors({});
      track('REQUEST_STEP_VIEWED', { step: targetStep, jump: true });
    }
  }, []);

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(`${STORAGE_KEY}_step`);
      sessionStorage.removeItem(KEY_STORAGE);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}_step`);
      localStorage.removeItem(KEY_STORAGE);
    } catch {}
    setDraft(INITIAL_DRAFT);
    setStep(1);
    setErrors({});
    setSubmissionResult(null);
  }, []);

  return {
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
  };
}

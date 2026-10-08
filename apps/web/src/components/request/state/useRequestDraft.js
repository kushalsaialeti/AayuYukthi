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
  // Step 4: Visit / purpose
  appointmentType: '', // e.g. 'Consultation', 'Diagnostic Scan', etc.
  // Step 5: Schedule
  appointmentDate: '',
  timeSlot: 'Morning (08:00 AM – 12:00 PM)',
  scheduleAt: null,
  // Step 6: Pickup & Drop
  pickupRequired: false,
  pickupAddress: '',
  dropoffAddress: '',
  // Step 7: Update recipients
  updatePhone: '',
  // Step 8: Additional requirements
  additionalRequirements: '',
  mobilitySupport: [], // ['wheelchair', 'stretcher', 'vision']
};

export function useRequestDraft(user) {
  const idempotencyKey = useMemo(getOrCreateKey, []);
  const hasRestoredRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  const [step, setStep] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`${STORAGE_KEY}_step`);
      const n = Number(saved);
      return n >= 1 && n <= 12 ? n : 1;
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
          current_step: currentStep,
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

  // Validation function per step
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
      if (!data.appointmentType?.trim()) {
        errs.appointmentType = 'Please specify the visit purpose or specialty';
      }
    } else if (stepNumber === 5) {
      if (!data.appointmentDate) {
        errs.appointmentDate = 'Please select a visit date';
      } else {
        const todayStr = new Date().toISOString().slice(0, 10);
        if (data.appointmentDate < todayStr) {
          errs.appointmentDate = 'Appointment date cannot be in the past';
        }
      }
    } else if (stepNumber === 6) {
      if (data.pickupRequired && (!data.pickupAddress || data.pickupAddress.trim().length < 5)) {
        errs.pickupAddress = 'Please enter a complete pickup address (at least 5 characters)';
      }
    } else if (stepNumber === 7) {
      if (data.updatePhone && !/^[+0-9\s-]{8,20}$/.test(data.updatePhone.trim())) {
        errs.updatePhone = 'Please enter a valid phone number for journey updates';
      }
    }
    return errs;
  }, [draft]);

  // Step transitions
  const nextStep = useCallback(() => {
    const stepErrors = validateStep(step, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false;
    }
    setErrors({});
    const newStep = Math.min(step + 1, 12);
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
    if (targetStep >= 1 && targetStep <= 12) {
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

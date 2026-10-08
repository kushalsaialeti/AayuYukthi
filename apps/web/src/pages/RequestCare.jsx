import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { track } from '../analytics.js';
import { useCustomerAuth } from '../auth.jsx';
import { useDocumentMeta, Loading, LoadError } from '../components/layout.jsx';
import { GuidedRequestEngine } from '../components/request/engine/GuidedRequestEngine.jsx';

const STEP_BLOCK_KEYS = [
  'auth.email_enabled',
  'auth.phone_enabled',
  ...Array.from({ length: 12 }, (_, i) => [
    `request.step${i + 1}.eyebrow`,
    `request.step${i + 1}.title`,
    `request.step${i + 1}.desc`,
  ]).flat(),
];

export function RequestCare({ locale }) {
  const { user } = useCustomerAuth();
  const [searchParams] = useSearchParams();

  const [services, setServices] = useState(null);
  const [hospitals, setHospitals] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [cmsBlocks, setCmsBlocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const startedTrackedRef = useRef(false);

  useDocumentMeta('Request Care', 'Personalized guided care accompaniment request.');

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const promises = [
        api.services({ limit: 50 }).catch(() => ({ data: [] })),
        api.hospitals({ limit: 50 }).catch(() => ({ data: [] })),
        api.blocks(STEP_BLOCK_KEYS).catch(() => ({})),
      ];

      if (user?.id) {
        promises.push(api.recipients({ limit: 50 }).catch(() => ({ data: [] })));
      }

      const [svcRes, hospRes, blocksRes, recRes] = await Promise.all(promises);
      setServices(svcRes?.data || []);
      setHospitals(hospRes?.data || []);
      setCmsBlocks(blocksRes || {});
      setRecipients(recRes?.data || []);

      if (!startedTrackedRef.current) {
        startedTrackedRef.current = true;
        track('REQUEST_STARTED');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const refreshRecipients = async () => {
    if (!user) return;
    try {
      const res = await api.recipients({ limit: 50 });
      setRecipients(res?.data || []);
    } catch {}
  };

  if (loading) {
    return <Loading t={{ loading: 'Loading care request...' }} />;
  }

  if (error) {
    return <LoadError t={{ retry: 'Retry' }} onRetry={loadData} />;
  }

  // Pre-selected service or hospital from query parameters if visitor navigated from Home / Services / Hospitals
  const initialServiceId = searchParams.get('service_id');
  const initialHospitalId = searchParams.get('hospital_id');

  return (
    <GuidedRequestEngine
      services={services || []}
      hospitals={hospitals || []}
      recipients={recipients || []}
      cmsBlocks={cmsBlocks || {}}
      onRefreshRecipients={refreshRecipients}
      initialServiceId={initialServiceId}
      initialHospitalId={initialHospitalId}
    />
  );
}

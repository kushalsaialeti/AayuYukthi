import React from 'react';

export function TelemetryDiagnostics({
  apiStatus = 'Normal (18ms)',
  meshStatus = 'Re-syncing',
  smsStatus = 'Active & Polling',
  batteryLevel = '88%',
  signalStatus = 'Degraded',
}) {
  const sparklineData = [
    { time: '10:20 AM', value: 85, level: 'normal' },
    { time: '10:25 AM', value: 90, level: 'normal' },
    { time: '10:30 AM', value: 100, level: 'normal' },
    { time: '10:35 AM', value: 95, level: 'normal' },
    { time: '10:40 AM', value: 60, level: 'degraded' },
    { time: '10:45 AM', value: 25, level: 'low' },
    { time: '10:50 AM', value: 15, level: 'offline' },
  ];

  return (
    <div className="rd-card" style={{ gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
          Diagnostics &amp; Mesh Health
        </h3>
        <span
          style={{
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--cust-tertiary, #6d230f)',
            boxShadow: '0 0 6px rgba(109, 35, 15, 0.4)',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem' }}>
        {/* Core API Server */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: 'var(--cust-surface-container-low)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cust-on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-primary)' }}>dns</span>
            <span>Core API Server</span>
          </span>
          <span style={{ fontWeight: 600, color: 'var(--cust-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: 'var(--cust-primary)' }} />
            <span>{apiStatus}</span>
          </span>
        </div>

        {/* Ground Mesh Link */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: 'rgba(255, 219, 210, 0.4)',
          color: 'var(--cust-on-tertiary-fixed-variant)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-tertiary)' }}>wifi_off</span>
            <span>Ground Mesh Link</span>
          </span>
          <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', animation: 'spin 1.5s linear infinite' }}>refresh</span>
            <span>{meshStatus}</span>
          </span>
        </div>

        {/* SMS Failover Daemon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: 'var(--cust-surface-container-low)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cust-on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-primary)' }}>mark_chat_unread</span>
            <span>SMS Failover Daemon</span>
          </span>
          <span style={{ fontWeight: 600, color: 'var(--cust-primary)' }}>
            {smsStatus}
          </span>
        </div>

        {/* Badge Battery */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: 'var(--cust-surface-container-low)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cust-on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-secondary)' }}>battery_charging_full</span>
            <span>Escort Badge Battery</span>
          </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
            {batteryLevel}
          </span>
        </div>
      </div>

      {/* Sparkline Micro Visualizer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingTop: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
          <span>Signal Confidence Log (Last 30m)</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--cust-tertiary)' }}>
            {signalStatus}
          </span>
        </div>

        <div style={{
          width: '100%',
          height: '2rem',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.25rem',
          padding: '0 0.25rem',
        }}>
          {sparklineData.map((bar, i) => {
            const heightPercent = `${Math.max(15, bar.value)}%`;
            const isDegraded = bar.level === 'degraded' || bar.level === 'low';
            const isOffline = bar.level === 'offline';

            return (
              <div
                key={i}
                className={`rd-sparkline-bar ${isDegraded ? 'is-degraded' : ''} ${isOffline ? 'is-offline' : ''}`}
                style={{ height: heightPercent }}
                title={`${bar.time} - ${bar.value}% confidence`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

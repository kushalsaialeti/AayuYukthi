import React from 'react';

export function AuthComplianceBadges({
  sslText = 'Connections encrypted in transit (HTTPS)',
  privacyText = '',
}) {
  return (
    <div className="ay-auth-compliance-row">
      <div className="ay-compliance-item">
        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--ay-auth-secondary)' }}>
          enhanced_encryption
        </span>
        <span>{sslText}</span>
      </div>
      {privacyText && (
        <>
          <span style={{ opacity: 0.4 }}>•</span>
          <div className="ay-compliance-item">
            <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--ay-auth-secondary)' }}>
              gavel
            </span>
            <span>{privacyText}</span>
          </div>
        </>
      )}
    </div>
  );
}

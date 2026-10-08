import React from 'react';

export function AuthComplianceBadges({
  sslText = '256-bit SSL Protected',
  privacyText = 'ISO 27001 Certified Indian Health Data Privacy',
}) {
  return (
    <div className="ay-auth-compliance-row">
      <div className="ay-compliance-item">
        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--ay-auth-secondary)' }}>
          enhanced_encryption
        </span>
        <span>{sslText}</span>
      </div>
      <span style={{ opacity: 0.4 }}>•</span>
      <div className="ay-compliance-item">
        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--ay-auth-secondary)' }}>
          gavel
        </span>
        <span>{privacyText}</span>
      </div>
    </div>
  );
}

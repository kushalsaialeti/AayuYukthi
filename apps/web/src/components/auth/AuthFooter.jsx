import React from 'react';
import { Link } from 'react-router-dom';

export function AuthFooter({ helplineNumber = '', helplineTel = '' }) {
  const currentYear = new Date().getFullYear();
  const showHelpline = Boolean(helplineNumber && helplineTel);

  return (
    <footer className="ay-auth-footer">
      <div className="ay-auth-footer-inner">
        <div className="ay-auth-footer-left">
          {showHelpline && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--ay-auth-primary)' }}>
                  support_agent
                </span>
                <span style={{ fontWeight: 600 }}>Care Helpline:</span>
                <a href={helplineTel} className="ay-auth-helpline-link">
                  {helplineNumber}
                </a>
              </div>
              <span style={{ opacity: 0.5 }}>•</span>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--ay-auth-secondary)' }}>
              lock
            </span>
            <span>Connections encrypted in transit (HTTPS)</span>
          </div>
        </div>

        <div className="ay-auth-footer-right">
          <Link to="/about" className="ay-auth-footer-link">Privacy Policy</Link>
          <span style={{ opacity: 0.5 }}>•</span>
          <Link to="/about" className="ay-auth-footer-link">Terms of Service</Link>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>© {currentYear} AayuYukthi Care</span>
        </div>
      </div>
    </footer>
  );
}

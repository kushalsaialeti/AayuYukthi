import React from 'react';
import { Link } from 'react-router-dom';

export function AuthHeader({ subtitle = 'Care Portal', returnTo = '/' }) {
  return (
    <header className="ay-auth-header">
      <div className="ay-auth-header-inner">
        <Link to="/" className="ay-auth-brand" aria-label="AayuYukthi Home">
          <div className="ay-auth-logo-badge">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_with_heart
            </span>
          </div>
          <span className="ay-auth-brand-name">AayuYukthi</span>
          {subtitle && <span className="ay-auth-brand-pill">{subtitle}</span>}
        </Link>

        <nav aria-label="Auth navigation">
          <Link to={returnTo} className="ay-auth-return-link">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Return to Home</span>
          </Link>
        </nav>

        <div className="ay-auth-user-icon" aria-hidden="true">
          <span className="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
}

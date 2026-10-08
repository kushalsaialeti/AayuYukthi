import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../../api.js';
import { AuthHeader } from './AuthHeader.jsx';
import { AuthFooter } from './AuthFooter.jsx';
import './auth.css';

const AuthCmsContext = createContext({});
export const useAuthCms = () => useContext(AuthCmsContext);

const AUTH_CMS_KEYS = [
  'auth.login.badge',
  'auth.login.title',
  'auth.login.description',
  'auth.login.feature_1',
  'auth.login.feature_2',
  'auth.login.feature_3',
  'auth.login.testimonial_quote',
  'auth.login.testimonial_author',
  'auth.login.testimonial_detail',
  'auth.signup.badge',
  'auth.signup.title',
  'auth.signup.description',
  'auth.signup.feature_1',
  'auth.signup.feature_2',
  'auth.signup.feature_3',
  'auth.signup.social_proof_title',
  'auth.signup.social_proof_cities',
  'auth.signup.social_proof_quote',
  'auth.otp.badge',
  'auth.otp.title',
  'auth.otp.description',
  'auth.otp.feature_1',
  'auth.otp.feature_2',
  'auth.otp.tip',
  'auth.otp.coordinator_note',
  'auth.helpline.number',
  'auth.helpline.tel',
  'auth.compliance.ssl',
  'auth.compliance.privacy',
];

export function AuthLayout({
  children,
  subtitle = 'Care Portal',
  returnTo = '/',
}) {
  const [cmsBlocks, setCmsBlocks] = useState({});

  useEffect(() => {
    let mounted = true;
    api.blocks(AUTH_CMS_KEYS)
      .then((data) => {
        if (mounted && data) {
          setCmsBlocks(data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const helplineNumber = cmsBlocks['auth.helpline.number']?.body_en || '1800-AAYU-CARE';
  const helplineTel = cmsBlocks['auth.helpline.tel']?.body_en || 'tel:180022982273';

  return (
    <AuthCmsContext.Provider value={cmsBlocks}>
      <div className="ay-auth-page">
        <AuthHeader subtitle={subtitle} returnTo={returnTo} />
        <main className="ay-auth-main">
          {children}
        </main>
        <AuthFooter helplineNumber={helplineNumber} helplineTel={helplineTel} />
      </div>
    </AuthCmsContext.Provider>
  );
}

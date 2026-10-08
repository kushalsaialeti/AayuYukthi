import { describe, it, expect } from 'vitest';
import { validateContact } from './pages/Contact.jsx';

describe('contact form validation', () => {
  const base = { name: 'Lakshmi', email: 'l@example.com', phone: '', subject: '', message: 'Need pickup help' };

  it('accepts email-only and phone-only channels', () => {
    expect(validateContact(base)).toEqual({});
    expect(validateContact({ ...base, email: '', phone: '+919876543210' })).toEqual({});
  });

  it('requires a channel, name, and message', () => {
    const errs = validateContact({ name: '', email: '', phone: '', subject: '', message: '' });
    expect(errs.name).toBeTruthy();
    expect(errs.email).toBeTruthy();
    expect(errs.message).toBeTruthy();
  });

  it('rejects malformed email and non-E.164 phones', () => {
    expect(validateContact({ ...base, email: 'nope' }).email).toBeTruthy();
    expect(validateContact({ ...base, email: '', phone: '98765' }).phone).toBeTruthy();
  });

  it('rejects oversized messages (mirrors the 5000-char API limit)', () => {
    expect(validateContact({ ...base, message: 'x'.repeat(5001) }).message).toBeTruthy();
  });
});

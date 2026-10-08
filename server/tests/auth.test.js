import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/modules/auth/password.js';
import { signAccessToken, verifyAccessToken, generateRefreshToken, hashToken } from '../src/modules/auth/tokens.js';

describe('password hashing (scrypt)', () => {
  it('hashes and verifies, rejects wrong passwords', async () => {
    const hash = await hashPassword('correct-horse-123');
    expect(hash).not.toContain('correct-horse-123');
    expect(await verifyPassword('correct-horse-123', hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('rejects too-short passwords at hash time', async () => {
    await expect(hashPassword('short')).rejects.toThrow();
  });

  it('produces unique salts', async () => {
    const a = await hashPassword('same-password-1');
    const b = await hashPassword('same-password-1');
    expect(a).not.toBe(b);
  });
});

describe('access + refresh tokens', () => {
  it('sign/verify round-trips id and roles', () => {
    const token = signAccessToken({ id: 'user-123', roles: ['customer'] });
    expect(verifyAccessToken(token)).toEqual({ id: 'user-123', roles: ['customer'] });
  });

  it('rejects tampered tokens', () => {
    const token = signAccessToken({ id: 'user-123', roles: [] });
    const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa');
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('refresh tokens hash irreversibly (sha-256)', () => {
    const raw = generateRefreshToken();
    const digest = hashToken(raw);
    expect(digest).not.toContain(raw);
    expect(digest).toHaveLength(64);
    expect(hashToken(raw)).toBe(digest);
  });
});

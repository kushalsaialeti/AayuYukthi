import crypto from 'node:crypto';

// scrypt-based password hashing (stdlib only — no native deps).
// Stored format: scrypt$<N>$<r>$<p>$<saltHex>$<derivedHex>
const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;

export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      reject(new Error('Password must be 8–128 characters'));
      return;
    }
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, KEYLEN, { N, r, p }, (err, derived) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(`scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${derived.toString('hex')}`);
    });
  });
}

export function verifyPassword(password, stored) {
  return new Promise((resolve, reject) => {
    if (typeof password !== 'string' || typeof stored !== 'string') {
      resolve(false);
      return;
    }
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') {
      resolve(false);
      return;
    }
    const [, nStr, rStr, pStr, saltHex, keyHex] = parts;
    const opts = { N: Number(nStr), r: Number(rStr), p: Number(pStr) };
    if (!Number.isFinite(opts.N) || !Number.isFinite(opts.r) || !Number.isFinite(opts.p)) {
      resolve(false);
      return;
    }
    crypto.scrypt(password, Buffer.from(saltHex, 'hex'), KEYLEN, opts, (err, derived) => {
      if (err) {
        reject(err);
        return;
      }
      const expected = Buffer.from(keyHex, 'hex');
      if (expected.length !== derived.length) {
        resolve(false);
        return;
      }
      resolve(crypto.timingSafeEqual(expected, derived));
    });
  });
}

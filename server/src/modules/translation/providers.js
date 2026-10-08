import crypto from 'node:crypto';
import { logger } from '../../config/logger.js';

// External translation provider abstraction. Configure at deploy time:
//
//   TRANSLATION_API_URL  LibreTranslate-compatible endpoint (POST {q, source, target, format})
//   TRANSLATION_API_KEY  API key (sent as Authorization: Bearer when set)
//   TRANSLATION_TIMEOUT_MS (default 8000)
//
// When unconfigured, translate() throws TRANSLATION_UNAVAILABLE and callers
// fall back to English — the product works without credentials, just in English.

export function providerConfig() {
  return {
    url: process.env.TRANSLATION_API_URL ?? null,
    key: process.env.TRANSLATION_API_KEY ?? null,
    timeoutMs: Number(process.env.TRANSLATION_TIMEOUT_MS ?? 8000),
  };
}

let override = null;
export function setTranslationProvider(next) {
  override = next;
}

export async function translateText({ text, targetLocale, sourceLocale = 'en' }) {
  if (override) return override.translate({ text, targetLocale, sourceLocale });
  const { url, key, timeoutMs } = providerConfig();
  if (!url) {
    const err = new Error('Translation provider is not configured');
    err.code = 'TRANSLATION_UNAVAILABLE';
    throw err;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({ q: text, source: sourceLocale, target: targetLocale, format: 'text' }),
    });
    if (!res.ok) throw new Error(`Provider responded ${res.status}`);
    const body = await res.json();
    const translated = body.translatedText ?? body.translation ?? null;
    if (!translated) throw new Error('Provider returned no translation');
    return { text: translated, provider: 'external' };
  } catch (err) {
    logger.error({ err: err.message, targetLocale }, 'Translation provider failed');
    const wrapped = new Error('Translation failed');
    wrapped.code = 'TRANSLATION_FAILED';
    throw wrapped;
  } finally {
    clearTimeout(timer);
  }
}

export function sourceHash(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

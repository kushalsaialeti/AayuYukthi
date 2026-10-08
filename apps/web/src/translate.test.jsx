import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translateItems, lookupTranslation } from './translate.jsx';

const item = { entity_type: 'services', entity_id: 's1', field: 'title_en' };

describe('translation cache + fallback', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns English immediately for locale en without fetching', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const out = await translateItems([item], 'en');
    expect(out).toEqual({});
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(lookupTranslation('services', 's1', 'title_en', 'en', 'Hello')).toBe('Hello');
  });

  it('falls back to source text when the provider fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    const out = await translateItems([{ ...item, entity_id: 's-fail' }], 'te');
    expect(out['services:s-fail:title_en']).toBeNull();
    expect(lookupTranslation('services', 's-fail', 'title_en', 'te', 'Hello')).toBe('Hello');
  });
});

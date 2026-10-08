import { providerConfig } from './provider.js';
import { cloudinaryProvider } from './cloudinaryProvider.js';

// Provider selection is configuration-driven (MEDIA_PROVIDER) and lives in
// exactly one place. Callers use selectProvider(), never `if provider ===`.
export function selectProvider() {
  const cfg = providerConfig();
  if (cfg.name !== 'cloudinary') {
    const err = new Error(`Unknown MEDIA_PROVIDER "${cfg.name}"`);
    err.code = 'MEDIA_NOT_CONFIGURED';
    err.statusCode = 503;
    throw err;
  }
  return cloudinaryProvider;
}

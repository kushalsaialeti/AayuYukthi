import { logger } from '../../config/logger.js';

// MediaService provider contract. Business logic talks to selectProvider();
// Cloudinary specifics live ONLY in cloudinaryProvider.js. A future S3/GCS
// provider implements these same operations — no call-site changes.
//
//   upload(buffer|path, opts)      -> { assetId, url, width, height, format, bytes }
//   remove(assetId)                -> void (controlled cleanup only)
//   metadata(assetId)              -> { width, height, format, bytes } | null
//   deliveryUrl(assetId, opts)    -> optimized CDN URL (pure, no network)
//   uploadSignature(params)        -> { signature, timestamp, apiKey, cloudName }
//   exists(assetId)                -> boolean

export function providerConfig() {
  return {
    name: process.env.MEDIA_PROVIDER ?? 'cloudinary',
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? null,
    apiKey: process.env.CLOUDINARY_API_KEY ?? null,
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? null,
    maxBytes: Number(process.env.MEDIA_MAX_BYTES ?? 10 * 1024 * 1024),
  };
}

export function isConfigured(cfg = providerConfig()) {
  return !!(cfg.cloudName && cfg.apiKey && cfg.apiSecret);
}

// Dev fallback: no credentials → reference registration + local URLs only.
// Uploads/signatures fail closed with MEDIA_NOT_CONFIGURED.
export const logProvider = {
  name: 'log',
  async upload() {
    throw mediaError('Cloudinary is not configured');
  },
  async remove() {
    throw mediaError('Cloudinary is not configured');
  },
  async metadata() {
    return null;
  },
  deliveryUrl() {
    throw mediaError('Cloudinary is not configured');
  },
  uploadSignature() {
    throw mediaError('Cloudinary is not configured');
  },
  async exists() {
    return false;
  },
};

export function mediaError(message) {
  const err = new Error(message);
  err.code = 'MEDIA_NOT_CONFIGURED';
  err.statusCode = 503;
  return err;
}

export function logOrThrow(promise) {
  return promise.catch((err) => {
    logger.error({ err: err.message }, 'Media provider call failed');
    throw err;
  });
}

import { v2 as cloudinary } from 'cloudinary';
import { providerConfig, isConfigured, mediaError } from './provider.js';

// The ONLY file allowed to speak Cloudinary: public IDs, transformations,
// signatures, delivery URLs. Everything else uses media_id + requirements.

let configured = false;

function client() {
  const cfg = providerConfig();
  if (!isConfigured(cfg)) throw mediaError('Cloudinary credentials are not configured');
  if (!configured) {
    cloudinary.config({ cloud_name: cfg.cloudName, api_key: cfg.apiKey, api_secret: cfg.apiSecret, secure: true });
    configured = true;
  }
  return cloudinary;
}

// Provider-independent requirements → Cloudinary transformation.
// Defaults encode the house policy: f_auto + q_auto, responsive widths,
// master preserved (never upscale, never recompress derivatives).
export function buildTransformation({ width, height, fit = 'cover', quality = 'auto', format = 'auto', dpr } = {}) {
  const t = { fetch_format: format === 'auto' ? 'auto' : format, quality: quality === 'auto' ? 'auto' : quality, flags: [] };
  if (width) {
    t.width = width;
    t.crop = fit === 'contain' ? 'fit' : height ? 'fill' : 'limit';
  }
  if (height && width) t.height = height;
  if (dpr) t.dpr = dpr;
  return t;
}

export function deliveryUrlFor(publicId, opts = {}) {
  const cfg = providerConfig();
  if (!isConfigured(cfg)) throw mediaError('Cloudinary credentials are not configured');
  client();
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: opts.resourceType ?? 'image',
    ...buildTransformation(opts),
  });
}

export const cloudinaryProvider = {
  name: 'cloudinary',

  async upload(file, { folder = 'aayuyukthi', publicId = null, resourceType = 'image' } = {}) {
    const c = client();
    const res = await c.uploader.upload(file, {
      folder,
      public_id: publicId ?? undefined,
      resource_type: resourceType,
      // Master preservation: keep original; derivatives generated on delivery.
      quality: 'auto:best',
      fetch_format: undefined,
    });
    return {
      assetId: res.public_id,
      url: res.secure_url,
      width: res.width ?? null,
      height: res.height ?? null,
      format: res.format ?? null,
      bytes: res.bytes ?? null,
    };
  },

  async remove(assetId, { resourceType = 'image' } = {}) {
    const c = client();
    await c.uploader.destroy(assetId, { resource_type: resourceType });
  },

  async metadata(assetId, { resourceType = 'image' } = {}) {
    const c = client();
    try {
      const res = await c.api.resource(assetId, { resource_type: resourceType });
      return { width: res.width ?? null, height: res.height ?? null, format: res.format ?? null, bytes: res.bytes ?? null };
    } catch {
      return null;
    }
  },

  deliveryUrl(assetId, opts = {}) {
    return deliveryUrlFor(assetId, opts);
  },

  uploadSignature({ folder = 'aayuyukthi', publicId = null } = {}) {
    const cfg = providerConfig();
    if (!isConfigured(cfg)) throw mediaError('Cloudinary credentials are not configured');
    const c = client();
    const timestamp = Math.round(Date.now() / 1000);
    const params = { timestamp, folder, ...(publicId ? { public_id: publicId } : {}) };
    return {
      signature: c.utils.api_sign_request(params, cfg.apiSecret),
      timestamp,
      apiKey: cfg.apiKey,
      cloudName: cfg.cloudName,
      folder,
      ...(publicId ? { publicId } : {}),
    };
  },

  async exists(assetId, { resourceType = 'image' } = {}) {
    return (await this.metadata(assetId, { resourceType })) !== null;
  },
};

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

import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { validateUuidParam } from '../../middleware/validateUuid.js';
import { requireAuth, requireOperations } from '../../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../../utils/http.js';
import { actorFrom } from '../audit/writer.js';
import {
  mediaRegisterSchema, mediaSignatureSchema, createMedia, listMedia,
  uploadSignature, archiveMedia, deleteMedia, getMedia, mediaVariants,
} from './service.js';
import { cloudinaryProvider } from './cloudinaryProvider.js';
import { providerConfig, isConfigured } from './provider.js';

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export function createMediaOpsRouter(db) {
  const router = Router();
  router.use(requireAuth, requireOperations());
  router.param('id', validateUuidParam);

  router.get('/', validate(listQuery, 'query'), async (req, res, next) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { items, total } = await listMedia(db, { page, limit, q: req.query.q, status: req.query.status });
      res.json(paginatedResponse(items, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  // Direct upload endpoint for images: accepts base64 dataUri, Google Drive link, or web URL.
  // Converts and stores as optimized WebP format with preserved quality.
  router.post('/upload', async (req, res, next) => {
    try {
      const { dataUri, url, alt_text, entity_type, entity_id } = req.body || {};
      if (!dataUri && !url) {
        return res.status(400).json({ error: 'Either dataUri (file) or url (web / Google Drive link) must be provided' });
      }

      let source = (dataUri || url).trim();
      // Resolve Google Drive sharing links to direct image source
      if (source.includes('drive.google.com') || source.includes('docs.google.com')) {
        const fileIdMatch = source.match(/\/d\/([a-zA-Z0-9_-]+)/) || source.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
          source = `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
        }
      }

      const cfg = providerConfig();
      if (isConfigured(cfg)) {
        const upRes = await cloudinaryProvider.upload(source, { folder: 'aayuyukthi' });
        const webpUrl = upRes.url.replace(/\/upload\//, '/upload/f_webp,q_auto:good/');
        const record = await createMedia(db, actorFrom(req), {
          provider: 'cloudinary',
          provider_asset_id: upRes.assetId,
          url: webpUrl,
          mime_type: 'image/webp',
          size_bytes: upRes.bytes,
          width: upRes.width,
          height: upRes.height,
          format: 'webp',
          alt_text: alt_text || '',
          entity_type: entity_type || null,
          entity_id: entity_id || null,
        });
        return res.status(201).json({
          data: {
            ...record,
            url: webpUrl,
            webp_url: webpUrl,
            provider_asset_id: upRes.assetId,
          },
        });
      }

      // External reference registration fallback
      const record = await createMedia(db, actorFrom(req), {
        provider: 'external',
        url: source,
        mime_type: 'image/webp',
        alt_text: alt_text || '',
        entity_type: entity_type || null,
        entity_id: entity_id || null,
      });
      res.status(201).json({ data: { ...record, url: source, webp_url: source } });
    } catch (err) {
      next(err);
    }
  });

  // Signed upload parameters: the browser uploads straight to the provider;
  // the secret never leaves the server.
  router.post('/signature', validate(mediaSignatureSchema), async (req, res, next) => {
    try {
      res.json({ data: uploadSignature(req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', validate(mediaRegisterSchema), async (req, res, next) => {
    try {
      res.status(201).json({ data: await createMedia(db, actorFrom(req), req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      res.json({ data: await getMedia(db, req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/archive', async (req, res, next) => {
    try {
      res.json({ data: await archiveMedia(db, actorFrom(req), req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      res.json({ data: await deleteMedia(db, actorFrom(req), req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

// Public delivery endpoint: the ONLY place frontend URLs come from.
// No Cloudinary URLs are ever hardcoded in React.
export function createMediaPublicRouter(db) {
  const router = Router();
  router.param('id', validateUuidParam);

  router.get('/:id', async (req, res, next) => {
    try {
      const widths = String(req.query.widths ?? '400,768,1200').split(',').map((w) => Number(w.trim())).filter(Boolean);
      res.json({ data: await mediaVariants(db, req.params.id, widths) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

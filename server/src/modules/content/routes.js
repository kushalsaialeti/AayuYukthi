import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { validateUuidParam } from '../../middleware/validateUuid.js';
import { cachePublic, getCached, setCached } from '../../utils/cache.js';
import { requireAuth, requireOperations } from '../../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../../utils/http.js';
import { actorFrom } from '../audit/writer.js';
import {
  heroSlideSchema, heroSlideUpdateSchema, faqSchema, faqUpdateSchema,
  testimonialSchema, testimonialUpdateSchema, contentBlockSchema,
  contentBlockUpdateSchema, contactSettingsSchema,
} from './schemas.js';
import {
  heroSlides, faqs, testimonials, listContentBlocks, upsertContentBlock, deleteContentBlock,
  getPublishedBlock, getPublishedBlocks, getContactSettings, updateContactSettings,
} from './service.js';

const ENTITY_CONFIG = [
  { name: 'hero-slides', entity: heroSlides, create: heroSlideSchema, update: heroSlideUpdateSchema, cols: ['title_en', 'description_en', 'short_label_en', 'image_media_id', 'primary_cta_label_en', 'primary_cta_url', 'secondary_cta_label_en', 'secondary_cta_url', 'sort_order', 'is_active'] },
  { name: 'faqs', entity: faqs, create: faqSchema, update: faqUpdateSchema, cols: ['question_en', 'answer_en', 'category', 'sort_order', 'is_published'] },
  { name: 'testimonials', entity: testimonials, create: testimonialSchema, update: testimonialUpdateSchema, cols: ['author_name', 'author_detail_en', 'quote_en', 'rating', 'image_media_id', 'is_published', 'sort_order'] },
];

export function createContentOpsRouter(db) {
  const router = Router();
  router.use(requireAuth, requireOperations());
  router.param('id', validateUuidParam);

  for (const cfg of ENTITY_CONFIG) {
    router.get(`/${cfg.name}`, async (req, res, next) => {
      try {
        const { page, limit } = parsePagination(req.query);
        const { items, total } = await cfg.entity.list(db, { page, limit });
        res.json(paginatedResponse(items, total, page, limit));
      } catch (err) {
        next(err);
      }
    });
    router.post(`/${cfg.name}`, validate(cfg.create), async (req, res, next) => {
      try {
        res.status(201).json({ data: await cfg.entity.create(db, actorFrom(req), req.body, cfg.cols) });
      } catch (err) {
        next(err);
      }
    });
    router.get(`/${cfg.name}/:id`, async (req, res, next) => {
      try {
        res.json({ data: await cfg.entity.get(db, req.params.id) });
      } catch (err) {
        next(err);
      }
    });
    router.patch(`/${cfg.name}/:id`, validate(cfg.update), async (req, res, next) => {
      try {
        res.json({ data: await cfg.entity.update(db, actorFrom(req), req.params.id, req.body) });
      } catch (err) {
        next(err);
      }
    });
    router.delete(`/${cfg.name}/:id`, async (req, res, next) => {
      try {
        res.json({ data: await cfg.entity.remove(db, actorFrom(req), req.params.id) });
      } catch (err) {
        next(err);
      }
    });
  }

  router.get('/content-blocks', async (_req, res, next) => {
    try {
      res.json({ data: await listContentBlocks(db) });
    } catch (err) {
      next(err);
    }
  });
  router.put('/content-blocks', validate(contentBlockSchema), async (req, res, next) => {
    try {
      res.json({ data: await upsertContentBlock(db, actorFrom(req), req.body) });
    } catch (err) {
      next(err);
    }
  });
  router.patch('/content-blocks/:key', validate(contentBlockUpdateSchema), async (req, res, next) => {
    try {
      res.json({ data: await upsertContentBlock(db, actorFrom(req), { ...req.body, key: req.params.key }) });
    } catch (err) {
      next(err);
    }
  });
  router.delete('/content-blocks/:key', async (req, res, next) => {
    try {
      res.json({ data: await deleteContentBlock(db, actorFrom(req), req.params.key) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/contact-settings', async (_req, res, next) => {
    try {
      res.json({ data: await getContactSettings(db) });
    } catch (err) {
      next(err);
    }
  });
  router.put('/contact-settings', validate(contactSettingsSchema), async (req, res, next) => {
    try {
      res.json({ data: await updateContactSettings(db, actorFrom(req), req.body) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export function createContentPublicRouter(db) {
  const router = Router();

  // Home bundle: everything the public home page needs in one round trip.
  router.get('/home', async (_req, res, next) => {
    try {
      cachePublic(res);
      const cacheKey = 'home_bundle';
      const cached = getCached(cacheKey);
      if (cached) return res.json({ data: cached });

      const [hero, faqList, testimonialList] = await Promise.all([
        heroSlides.list(db, { page: 1, limit: 10, publishedOnly: true }),
        faqs.list(db, { page: 1, limit: 20, publishedOnly: true }),
        testimonials.list(db, { page: 1, limit: 10, publishedOnly: true }),
      ]);
      const data = { hero: hero.items, faqs: faqList.items, testimonials: testimonialList.items };
      setCached(cacheKey, data, 30_000);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  });

  router.get('/faqs', async (req, res, next) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { items, total } = await faqs.list(db, { page, limit, publishedOnly: true });
      res.json(paginatedResponse(items, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  router.get('/blocks/:key', async (req, res, next) => {
    try {
      res.json({ data: await getPublishedBlock(db, req.params.key) });
    } catch (err) {
      next(err);
    }
  });

  // Batch blocks: homepage sections (trust, steps, pillars, CTA copy) in one trip.
  // Missing keys are omitted (frontend renders fallbacks), never 404.
  router.get('/blocks', async (req, res, next) => {
    try {
      cachePublic(res);
      const keys = String(req.query.keys ?? '').split(',').map((k) => k.trim()).filter(Boolean).slice(0, 100);
      res.json({ data: await getPublishedBlocks(db, keys) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/contact', async (_req, res, next) => {
    try {
      res.json({ data: await getContactSettings(db) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

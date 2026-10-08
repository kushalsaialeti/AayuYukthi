import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useTranslatedText } from '../translate.jsx';
import { useDocumentMeta, Loading, LoadError } from '../components/layout.jsx';
import { AboutHero } from '../components/about/AboutHero.jsx';
import { AboutStory } from '../components/about/AboutStory.jsx';
import { AboutMissionVisionValues } from '../components/about/AboutMissionVisionValues.jsx';
import { AboutContrast } from '../components/about/AboutContrast.jsx';
import { AboutLeadership } from '../components/about/AboutLeadership.jsx';
import { AboutCta } from '../components/about/AboutCta.jsx';
import '../components/about/about.css';

const ABOUT_CMS_KEYS = [
  // Legacy keys
  'about.story',
  'about.mission',
  'about.vision',
  'about.values',

  // Hero
  'about.hero.badge',
  'about.hero.title',
  'about.hero.description',
  'about.hero.primary_label',
  'about.hero.primary_url',
  'about.hero.secondary_label',
  'about.hero.secondary_url',
  'about.hero.image_url',
  'about.hero.image_caption',
  'about.hero.image_sub',
  'about.hero.image_badge',

  // Metrics
  'about.metric1.value',
  'about.metric1.label',
  'about.metric1.sub',
  'about.metric2.value',
  'about.metric2.label',
  'about.metric2.sub',
  'about.metric3.value',
  'about.metric3.label',
  'about.metric3.sub',
  'about.metric4.value',
  'about.metric4.label',
  'about.metric4.sub',

  // Story
  'about.story.badge',
  'about.story.title',
  'about.story.body1',
  'about.story.body2',
  'about.story.quote',
  'about.story.quote_author',
  'about.story.quote_role',
  'about.story.body3',

  // Mission & Vision
  'about.mission.badge',
  'about.mission.title',
  'about.mission.body',
  'about.vision.badge',
  'about.vision.title',
  'about.vision.body',

  // Values
  'about.values.badge',
  'about.values.title',
  'about.values.sub',
  'about.val1.icon',
  'about.val1.title',
  'about.val1.body',
  'about.val2.icon',
  'about.val2.title',
  'about.val2.body',
  'about.val3.icon',
  'about.val3.title',
  'about.val3.body',
  'about.val4.icon',
  'about.val4.title',
  'about.val4.body',
  'about.val5.icon',
  'about.val5.title',
  'about.val5.body',
  'about.val6.icon',
  'about.val6.title',
  'about.val6.body',

  // Contrast
  'about.contrast.badge',
  'about.contrast.title',
  'about.contrast.sub',

  // Leadership
  'about.leadership.badge',
  'about.leadership.title',
  'about.leadership.sub',
  'about.leader1.name',
  'about.leader1.role',
  'about.leader1.bio',
  'about.leader1.image',
  'about.leader2.name',
  'about.leader2.role',
  'about.leader2.bio',
  'about.leader2.image',
  'about.leader3.name',
  'about.leader3.role',
  'about.leader3.bio',
  'about.leader3.image',

  // CTA & Notice
  'about.cta.badge',
  'about.cta.title',
  'about.cta.body',
  'about.cta.primary_label',
  'about.cta.primary_url',
  'about.cta.secondary_label',
  'about.cta.secondary_url',
  'about.cta.disclaimer',
];

export function About({ t = {}, locale = 'en' }) {
  const [cmsBlocks, setCmsBlocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useDocumentMeta('About Us', 'The founding purpose, mission, and values behind AayuYukthi care accompaniment.');

  const load = async () => {
    setError(null);
    try {
      const blk = await api.blocks(ABOUT_CMS_KEYS);
      setCmsBlocks(blk || {});
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const items = useMemo(() => {
    const list = [];
    for (const [key, b] of Object.entries(cmsBlocks)) {
      if (b?.title_en) list.push({ entity_type: 'content_blocks', entity_id: key, field: 'title_en' });
      if (b?.body_en) list.push({ entity_type: 'content_blocks', entity_id: key, field: 'body_en' });
    }
    return list;
  }, [cmsBlocks]);

  const tx = useTranslatedText(locale, items);

  const resolvedCms = useMemo(() => {
    const map = {};
    for (const key of ABOUT_CMS_KEYS) {
      const b = cmsBlocks[key];
      if (b) {
        map[key] = tx('content_blocks', key, 'body_en', b.body_en || b.title_en || '');
      }
    }
    // Also map legacy keys if new keys are not defined
    if (!map['about.story.body1'] && cmsBlocks['about.story']) {
      map['about.story.body1'] = tx('content_blocks', 'about.story', 'body_en', cmsBlocks['about.story'].body_en || '');
    }
    if (!map['about.mission.body'] && cmsBlocks['about.mission']) {
      map['about.mission.body'] = tx('content_blocks', 'about.mission', 'body_en', cmsBlocks['about.mission'].body_en || '');
    }
    if (!map['about.vision.body'] && cmsBlocks['about.vision']) {
      map['about.vision.body'] = tx('content_blocks', 'about.vision', 'body_en', cmsBlocks['about.vision'].body_en || '');
    }
    if (!map['about.values.sub'] && cmsBlocks['about.values']) {
      map['about.values.sub'] = tx('content_blocks', 'about.values', 'body_en', cmsBlocks['about.values'].body_en || '');
    }
    return map;
  }, [cmsBlocks, tx]);

  if (error) {
    return <LoadError t={t} onRetry={load} />;
  }

  if (loading) {
    return <Loading t={t} />;
  }

  return (
    <div className="ay-about-page">
      <AboutHero cms={resolvedCms} />
      <AboutStory cms={resolvedCms} />
      <AboutMissionVisionValues cms={resolvedCms} />
      <AboutContrast cms={resolvedCms} />
      <AboutLeadership cms={resolvedCms} />
      <AboutCta cms={resolvedCms} />
    </div>
  );
}

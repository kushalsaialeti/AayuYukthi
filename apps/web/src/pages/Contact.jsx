import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useDocumentMeta } from '../components/layout.jsx';
import '../components/contact/Contact.css';
import { ContactHero } from '../components/contact/ContactHero.jsx';
import { ContactChannels } from '../components/contact/ContactChannels.jsx';
import { ContactHubs } from '../components/contact/ContactHubs.jsx';
import { ContactCounselingCard } from '../components/contact/ContactCounselingCard.jsx';
import { ContactIntakeForm } from '../components/contact/ContactIntakeForm.jsx';
import { ContactFaqs } from '../components/contact/ContactFaqs.jsx';
import { ContactEmergencyNotice } from '../components/contact/ContactEmergencyNotice.jsx';

// Pure validation — shared shape with the backend schema, unit-tested.
export function validateContact(values) {
  const errors = {};
  if (!values.name || !values.name.trim()) errors.name = 'Name is required';
  if ((!values.email || !values.email.trim()) && (!values.phone || !values.phone.trim())) {
    errors.email = 'Email or phone is required';
  } else {
    if (values.email && values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errors.email = 'Invalid email';
    }
    if (values.phone && values.phone.trim() && !/^\+[1-9]\d{7,14}$/.test(values.phone.trim())) {
      errors.phone = 'Use E.164 format (e.g. +919876543210)';
    }
  }
  if (!values.message || !values.message.trim()) {
    errors.message = 'Message is required';
  } else if (values.message.trim().length > 5000) {
    errors.message = 'Message is too long';
  }
  return errors;
}

const CONTACT_BLOCK_KEYS = [
  'contact.hero.eyebrow',
  'contact.hero.title',
  'contact.hero.subtitle',
  'contact.live.wait_time',
  'contact.channels.helpline_desc',
  'contact.channels.whatsapp_desc',
  'contact.channels.whatsapp_sub',
  'contact.channels.support_sub',
  'contact.channels.partnerships_sub',
  'contact.hubs.eyebrow',
  'contact.hubs.title',
  'contact.hubs.subtitle',
  'contact.hubs.coverage',
  'contact.hubs.list',
  'contact.counseling.image_url',
  'contact.counseling.badge',
  'contact.counseling.title',
  'contact.counseling.heading',
  'contact.counseling.desc',
  'contact.counseling.points',
  'contact.rapid.title',
  'contact.rapid.subtitle',
  'contact.emergency.title',
  'contact.emergency.body'
];

export function Contact({ t, contact: initialContact }) {
  useDocumentMeta('Contact Us', 'Reach AayuYukthi care counseling desk for appointment coordination and companion support.');

  const [contactData, setContactData] = useState(initialContact || {});
  const [blocks, setBlocks] = useState({});
  const [faqs, setFaqs] = useState([]);
  const [hospitalsCount, setHospitalsCount] = useState(0);

  useEffect(() => {
    // 1. Fetch live contact settings if not provided
    if (!initialContact) {
      api.contactInfo().then((d) => setContactData(d || {})).catch(() => setContactData({}));
    } else {
      setContactData(initialContact || {});
    }

    // 2. Fetch CMS content blocks for contact page
    api.blocks(CONTACT_BLOCK_KEYS).then((b) => setBlocks(b || {})).catch(() => {});

    // 3. Fetch CMS FAQs
    api.faqs({ limit: 6 }).then((res) => {
      if (res?.data && res.data.length > 0) {
        setFaqs(res.data);
      }
    }).catch(() => {});

    // 4. Fetch live hospitals count
    api.hospitals({ limit: 1 }).then((res) => {
      setHospitalsCount(res?.pagination?.total ?? res?.total ?? (res?.data?.length || 0));
    }).catch(() => {});
  }, [initialContact]);

  const safeContact = contactData || {};
  const safeBlocks = blocks || {};

  return (
    <div className="contact-page-shell">
      {/* 1. Breadcrumb & Hero with live status */}
      <ContactHero blocks={safeBlocks} contact={safeContact} />

      {/* 2. Direct Channels & Metro Operations Presence */}
      <div className="contact-section-wrap">
        <ContactChannels contact={safeContact} blocks={safeBlocks} />
        <ContactHubs blocks={safeBlocks} contact={safeContact} hospitalsCount={hospitalsCount} />
      </div>

      {/* 3. Inquiry Desk & Dedicated Hospital Navigator Feature */}
      <div className="contact-section-wrap">
        <div className="contact-intake-grid">
          <ContactCounselingCard contact={safeContact} blocks={safeBlocks} />
          <ContactIntakeForm />
        </div>
      </div>

      {/* 4. Frequently Asked Questions Accordion */}
      <div className="contact-section-wrap">
        <ContactFaqs faqs={faqs} />
      </div>

      {/* 5. Emergency & Clinical Safety Notice */}
      <div className="contact-section-wrap">
        <ContactEmergencyNotice blocks={blocks} />
      </div>
    </div>
  );
}

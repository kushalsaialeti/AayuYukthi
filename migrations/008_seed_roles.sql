-- Phase 1: seed least-privilege operational roles. Safe static data only —
-- never customer data. Re-runnable via ON CONFLICT DO NOTHING.

INSERT INTO roles (name, description) VALUES
  ('customer', 'Authenticated customer coordinating hospital journeys'),
  ('operations_head', 'Operations lead: manage requests, staff workflow, publish content'),
  ('operations_staff', 'Day-to-day request processing and customer coordination'),
  ('content_manager', 'Manage CMS content: services, hospitals, FAQs, testimonials, pages'),
  ('analytics_viewer', 'Read-only analytics and reporting access')
ON CONFLICT (name) DO NOTHING;

INSERT INTO contact_settings (id, phone, email, address_en, hours_en, socials) VALUES
  (1, NULL, NULL, '', '', '{}')
ON CONFLICT (id) DO NOTHING;

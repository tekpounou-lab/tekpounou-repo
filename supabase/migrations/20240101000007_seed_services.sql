-- Seed Data for Services & SME Project Management
-- Migration: 20240101000007_seed_services.sql

-- Insert service categories
INSERT INTO service_categories (id, name, description, icon) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Teknoloji', 'Sèvis teknoloji ak devlopman dijital', '💻'),
('550e8400-e29b-41d4-a716-446655440002', 'Konsèy', 'Konsèy ak estrateji biznis', '📊'),
('550e8400-e29b-41d4-a716-446655440003', 'Fòmasyon', 'Fòmasyon ak devlopman konpetans', '🎓'),
('550e8400-e29b-41d4-a716-446655440004', 'Maketing', 'Sèvis maketing ak kominikasyon', '📱'),
('550e8400-e29b-41d4-a716-446655440005', 'Jesyon', 'Jesyon ak òganizasyon', '📋')
ON CONFLICT (id) DO NOTHING;

-- Insert sample services
INSERT INTO services (id, name, description, category, price_range, status, created_by) VALUES
(
  '550e8400-e29b-41d4-a716-446655440010',
  'Devlopman sit entènèt',
  'Nou kreye sit entènèt modèn ak responsif pou biznis ou an. Sèvis nou yo gen ladan konsèp, devlopman, ak lansman sit la.',
  'Teknoloji',
  '$500-2000',
  'active',
  (SELECT id FROM auth.users WHERE email = 'admin@tekpounou.ht')
),
(
  '550e8400-e29b-41d4-a716-446655440011',
  'Estrateji biznis',
  'Konsèy ak estrateji pou devlope ak jesyon biznis ou an. Nou ede ou kreye plan ak estrateji ki ka fè biznis ou an grandi.',
  'Konsèy',
  '$300-1000',
  'active',
  (SELECT id FROM auth.users WHERE email = 'admin@tekpounou.ht')
),
(
  '550e8400-e29b-41d4-a716-446655440012',
  'Fòmasyon dijital',
  'Fòmasyon sou zouti dijital ak teknoloji ki ka ede biznis ou an. Nou gen fòmasyon sou medya sosyal, maketing dijital, ak jesyon biznis.',
  'Fòmasyon',
  '$200-800',
  'active',
  (SELECT id FROM auth.users WHERE email = 'teacher@tekpounou.ht')
),
(
  '550e8400-e29b-41d4-a716-446655440013',
  'Jesyon medya sosyal',
  'Nou ede ou jesyon ak devlope prezans biznis ou an sou medya sosyal yo. Sèvis nou yo gen ladan kreyasyon kontni ak estrateji kominikasyon.',
  'Maketing',
  '$400-1200',
  'active',
  (SELECT id FROM auth.users WHERE email = 'teacher@tekpounou.ht')
),
(
  '550e8400-e29b-41d4-a716-446655440014',
  'Analiz ak rapò',
  'Analiz pèfòmans biznis ou an ak kreye rapò ki detaye. Nou ede ou konprann don yo ak pran desizyon ki baze sou evèn.',
  'Konsèy',
  '$250-750',
  'active',
  (SELECT id FROM auth.users WHERE email = 'admin@tekpounou.ht')
);

-- Insert sample service requests
INSERT INTO service_requests (id, service_id, client_id, title, description, requirements, budget_range, deadline, status, admin_notes) VALUES
(
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440010',
  (SELECT id FROM auth.users WHERE email = 'student@tekpounou.ht'),
  'Sit entènèt pou magazen mwen',
  'Mwen gen yon ti magazen ak mwen bezwen yon sit entènèt pou montre pwodwi yo ak vann sou entènèt. Mwen vle yon bagay senp men pwofesyonèl.',
  'Sèksyon pou pwodwi yo, sistèm peman, ak jesyon komand yo',
  '$800-1200',
  '2025-12-31',
  'pending',
  NULL
),
(
  '550e8400-e29b-41d4-a716-446655440021',
  '550e8400-e29b-41d4-a716-446655440011',
  (SELECT id FROM auth.users WHERE email = 'student@tekpounou.ht'),
  'Ede ak estrateji biznis',
  'Mwen gen yon lide biznis men mwen pa konnen ki jan pou m kòmanse. Mwen bezwen konsèy sou kijan pou m devlope ak jesyon biznis lan.',
  'Plan biznis, estrateji maketing, ak jesyon finansye',
  '$500-800',
  '2025-11-30',
  'in_progress',
  'Nou kòmanse ak evalyasyon biznis lan ak nou ap travay sou plan an.'
);

-- Insert sample projects
INSERT INTO projects (id, service_request_id, client_id, title, description, assigned_to, status, start_date, end_date, completion_percentage, budget) VALUES
(
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440021',
  (SELECT id FROM auth.users WHERE email = 'student@tekpounou.ht'),
  'Estrateji biznis - Magazen lokal',
  'Devlopman estrateji konplè pou nouvo magazen an, gen ladan analiz mache a, plan biznis, ak estrateji maketing.',
  (SELECT id FROM auth.users WHERE email = 'admin@tekpounou.ht'),
  'active',
  '2025-01-15',
  '2025-03-15',
  35,
  650.00
);

-- Insert sample project tasks
INSERT INTO project_tasks (id, project_id, title, description, status, priority, assigned_to, due_date) VALUES
(
  '550e8400-e29b-41d4-a716-446655440040',
  '550e8400-e29b-41d4-a716-446655440030',
  'Analiz mache a',
  'Fè rechèch ak analiz sou mache lokal la pou konprann konkirèns ak opòtinite yo.',
  'done',
  'high',
  (SELECT id FROM auth.users WHERE email = 'admin@tekpounou.ht'),
  '2025-01-30'
),
(
  '550e8400-e29b-41d4-a716-446655440041',
  '550e8400-e29b-41d4-a716-446655440030',
  'Kreye plan biznis',
  'Ekri plan biznis konplè ak estrateji finansye ak operasyonèl.',
  'in_progress',
  'high',
  (SELECT id FROM auth.users WHERE email = 'admin@tekpounou.ht'),
  '2025-02-15'
),
(
  '550e8400-e29b-41d4-a716-446655440042',
  '550e8400-e29b-41d4-a716-446655440030',
  'Estrateji maketing',
  'Devlope estrateji maketing ak plan pou pwomosyon ak kominote a.',
  'todo',
  'medium',
  (SELECT id FROM auth.users WHERE email = 'admin@tekpounou.ht'),
  '2025-02-28'
),
(
  '550e8400-e29b-41d4-a716-446655440043',
  '550e8400-e29b-41d4-a716-446655440030',
  'Prezantasyon ak fòmasyon',
  'Prezante plan an ak bay fòmasyon sou aplikasyon estrateji yo.',
  'todo',
  'medium',
  (SELECT id FROM auth.users WHERE email = 'admin@tekpounou.ht'),
  '2025-03-10'
);

-- Add SME client role to student user for testing
UPDATE user_profiles 
SET role = 'sme_client' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'student@tekpounou.ht');
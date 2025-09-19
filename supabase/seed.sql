-- Comprehensive Seed Data for Tek Pou Nou Platform
-- Run this after all migrations to populate with complete demo content
-- Includes: Users, Courses, Blog, Services, Communication, Analytics, Certificates, Gamification

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

-- Insert demo users (these will be created through auth, but we need profiles)
INSERT INTO users (id, email, full_name, role, avatar_url, created_at, updated_at) 
VALUES 
  ('demo-super-admin', 'admin@tekpounou.org', 'Marie Joseph', 'super_admin', null, NOW(), NOW()),
  ('demo-admin', 'admin2@tekpounou.org', 'Pierre Moïse', 'admin', null, NOW(), NOW()),
  ('demo-teacher-1', 'teacher@tekpounou.org', 'Prof. Jean Pierre', 'teacher', null, NOW(), NOW()),
  ('demo-teacher-2', 'teacher2@tekpounou.org', 'Dr. Sarah Cajuste', 'teacher', null, NOW(), NOW()),
  ('demo-student-1', 'student@tekpounou.org', 'Sophie Laurent', 'student', null, NOW(), NOW()),
  ('demo-student-2', 'student2@tekpounou.org', 'Michel Augustin', 'student', null, NOW(), NOW()),
  ('demo-student-3', 'student3@tekpounou.org', 'Fabiola Jean-Baptiste', 'student', null, NOW(), NOW()),
  ('demo-client-1', 'client@tekpounou.org', 'Entrepreneur Alex', 'sme_client', null, NOW(), NOW()),
  ('demo-client-2', 'client2@tekpounou.org', 'Business Nadine', 'sme_client', null, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COURSES, MODULES, LESSONS & QUIZZES
-- ============================================================================

-- Insert sample courses
INSERT INTO courses (id, title, description, short_description, teacher_id, status, difficulty_level, language, duration_hours, price, is_free, created_at, updated_at)
VALUES 
  (
    'course-web-dev-ht',
    'Devlopman wèb ak HTML, CSS ak JavaScript',
    'Aprann ki jan pou w kreye sit wèb modern yo ak teknoloji yo ki pi popilè yo. Kou sa a ap montre w kijan pou w bati pwojè wèb ki reyèl yo ak konsèp ki fundamentaux yo nan devlopman wèb la.',
    'Aprann devlopman wèb ak HTML, CSS ak JavaScript',
    'demo-teacher-1',
    'published',
    'beginner',
    'ht',
    40,
    150.00,
    false,
    NOW() - INTERVAL '3 months',
    NOW()
  ),
  (
    'course-business-ht',
    'Jesyon biznis pou kòmèsan yo',
    'Dekouvri kijan pou w jesyon biznis ou a ak metod modèn yo. Aprann konsèy pratik yo pou fè biznis ou an grandi nan mache Ayisyen an ak estrateji ki gen pwèv.',
    'Jesyon ak kwasans biznis nan Ayiti',
    'demo-teacher-1',
    'published',
    'intermediate',
    'ht',
    30,
    120.00,
    false,
    NOW() - INTERVAL '2 months',
    NOW()
  ),
  (
    'course-mobile-apps',
    'Kreye App Mobil ak React Native',
    'Master techniques for building cross-platform mobile applications. Learn React Native fundamentals and advanced concepts for building production-ready mobile apps.',
    'Cross-platform mobile app development',
    'demo-teacher-2',
    'published',
    'intermediate',
    'en',
    50,
    200.00,
    false,
    NOW() - INTERVAL '1 month',
    NOW()
  ),
  (
    'course-digital-marketing',
    'Marketing Numérique pour Entrepreneurs Haïtiens',
    'Stratégies complètes de marketing digital adaptées au marché haïtien. Apprenez à utiliser les réseaux sociaux, le SEO et la publicité en ligne pour développer votre business.',
    'Marketing digital adapté au marché haïtien',
    'demo-teacher-2',
    'published',
    'beginner',
    'fr',
    25,
    100.00,
    false,
    NOW() - INTERVAL '3 weeks',
    NOW()
  ),
  (
    'course-free-intro',
    'Entwodiksyon nan Teknoloji pou Kominote a',
    'Kou gratis sa a prezante konsèp teknoloji debaz yo ak kijan yo ka ede kominote Ayisyen an. Aprann sou entenèt, òdinatè, ak zouti dijital yo.',
    'Entwodiksyon gratis nan teknoloji',
    'demo-teacher-1',
    'published',
    'beginner',
    'ht',
    15,
    0.00,
    true,
    NOW() - INTERVAL '1 week',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Course modules
INSERT INTO course_modules (id, course_id, title, description, order_index, created_at, updated_at)
VALUES 
  -- Web Development Course
  ('module-web-1', 'course-web-dev-ht', 'Kòmanse ak HTML', 'Aprann eleman yo ki debaz nan HTML ak estriktè dokiman yo', 1, NOW(), NOW()),
  ('module-web-2', 'course-web-dev-ht', 'Style ak CSS', 'Fè sit ou an gade byen ak CSS ak responsive design', 2, NOW(), NOW()),
  ('module-web-3', 'course-web-dev-ht', 'Entèraktivite ak JavaScript', 'Ajoute fonksyon dinamik ak JavaScript', 3, NOW(), NOW()),
  ('module-web-4', 'course-web-dev-ht', 'Pwojè Final', 'Konstwi yon sit wèb konplè', 4, NOW(), NOW()),
  
  -- Business Management Course
  ('module-biz-1', 'course-business-ht', 'Fondations Biznis', 'Prensip debaz jesyon biznis yo', 1, NOW(), NOW()),
  ('module-biz-2', 'course-business-ht', 'Maketing ak Vant', 'Estrateji pou vann ak ki rive jwenn kliyèn yo', 2, NOW(), NOW()),
  ('module-biz-3', 'course-business-ht', 'Jesyon Finansyal', 'Kontwole ak planifye finans biznis ou an', 3, NOW(), NOW()),
  
  -- Mobile Apps Course
  ('module-mobile-1', 'course-mobile-apps', 'React Native Fundamentals', 'Core concepts and setup', 1, NOW(), NOW()),
  ('module-mobile-2', 'course-mobile-apps', 'Navigation & State Management', 'Building app navigation and managing state', 2, NOW(), NOW()),
  ('module-mobile-3', 'course-mobile-apps', 'APIs & Data Integration', 'Connecting to external APIs and databases', 3, NOW(), NOW()),
  
  -- Digital Marketing Course
  ('module-marketing-1', 'course-digital-marketing', 'Stratégie de Base', 'Fondements du marketing digital', 1, NOW(), NOW()),
  ('module-marketing-2', 'course-digital-marketing', 'Réseaux Sociaux', 'Optimiser votre présence sur les réseaux sociaux', 2, NOW(), NOW()),
  
  -- Free Intro Course
  ('module-intro-1', 'course-free-intro', 'Teknoloji ak Nou', 'Sa teknoloji ye ak kijan li enpòtan', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Lessons
INSERT INTO lessons (id, module_id, title, content, media_type, duration_minutes, order_index, is_free, created_at, updated_at)
VALUES 
  -- HTML Module Lessons
  ('lesson-html-1', 'module-web-1', 'Kisa HTML ye?', 'Nan leson sa a, n ap aprann konsèp debaz HTML yo ak kijan yo travay nan devlopman wèb la...', 'video', 30, 1, true, NOW(), NOW()),
  ('lesson-html-2', 'module-web-1', 'Estriktè dokiman HTML', 'Aprann kijan pou òganize dokiman HTML ou yo ak eleman semantik yo...', 'video', 25, 2, false, NOW(), NOW()),
  ('lesson-html-3', 'module-web-1', 'Fòm ak Input yo', 'Kreye fòm entèraktif ak eleman input yo...', 'video', 35, 3, false, NOW(), NOW()),
  
  -- CSS Module Lessons
  ('lesson-css-1', 'module-web-2', 'Entwodiksyon nan CSS', 'CSS la se bagay ki p ap fè sit ou an gade byen ak style...', 'video', 35, 1, false, NOW(), NOW()),
  ('lesson-css-2', 'module-web-2', 'Flexbox ak Grid', 'Layout modèn ak Flexbox ak CSS Grid...', 'video', 40, 2, false, NOW(), NOW()),
  ('lesson-css-3', 'module-web-2', 'Responsive Design', 'Fè sit ou an travay sou tout aparèy yo...', 'video', 45, 3, false, NOW(), NOW()),
  
  -- JavaScript Module Lessons
  ('lesson-js-1', 'module-web-3', 'JavaScript Debaz', 'Sintaks ak konsèp fundamental JavaScript yo...', 'video', 50, 1, false, NOW(), NOW()),
  ('lesson-js-2', 'module-web-3', 'DOM Manipulation', 'Chanje eleman yo nan paj la ak JavaScript...', 'video', 45, 2, false, NOW(), NOW()),
  
  -- Other course lessons
  ('lesson-biz-1', 'module-biz-1', 'Plan Biznis', 'Kijan pou w kreye yon plan biznis ki solid...', 'video', 40, 1, false, NOW(), NOW()),
  ('lesson-mobile-1', 'module-mobile-1', 'Setting up React Native', 'Environment setup and first app...', 'video', 35, 1, false, NOW(), NOW()),
  ('lesson-marketing-1', 'module-marketing-1', 'Bases du Marketing Digital', 'Concepts fondamentaux...', 'video', 30, 1, false, NOW(), NOW()),
  ('lesson-intro-1', 'module-intro-1', 'Teknoloji nan lavi chak jou', 'Eksplike kijan teknoloji enpakte lavi nou...', 'video', 20, 1, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Quizzes
INSERT INTO quizzes (id, course_id, lesson_id, title, description, time_limit_minutes, passing_score, max_attempts, is_required, order_index, created_at, updated_at)
VALUES 
  ('quiz-html-1', 'course-web-dev-ht', 'lesson-html-2', 'Test HTML Debaz', 'Teste konesans ou sou HTML debaz yo', 15, 70, 3, true, 1, NOW(), NOW()),
  ('quiz-css-1', 'course-web-dev-ht', 'lesson-css-2', 'Test CSS ak Layout', 'Teste konesans ou sou CSS ak layout yo', 20, 70, 3, true, 2, NOW(), NOW()),
  ('quiz-js-1', 'course-web-dev-ht', 'lesson-js-2', 'Test JavaScript', 'Teste konesans ou sou JavaScript', 25, 70, 3, true, 3, NOW(), NOW()),
  ('quiz-final-web', 'course-web-dev-ht', null, 'Egzamen Final Web Development', 'Egzamen final pou kou devlopman wèb la', 60, 80, 2, true, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Quiz Questions
INSERT INTO quiz_questions (id, quiz_id, question_type, question_text, options, correct_answer, points, explanation, order_index, created_at)
VALUES 
  ('q-html-1', 'quiz-html-1', 'multiple_choice', 'Ki eleman HTML la ki itilize pou kreye yon tit prensipal?', '["<h1>", "<title>", "<header>", "<h>"]', '<h1>', 5, 'Eleman <h1> se pi enpòtan tit la nan yon paj HTML', 1, NOW()),
  ('q-html-2', 'quiz-html-1', 'multiple_choice', 'Ki atribi ki itilize pou mete yon lyen nan HTML?', '["src", "href", "link", "url"]', 'href', 5, 'Atribi href la itilize ak eleman <a> pou kreye lyen yo', 2, NOW()),
  ('q-css-1', 'quiz-css-1', 'multiple_choice', 'Ki pwopriete CSS la ki itilize pou chanje koulè tèks la?', '["text-color", "color", "font-color", "text"]', 'color', 5, 'Pwopriete color la kontwole koulè tèks la', 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ENROLLMENTS & PROGRESS
-- ============================================================================

-- Sample enrollments
INSERT INTO enrollments (student_id, course_id, enrolled_at, progress_percentage, last_accessed_at, time_spent, completed_at, updated_at)
VALUES 
  ('demo-student-1', 'course-web-dev-ht', NOW() - INTERVAL '2 months', 65, NOW() - INTERVAL '1 day', 1800, null, NOW()),
  ('demo-student-1', 'course-business-ht', NOW() - INTERVAL '3 months', 100, NOW() - INTERVAL '1 month', 2700, NOW() - INTERVAL '1 month', NOW()),
  ('demo-student-1', 'course-free-intro', NOW() - INTERVAL '4 months', 100, NOW() - INTERVAL '3 months', 900, NOW() - INTERVAL '3 months', NOW()),
  
  ('demo-student-2', 'course-web-dev-ht', NOW() - INTERVAL '1 month', 30, NOW() - INTERVAL '2 days', 900, null, NOW()),
  ('demo-student-2', 'course-mobile-apps', NOW() - INTERVAL '3 weeks', 45, NOW() - INTERVAL '1 day', 1350, null, NOW()),
  ('demo-student-2', 'course-free-intro', NOW() - INTERVAL '2 months', 100, NOW() - INTERVAL '1 month', 900, NOW() - INTERVAL '1 month', NOW()),
  
  ('demo-student-3', 'course-digital-marketing', NOW() - INTERVAL '2 weeks', 80, NOW() - INTERVAL '1 hour', 1800, null, NOW()),
  ('demo-student-3', 'course-free-intro', NOW() - INTERVAL '1 month', 100, NOW() - INTERVAL '3 weeks', 900, NOW() - INTERVAL '3 weeks', NOW()),
  
  ('demo-client-1', 'course-mobile-apps', NOW() - INTERVAL '1 week', 20, NOW() - INTERVAL '1 day', 600, null, NOW()),
  ('demo-client-1', 'course-business-ht', NOW() - INTERVAL '2 weeks', 70, NOW() - INTERVAL '2 days', 1890, null, NOW()),
  
  ('demo-client-2', 'course-digital-marketing', NOW() - INTERVAL '1 week', 40, NOW() - INTERVAL '1 day', 720, null, NOW())
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Course Progress
INSERT INTO course_progress (student_id, course_id, lesson_id, quiz_id, progress_type, percentage_complete, time_spent_seconds, completed_at, created_at, updated_at)
VALUES 
  -- Student 1 progress
  ('demo-student-1', 'course-web-dev-ht', 'lesson-html-1', null, 'lesson_complete', 100, 1800, NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month', NOW()),
  ('demo-student-1', 'course-web-dev-ht', 'lesson-html-2', null, 'lesson_complete', 100, 1500, NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '3 weeks', NOW()),
  ('demo-student-1', 'course-web-dev-ht', 'lesson-css-1', null, 'lesson_complete', 100, 2100, NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks', NOW()),
  ('demo-student-1', 'course-web-dev-ht', null, 'quiz-html-1', 'quiz_pass', 100, 900, NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '3 weeks', NOW()),
  
  -- Student 2 progress
  ('demo-student-2', 'course-web-dev-ht', 'lesson-html-1', null, 'lesson_complete', 100, 1800, NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks', NOW()),
  ('demo-student-2', 'course-mobile-apps', 'lesson-mobile-1', null, 'lesson_complete', 100, 2100, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week', NOW()),
  
  -- Student 3 progress  
  ('demo-student-3', 'course-digital-marketing', 'lesson-marketing-1', null, 'lesson_complete', 100, 1800, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week', NOW())
ON CONFLICT (student_id, lesson_id) DO NOTHING;

-- Quiz Results
INSERT INTO quiz_results (quiz_id, student_id, attempt_number, score, total_points, earned_points, started_at, completed_at, time_spent_minutes, answers, created_at)
VALUES 
  ('quiz-html-1', 'demo-student-1', 1, 85, 10, 8, NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '3 weeks', 12, '{"q-html-1": "<h1>", "q-html-2": "href"}', NOW() - INTERVAL '3 weeks'),
  ('quiz-css-1', 'demo-student-1', 1, 90, 5, 4, NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks', 15, '{"q-css-1": "color"}', NOW() - INTERVAL '2 weeks'),
  ('quiz-html-1', 'demo-student-2', 1, 75, 10, 7, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week', 18, '{"q-html-1": "<h1>", "q-html-2": "src"}', NOW() - INTERVAL '1 week')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- BLOG POSTS
-- ============================================================================

INSERT INTO blog_posts (id, title, slug, content, excerpt, author_id, category, tags, featured_image_url, status, view_count, like_count, published_at, created_at, updated_at)
VALUES 
  (
    'post-tech-haiti-1',
    'Teknoloji nan Ayiti: Opòtinite ak Defi yo',
    'teknoloji-nan-ayiti-opòtinite-ak-defi-yo',
    'Ayiti gen yon potansyèl teknolojik ki pa mouri. Nan atik sa a, n ap eksplore kijan nou ka sèvi ak teknoloji a pou rezoud problèm kominote nou an yo ak bati yon avni ki pi klè.\n\n## Opòtinite yo\n\nTeknoloji a ka ede nou nan:\n- Edikasyon ak aksè nan konesans\n- Kominote ak koneksyon\n- Opòtinite ekonomik ak biznis\n- Sèvis sante ak aksè nan swen\n\n## Defi yo\n\nMen, nou gen defi tou:\n- Aksè nan entenèt ak elektrisite\n- Edikasyon dijital ak alfabetizasyon\n- Envestisman ak enfrstriktè\n\nAnsanm, nou ka depase defi yo sa ak kreye yon ekosistèm teknolojik ki solid pou Ayiti.',
    'Eksplore opòtinite ak defi teknoloji nan Ayiti ak yon vis pou devlopman dirab.',
    'demo-teacher-1',
    'technology',
    ARRAY['teknoloji', 'ayiti', 'devlopman', 'opòtinite'],
    '/api/placeholder/blog-tech-haiti',
    'published',
    245,
    18,
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '1 week',
    NOW()
  ),
  (
    'post-entrepreneurship',
    'Entrepreneurship in the Digital Age for Haitians',
    'entrepreneurship-digital-age-haitians',
    'The digital revolution has opened unprecedented opportunities for Haitian entrepreneurs. From e-commerce to fintech solutions, the possibilities are endless.\n\n## Key Opportunities\n\n### E-commerce Platforms\nBuilding online marketplaces for Haitian products can connect local producers with global markets.\n\n### Fintech Solutions\nDeveloping mobile payment solutions tailored to the Haitian market can drive financial inclusion.\n\n### Educational Technology\nCreating platforms that deliver quality education in Kreyòl can democratize learning.\n\n## Success Stories\n\nSeveral Haitian entrepreneurs have already made their mark:\n- MonCash: Revolutionary mobile payment platform\n- Various e-commerce initiatives connecting diaspora with local products\n- Educational platforms promoting Haitian culture and language\n\n## Getting Started\n\n1. Identify a problem in your community\n2. Learn the necessary technical skills\n3. Build a minimum viable product\n4. Gather feedback and iterate\n5. Scale gradually\n\nThe future of Haiti lies in the hands of its innovative entrepreneurs. With the right tools and mindset, we can build solutions that truly serve our people.',
    'Discover how Haitian entrepreneurs can leverage digital tools to build successful businesses.',
    'demo-teacher-2',
    'business',
    ARRAY['entrepreneurship', 'digital', 'haiti', 'business', 'fintech'],
    '/api/placeholder/blog-entrepreneur',
    'published',
    189,
    24,
    NOW() - INTERVAL '2 weeks',
    NOW() - INTERVAL '2 weeks',
    NOW()
  ),
  (
    'post-web-dev-trends',
    'Les Tendances du Développement Web en 2025',
    'tendances-developpement-web-2025',
    'Le développement web évolue rapidement. Voici les principales tendances à suivre en 2025.\n\n## 1. Intelligence Artificielle Intégrée\n\nL\'IA devient omniprésente dans les applications web :\n- Assistants virtuels intégrés\n- Génération automatique de contenu\n- Personnalisation avancée de l\'expérience utilisateur\n\n## 2. Web Assembly (WASM)\n\nPerformances améliorées pour les applications web complexes :\n- Applications 3D dans le navigateur\n- Jeux haute performance\n- Outils de productivité avancés\n\n## 3. Progressive Web Apps (PWA)\n\nLa ligne entre applications web et natives continue de s\'estomper :\n- Installation directe depuis le navigateur\n- Fonctionnement hors ligne\n- Intégration système avancée\n\n## 4. Développement No-Code/Low-Code\n\nDémocratisation du développement :\n- Plateformes visuelles de développement\n- API-first architecture\n- Composants réutilisables\n\n## Conclusion\n\nCes tendances ouvrent de nouvelles opportunités pour les développeurs haïtiens. Il est crucial de rester informé et de continuer à apprendre.',
    'Un aperçu des principales tendances qui façonnent l\'avenir du développement web.',
    'demo-teacher-2',
    'technology',
    ARRAY['développement', 'web', 'tendances', '2025', 'ia'],
    '/api/placeholder/blog-web-trends',
    'published',
    156,
    12,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    NOW()
  ),
  (
    'post-mobile-first',
    'Mobile-First Design pou Biznis Ayisyen yo',
    'mobile-first-design-biznis-ayisyen',
    'Nan yon peyi kote smartphone yo pi komen pase òdinatè yo, mobile-first design pa opsyonèl - li nesesè.\n\n## Poukisa Mobile-First?\n\n### Statistik Ayiti\n- 60%+ moun yo aksè entènèt sou telefòn yo\n- Smartphone yo kontinye vin pi bon mache\n- 4G coverage ap etann nan tout peyi a\n\n### Avantaj yo\n1. **Pèfòmans pi bon** - Sit yo ki fèt pou mobile yo pi vit\n2. **Eksperyans itilizatè pi bon** - Navigation pi senp ak pi klè\n3. **SEO pi bon** - Google prefere sit responsive yo\n4. **Konvèsyon pi wo** - Plis moun yo kab achte ak kominike\n\n## Prensip Mobile-First Design\n\n### 1. Kòmanse ak Ekran ti yo\nDesign pou telefòn yo anvan ou ajoute fonksyonalite pou ekran pi gwo yo.\n\n### 2. Nagivation senp\n- Menu hamburger\n- Button yo ki gwo ak fasil pou kliken\n- Paj ki pa gen twòp ensèlman\n\n### 3. Kontni ki priyorite\nMontre bagay ki pi enpòtan yo avan.\n\n### 4. Vitès ki pi vit\n- Imaj yo optimize\n- Code ki minimze\n- CDN pou livrezon pi vit\n\n## Tool ak Framework yo\n\n- **Bootstrap** - Framework CSS responsive\n- **Tailwind CSS** - Utility-first CSS\n- **React Native** - App mobil cross-platform\n- **Flutter** - Google mobile framework\n\n## Konsèy pou Biznis Ayisyen yo\n\n1. **Teste ak itilizatè reyèl yo** nan Ayiti\n2. **Konsidere koneksyon yo ki pa vit** - optimize pou 3G\n3. **Itilize koulè ak imaj** ki komiote ak kilti Ayisyen an\n4. **Sipòte plizyè lang** - Kreyòl, Fransè, ak Anglè\n\nMobile-first pa jis yon estrateji design - li se yon estrateji biznis ki ka fè diferans ant siksè ak echèk nan mache dijital Ayisyen an.',
    'Poukisa ak kijan biznis Ayisyen yo ta dwe adopte mobile-first design.',
    'demo-teacher-1',
    'design',
    ARRAY['mobile', 'design', 'ayiti', 'biznis', 'ux'],
    '/api/placeholder/blog-mobile-first',
    'published',
    134,
    15,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SERVICES & PROJECTS
-- ============================================================================

INSERT INTO services (id, title, description, category, price_starting, duration_estimate, requirements, deliverables, is_active, created_at, updated_at)
VALUES 
  (
    'service-web-dev',
    'Devlopman sit wèb ak app yo',
    'Nou kreye sit wèb ak app web ki responsive ak modèn pou biznis ak òganizasyon yo. Ak teknoloji kouri yo ak UI/UX ki pi bonjan an.',
    'web_development',
    500.00,
    '2-4 weeks',
    ARRAY['Project requirements', 'Content and assets', 'Domain and hosting'],
    ARRAY['Responsive website', 'Content management', 'SEO optimization', '3 months support'],
    true,
    NOW(),
    NOW()
  ),
  (
    'service-digital-marketing',
    'Maketing dijital ak jesyon rezò sosyal',
    'Estrateji maketing dijital ki konplè pou ogmante vi ak angajman biznis ou an sou platfòm dijital yo.',
    'digital_marketing',
    300.00,
    '1-2 weeks',
    ARRAY['Business goals', 'Target audience info', 'Brand assets'],
    ARRAY['Marketing strategy', 'Content calendar', 'Social media setup', 'Analytics dashboard'],
    true,
    NOW(),
    NOW()
  ),
  (
    'service-mobile-dev',
    'Devlopman App Mobil Cross-Platform',
    'Développement d\'applications mobiles natives et cross-platform avec React Native ou Flutter.',
    'mobile_development',
    800.00,
    '4-8 weeks',
    ARRAY['App concept', 'Target platforms', 'Design mockups', 'API requirements'],
    ARRAY['iOS and Android apps', 'App store submission', 'Source code', '6 months support'],
    true,
    NOW(),
    NOW()
  ),
  (
    'service-consulting',
    'Konsèy Teknoloji ak Estrateji Biznis',
    'Konsèy ekspè nan teknoloji ak estrateji biznis pou ede w fè bon chwa ak planifye kwasans ou an.',
    'consulting',
    150.00,
    '1-2 weeks',
    ARRAY['Business overview', 'Current challenges', 'Growth goals'],
    ARRAY['Technology audit', 'Strategic roadmap', 'Implementation plan', 'Follow-up sessions'],
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Sample service requests/projects
INSERT INTO projects (id, client_id, service_id, title, description, status, budget, timeline, requirements, created_at, updated_at)
VALUES 
  (
    'project-boutique-online',
    'demo-client-1',
    'service-web-dev',
    'Boutique Online pou Prodwi Ayisyen yo',
    'Mwen vle kreye yon boutique online pou vann prodwi ayisyen yo nan diaspora a. M bezwen yon sit ki ka aksepte pèman ak jesyon komand yo.',
    'in_progress',
    750.00,
    '3 weeks',
    JSONB_BUILD_OBJECT(
      'pages', ARRAY['Home', 'Products', 'Cart', 'Checkout', 'Account'],
      'payment_methods', ARRAY['Credit Card', 'PayPal', 'MonCash'],
      'languages', ARRAY['Kreyòl', 'English', 'Français']
    ),
    NOW() - INTERVAL '1 week',
    NOW()
  ),
  (
    'project-app-transport',
    'demo-client-2',
    'service-mobile-dev',
    'App Transport pou Ayiti',
    'Une application mobile pour connecter les chauffeurs et passagers en Haïti. Système de géolocalisation et paiement intégré.',
    'pending',
    1200.00,
    '6 weeks',
    JSONB_BUILD_OBJECT(
      'features', ARRAY['GPS tracking', 'Payment integration', 'Driver ratings', 'Trip history'],
      'platforms', ARRAY['iOS', 'Android'],
      'integrations', ARRAY['Google Maps', 'MonCash', 'SMS']
    ),
    NOW() - INTERVAL '2 days',
    NOW()
  ),
  (
    'project-marketing-restaurant',
    'demo-client-1',
    'service-digital-marketing',
    'Marketing pou Restoran Kreyòl',
    'Estrateji marketing konplè pou restoran kreyòl ki nan Miami. Gen bezwen pou rive jwenn kominote Ayisyen ak lòt moun yo tou.',
    'completed',
    450.00,
    '2 weeks',
    JSONB_BUILD_OBJECT(
      'target_audience', ARRAY['Haitian diaspora', 'Caribbean food lovers', 'Local Miami residents'],
      'platforms', ARRAY['Facebook', 'Instagram', 'Google My Business'],
      'goals', ARRAY['Increase brand awareness', 'Drive foot traffic', 'Online ordering']
    ),
    NOW() - INTERVAL '1 month',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMUNICATION SYSTEM
-- ============================================================================

-- Course Discussions
INSERT INTO course_discussions (id, course_id, user_id, title, content, is_pinned, is_answered, created_at, updated_at)
VALUES 
  (
    'disc-web-1',
    'course-web-dev-ht',
    'demo-student-1',
    'Kesyon sou CSS Flexbox',
    'Mwen gen yon pwoblèm ak flexbox. Kijan pou m fè yon eleman yo nan santè vertikal ak orijontal?',
    false,
    true,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'disc-web-2',
    'course-web-dev-ht',
    'demo-teacher-1',
    'Pwojè Final - Gid ak Resous yo',
    'Men kèk resous ak konsèy pou pwojè final la. Sonje, objektif la se pou montre sa nou aprann nan kou a.',
    true,
    false,
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '1 week'
  ),
  (
    'disc-mobile-1',
    'course-mobile-apps',
    'demo-student-2',
    'React Native vs Flutter',
    'What are the main differences between React Native and Flutter? When should I choose one over the other?',
    false,
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    'disc-biz-1',
    'course-business-ht',
    'demo-client-1',
    'Estrateji Maketing pou Biznis Ti',
    'Ki estrateji maketing ki pi bon pou yon biznis ki fèk kòmanse ak bidjè limite?',
    false,
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- Discussion Replies
INSERT INTO course_discussions (id, course_id, user_id, title, content, parent_id, created_at, updated_at)
VALUES 
  (
    'reply-web-1-1',
    'course-web-dev-ht',
    'demo-teacher-1',
    'Reply',
    'Pou santè yon eleman ak flexbox:\n\n```css\n.container {\n  display: flex;\n  justify-content: center; /* santè orijontal */\n  align-items: center; /* santè vertikal */\n  height: 100vh;\n}\n```\n\nSa a ap mete eleman an nan santè pèfè a.',
    'disc-web-1',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'reply-web-1-2',
    'course-web-dev-ht',
    'demo-student-1',
    'Reply',
    'Mèsi anpil! Sa a travay pèfè. Mwen te pa konprann justify-content ak align-items yo avan.',
    'disc-web-1',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'reply-mobile-1-1',
    'course-mobile-apps',
    'demo-teacher-2',
    'Reply',
    'Great question! Here are the key differences:\n\n**React Native:**\n- JavaScript/TypeScript\n- Large community\n- Hot reload\n- Platform-specific components\n\n**Flutter:**\n- Dart language\n- Single codebase, pixel-perfect UI\n- Fast performance\n- Growing ecosystem\n\nChoose React Native if you\'re already familiar with JavaScript. Choose Flutter for better performance and consistent UI.',
    'disc-mobile-1',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- Private Messages
INSERT INTO messages (sender_id, recipient_id, subject, content, is_read, created_at, updated_at)
VALUES 
  (
    'demo-student-1',
    'demo-teacher-1',
    'Kesyon sou Pwojè Final',
    'Bonjou Pwofesè Pierre,\n\nMwen gen kèk kesyon sou pwojè final la. Èske nou ka itilize framework JavaScript yo tankou React oswa Vue?\n\nMèsi anpil,\nSophie',
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    'demo-teacher-1',
    'demo-student-1',
    'RE: Kesyon sou Pwojè Final',
    'Bonjou Sophie,\n\nWi, ou ka itilize React oswa Vue si ou vle. Objektif la se pou montre sa ou aprann yo ak kreye yon bagay ki fonksyonèl.\n\nM ta konsèye React paske nou gen plis resous ak sipò pou li.\n\nBonne chance ak pwojè a!\nPwofesè Pierre',
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    'demo-client-1',
    'demo-teacher-2',
    'Collaboration Opportunity',
    'Hello Dr. Cajuste,\n\nI\'m working on a mobile app project and would love to discuss potential collaboration opportunities. Would you be available for a brief call this week?\n\nBest regards,\nAlex',
    false,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
  )
ON CONFLICT DO NOTHING;

-- Notifications
INSERT INTO notifications (user_id, type, title, content, data, is_read, created_at)
VALUES 
  ('demo-student-1', 'discussion_reply', 'Nouvo Repons nan Diskisyon ou a', 'Pwofesè Pierre reponn nan diskisyon ou sou CSS Flexbox.', 
   '{"discussion_id": "disc-web-1", "course_id": "course-web-dev-ht", "replier_name": "Prof. Jean Pierre"}', 
   true, NOW() - INTERVAL '2 days'),
  
  ('demo-student-1', 'message', 'Nouvo Mesaj', 'Ou resevwa yon nouvo mesaj nan Prof. Jean Pierre.',
   '{"message_id": "msg-1", "sender_name": "Prof. Jean Pierre"}', 
   false, NOW() - INTERVAL '1 day'),
   
  ('demo-student-1', 'certificate_issued', 'Sètifika Nou yo Pibliye! 🎓', 'Felisitasyon! Ou genyen yon sètifika pou fini: Jesyon biznis pou kòmèsan yo',
   '{"course_id": "course-business-ht", "certificate_id": "cert-1"}', 
   false, NOW() - INTERVAL '1 month'),
   
  ('demo-student-2', 'badge_earned', 'Nouvo Badge Genyen! 🏆', 'Ou genyen "Dedicated Learner" badge!',
   '{"badge_id": "badge-dedicated", "badge_title": "Dedicated Learner", "points_earned": 50}', 
   false, NOW() - INTERVAL '1 week'),
   
  ('demo-teacher-1', 'discussion_post', 'Nouvo Diskisyon nan Kou ou a', 'Sophie Laurent poste yon nouvo diskisyon nan kou "Devlopman wèb ak HTML, CSS ak JavaScript".',
   '{"discussion_id": "disc-web-1", "course_id": "course-web-dev-ht", "student_name": "Sophie Laurent"}', 
   true, NOW() - INTERVAL '3 days'),
   
  ('demo-teacher-2', 'message', 'Nouvo Mesaj', 'Ou resevwa yon nouvo mesaj nan Entrepreneur Alex.',
   '{"message_id": "msg-3", "sender_name": "Entrepreneur Alex"}', 
   false, NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- GAMIFICATION & CERTIFICATES
-- ============================================================================

-- User Gamification Profiles
INSERT INTO user_gamification (user_id, total_points, level, experience_points, streak_days, longest_streak, achievements_unlocked, last_activity_date, created_at, updated_at)
VALUES 
  ('demo-student-1', 420, 3, 2420, 5, 12, 8, CURRENT_DATE, NOW() - INTERVAL '3 months', NOW()),
  ('demo-student-2', 180, 2, 1180, 3, 7, 4, CURRENT_DATE, NOW() - INTERVAL '1 month', NOW()),
  ('demo-student-3', 250, 2, 1250, 8, 8, 5, CURRENT_DATE, NOW() - INTERVAL '2 weeks', NOW()),
  ('demo-client-1', 310, 2, 1310, 2, 9, 6, CURRENT_DATE - 1, NOW() - INTERVAL '2 weeks', NOW()),
  ('demo-client-2', 95, 1, 595, 1, 4, 2, CURRENT_DATE, NOW() - INTERVAL '1 week', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- User Badges (earned badges)
INSERT INTO user_badges (user_id, badge_id, earned_at, completed)
VALUES 
  ('demo-student-1', (SELECT id FROM badges WHERE title = 'First Steps'), NOW() - INTERVAL '3 months', true),
  ('demo-student-1', (SELECT id FROM badges WHERE title = 'Knowledge Seeker'), NOW() - INTERVAL '2 months', true),
  ('demo-student-1', (SELECT id FROM badges WHERE title = 'Course Finisher'), NOW() - INTERVAL '1 month', true),
  ('demo-student-1', (SELECT id FROM badges WHERE title = 'Quiz Master'), NOW() - INTERVAL '3 weeks', true),
  ('demo-student-1', (SELECT id FROM badges WHERE title = 'Discussion Starter'), NOW() - INTERVAL '3 days', true),
  ('demo-student-1', (SELECT id FROM badges WHERE title = 'Dedicated Learner'), NOW() - INTERVAL '2 weeks', true),
  
  ('demo-student-2', (SELECT id FROM badges WHERE title = 'First Steps'), NOW() - INTERVAL '1 month', true),
  ('demo-student-2', (SELECT id FROM badges WHERE title = 'Knowledge Seeker'), NOW() - INTERVAL '2 weeks', true),
  ('demo-student-2', (SELECT id FROM badges WHERE title = 'Discussion Starter'), NOW() - INTERVAL '2 days', true),
  ('demo-student-2', (SELECT id FROM badges WHERE title = 'Quiz Master'), NOW() - INTERVAL '1 week', true),
  
  ('demo-student-3', (SELECT id FROM badges WHERE title = 'First Steps'), NOW() - INTERVAL '2 weeks', true),
  ('demo-student-3', (SELECT id FROM badges WHERE title = 'Knowledge Seeker'), NOW() - INTERVAL '1 week', true),
  ('demo-student-3', (SELECT id FROM badges WHERE title = 'Course Finisher'), NOW() - INTERVAL '3 weeks', true),
  
  ('demo-client-1', (SELECT id FROM badges WHERE title = 'First Steps'), NOW() - INTERVAL '2 weeks', true),
  ('demo-client-1', (SELECT id FROM badges WHERE title = 'Knowledge Seeker'), NOW() - INTERVAL '1 week', true),
  ('demo-client-1', (SELECT id FROM badges WHERE title = 'Discussion Starter'), NOW() - INTERVAL '1 day', true),
  
  ('demo-client-2', (SELECT id FROM badges WHERE title = 'First Steps'), NOW() - INTERVAL '1 week', true),
  ('demo-client-2', (SELECT id FROM badges WHERE title = 'Discussion Starter'), NOW() - INTERVAL '2 days', true)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Learning Streaks
INSERT INTO learning_streaks (user_id, activity_date, activities_completed, time_spent_minutes)
VALUES 
  -- Student 1 - 5 day current streak
  ('demo-student-1', CURRENT_DATE, 2, 45),
  ('demo-student-1', CURRENT_DATE - 1, 1, 30),
  ('demo-student-1', CURRENT_DATE - 2, 3, 75),
  ('demo-student-1', CURRENT_DATE - 3, 1, 25),
  ('demo-student-1', CURRENT_DATE - 4, 2, 50),
  ('demo-student-1', CURRENT_DATE - 6, 1, 30), -- break in streak
  
  -- Student 2 - 3 day current streak
  ('demo-student-2', CURRENT_DATE, 1, 35),
  ('demo-student-2', CURRENT_DATE - 1, 2, 60),
  ('demo-student-2', CURRENT_DATE - 2, 1, 40),
  
  -- Student 3 - 8 day current streak (longest)
  ('demo-student-3', CURRENT_DATE, 1, 30),
  ('demo-student-3', CURRENT_DATE - 1, 2, 45),
  ('demo-student-3', CURRENT_DATE - 2, 1, 25),
  ('demo-student-3', CURRENT_DATE - 3, 3, 70),
  ('demo-student-3', CURRENT_DATE - 4, 1, 35),
  ('demo-student-3', CURRENT_DATE - 5, 2, 50),
  ('demo-student-3', CURRENT_DATE - 6, 1, 30),
  ('demo-student-3', CURRENT_DATE - 7, 2, 45)
ON CONFLICT (user_id, activity_date) DO NOTHING;

-- Certificates
INSERT INTO certificates (student_id, course_id, certificate_number, title, description, issue_date, verification_code, is_public, created_at, updated_at)
VALUES 
  (
    'demo-student-1',
    'course-business-ht',
    generate_certificate_number(),
    'Sètifika Achèvement nan Jesyon biznis pou kòmèsan yo',
    'Sètifika sa a konfime ke Sophie Laurent fini ak siksè tout kondisyon yo pou kou: Jesyon biznis pou kòmèsan yo',
    CURRENT_DATE - 30,
    generate_verification_code(),
    true,
    NOW() - INTERVAL '1 month',
    NOW() - INTERVAL '1 month'
  ),
  (
    'demo-student-3',
    'course-free-intro',
    generate_certificate_number(),
    'Sètifika Achèvement nan Entwodiksyon nan Teknoloji pou Kominote a',
    'Sètifika sa a konfime ke Fabiola Jean-Baptiste fini ak siksè tout kondisyon yo pou kou: Entwodiksyon nan Teknoloji pou Kominote a',
    CURRENT_DATE - 21,
    generate_verification_code(),
    true,
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '3 weeks'
  ),
  (
    'demo-student-2',
    'course-free-intro',
    generate_certificate_number(),
    'Sètifika Achèvement nan Entwodiksyon nan Teknoloji pou Kominote a',
    'Sètifika sa a konfime ke Michel Augustin fini ak siksè tout kondisyon yo pou kou: Entwodiksyon nan Teknoloji pou Kominote a',
    CURRENT_DATE - 30,
    generate_verification_code(),
    false,
    NOW() - INTERVAL '1 month',
    NOW() - INTERVAL '1 month'
  )
ON CONFLICT (student_id, course_id) DO NOTHING;

-- ============================================================================
-- ANALYTICS & EVENTS
-- ============================================================================

-- Comprehensive Analytics Events for realistic dashboard data
INSERT INTO analytics_events (user_id, event_type, metadata, session_id, created_at)
VALUES 
  -- Recent login events
  ('demo-student-1', 'login', '{"device": "mobile", "location": "Port-au-Prince"}', 'sess-001', NOW() - INTERVAL '2 hours'),
  ('demo-student-2', 'login', '{"device": "desktop", "location": "Miami"}', 'sess-002', NOW() - INTERVAL '3 hours'),
  ('demo-student-3', 'login', '{"device": "mobile", "location": "Cap-Haïtien"}', 'sess-003', NOW() - INTERVAL '1 hour'),
  ('demo-client-1', 'login', '{"device": "desktop", "location": "New York"}', 'sess-004', NOW() - INTERVAL '4 hours'),
  ('demo-teacher-1', 'login', '{"device": "desktop", "location": "Port-au-Prince"}', 'sess-005', NOW() - INTERVAL '5 hours'),
  
  -- Course interactions
  ('demo-student-1', 'course_view', '{"course_id": "course-web-dev-ht", "course_title": "Devlopman wèb ak HTML, CSS ak JavaScript"}', 'sess-001', NOW() - INTERVAL '2 hours'),
  ('demo-student-1', 'lesson_start', '{"course_id": "course-web-dev-ht", "lesson_id": "lesson-css-2", "lesson_title": "Flexbox ak Grid"}', 'sess-001', NOW() - INTERVAL '2 hours'),
  ('demo-student-1', 'lesson_complete', '{"course_id": "course-web-dev-ht", "lesson_id": "lesson-css-2", "lesson_title": "Flexbox ak Grid"}', 'sess-001', NOW() - INTERVAL '1.5 hours'),
  
  ('demo-student-2', 'course_view', '{"course_id": "course-mobile-apps", "course_title": "Kreye App Mobil ak React Native"}', 'sess-002', NOW() - INTERVAL '3 hours'),
  ('demo-student-2', 'lesson_start', '{"course_id": "course-mobile-apps", "lesson_id": "lesson-mobile-1", "lesson_title": "Setting up React Native"}', 'sess-002', NOW() - INTERVAL '2.5 hours'),
  
  ('demo-student-3', 'course_view', '{"course_id": "course-digital-marketing", "course_title": "Marketing Numérique pour Entrepreneurs Haïtiens"}', 'sess-003', NOW() - INTERVAL '1 hour'),
  
  -- Quiz attempts
  ('demo-student-1', 'quiz_attempt', '{"quiz_id": "quiz-css-1", "course_id": "course-web-dev-ht", "attempt": 1}', 'sess-001', NOW() - INTERVAL '1 hour'),
  ('demo-student-1', 'quiz_complete', '{"quiz_id": "quiz-css-1", "course_id": "course-web-dev-ht", "score": 90, "passed": true}', 'sess-001', NOW() - INTERVAL '45 minutes'),
  
  ('demo-student-2', 'quiz_attempt', '{"quiz_id": "quiz-html-1", "course_id": "course-web-dev-ht", "attempt": 1}', 'sess-002', NOW() - INTERVAL '1 week'),
  ('demo-student-2', 'quiz_complete', '{"quiz_id": "quiz-html-1", "course_id": "course-web-dev-ht", "score": 75, "passed": true}', 'sess-002', NOW() - INTERVAL '1 week'),
  
  -- Blog interactions
  ('demo-student-1', 'blog_view', '{"post_id": "post-web-dev-trends", "post_title": "Les Tendances du Développement Web en 2025"}', 'sess-001', NOW() - INTERVAL '30 minutes'),
  ('demo-student-2', 'blog_view', '{"post_id": "post-tech-haiti-1", "post_title": "Teknoloji nan Ayiti: Opòtinite ak Defi yo"}', 'sess-002', NOW() - INTERVAL '2 hours'),
  ('demo-client-1', 'blog_view', '{"post_id": "post-entrepreneurship", "post_title": "Entrepreneurship in the Digital Age for Haitians"}', 'sess-004', NOW() - INTERVAL '3 hours'),
  
  -- Discussion activity
  ('demo-student-1', 'discussion_post', '{"discussion_id": "disc-web-1", "course_id": "course-web-dev-ht", "title": "Kesyon sou CSS Flexbox"}', 'sess-001', NOW() - INTERVAL '3 days'),
  ('demo-teacher-1', 'discussion_reply', '{"discussion_id": "reply-web-1-1", "parent_id": "disc-web-1", "course_id": "course-web-dev-ht"}', 'sess-005', NOW() - INTERVAL '2 days'),
  
  -- Message activity
  ('demo-student-1', 'message_sent', '{"recipient_id": "demo-teacher-1", "subject": "Kesyon sou Pwojè Final"}', 'sess-001', NOW() - INTERVAL '2 days'),
  ('demo-teacher-1', 'message_sent', '{"recipient_id": "demo-student-1", "subject": "RE: Kesyon sou Pwojè Final"}', 'sess-005', NOW() - INTERVAL '1 day'),
  
  -- Service requests
  ('demo-client-1', 'service_request', '{"service_id": "service-web-dev", "service_title": "Devlopman sit wèb ak app yo"}', 'sess-004', NOW() - INTERVAL '1 week'),
  ('demo-client-2', 'service_request', '{"service_id": "service-mobile-dev", "service_title": "Devlopman App Mobil Cross-Platform"}', 'sess-006', NOW() - INTERVAL '2 days'),
  
  -- Historical data for trends (past 30 days)
  ('demo-student-1', 'login', '{"device": "mobile"}', 'sess-old-1', NOW() - INTERVAL '1 week'),
  ('demo-student-1', 'lesson_complete', '{"course_id": "course-web-dev-ht", "lesson_id": "lesson-html-2"}', 'sess-old-1', NOW() - INTERVAL '1 week'),
  ('demo-student-1', 'login', '{"device": "mobile"}', 'sess-old-2', NOW() - INTERVAL '2 weeks'),
  ('demo-student-1', 'course_view', '{"course_id": "course-web-dev-ht"}', 'sess-old-2', NOW() - INTERVAL '2 weeks'),
  
  ('demo-student-2', 'login', '{"device": "desktop"}', 'sess-old-3', NOW() - INTERVAL '1 week'),
  ('demo-student-2', 'enrollment', '{"course_id": "course-mobile-apps"}', 'sess-old-3', NOW() - INTERVAL '3 weeks'),
  
  ('demo-student-3', 'login', '{"device": "mobile"}', 'sess-old-4', NOW() - INTERVAL '3 days'),
  ('demo-student-3', 'blog_view', '{"post_id": "post-mobile-first"}', 'sess-old-4', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FINAL DATA UPDATES
-- ============================================================================

-- Update course enrollments count and completion rates
UPDATE courses SET 
  (enrolled_students, completion_rate) = (
    SELECT 
      COUNT(*) as enrolled,
      COALESCE(AVG(CASE WHEN progress_percentage = 100 THEN 100 ELSE 0 END), 0) as completion
    FROM enrollments 
    WHERE course_id = courses.id
  )
WHERE id IN (SELECT DISTINCT course_id FROM enrollments);

-- Update blog post view counts
UPDATE blog_posts SET view_count = view_count + FLOOR(RANDOM() * 50 + 10) WHERE status = 'published';

-- Update user last login times
UPDATE users SET last_sign_in_at = (
  SELECT MAX(created_at) 
  FROM analytics_events 
  WHERE user_id = users.id AND event_type = 'login'
) WHERE id IN (SELECT DISTINCT user_id FROM analytics_events WHERE event_type = 'login');

-- Create some sample content engagement records
INSERT INTO content_engagement (content_type, content_id, views, likes, engagement_score, updated_at)
VALUES 
  ('course', 'course-web-dev-ht', 89, 12, 95.5, NOW()),
  ('course', 'course-business-ht', 67, 8, 78.2, NOW()),
  ('course', 'course-mobile-apps', 45, 6, 67.8, NOW()),
  ('course', 'course-digital-marketing', 34, 4, 58.9, NOW()),
  ('course', 'course-free-intro', 156, 23, 88.7, NOW()),
  ('blog_post', 'post-tech-haiti-1', 245, 18, 91.3, NOW()),
  ('blog_post', 'post-entrepreneurship', 189, 24, 87.6, NOW()),
  ('blog_post', 'post-web-dev-trends', 156, 12, 74.2, NOW()),
  ('blog_post', 'post-mobile-first', 134, 15, 76.8, NOW())
ON CONFLICT (content_type, content_id) DO NOTHING;

-- Final success message
SELECT 'Seed data loaded successfully! Platform ready for demo.' as status;

-- Seed data for Tek Pou Nou platform
-- NOTE: Before running this, ensure you have created the super admin user through Supabase Auth
-- Email: admin@tekpounou.com
-- Password: SecurePassword123!

-- Insert super admin user (assumes the auth.users record already exists)
-- You need to replace 'YOUR_SUPER_ADMIN_UUID' with the actual UUID from auth.users
-- Get this from: SELECT id FROM auth.users WHERE email = 'admin@tekpounou.com';

-- Create a helper function to find user by email
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_address TEXT)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM auth.users WHERE email = email_address);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert super admin into users table
INSERT INTO public.users (id, email, role, is_active)
SELECT 
    get_user_id_by_email('admin@tekpounou.com'),
    'admin@tekpounou.com',
    'super_admin'::user_role,
    true
WHERE get_user_id_by_email('admin@tekpounou.com') IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin'::user_role,
    is_active = true,
    updated_at = NOW();

-- Insert super admin profile
INSERT INTO public.profiles (id, display_name, bio, roles, preferred_language)
SELECT 
    get_user_id_by_email('admin@tekpounou.com'),
    'Super Administrator',
    'Platform administrator for Tek Pou Nou educational ecosystem.',
    ARRAY['super_admin']::user_role[],
    'ht-HT'::language_code
WHERE get_user_id_by_email('admin@tekpounou.com') IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    display_name = 'Super Administrator',
    bio = 'Platform administrator for Tek Pou Nou educational ecosystem.',
    roles = ARRAY['super_admin']::user_role[],
    updated_at = NOW();

-- Sample course data
INSERT INTO public.courses (title, description, instructor_id, is_published, is_approved, language, duration_hours, difficulty_level, category, tags) 
SELECT 
    'Kreyòl Ayisyen: Komisman',
    'Yon kou komisman pou aprann pale ak ekri nan lang kreyòl ayisyen yo.',
    get_user_id_by_email('admin@tekpounou.com'),
    true,
    true,
    'ht-HT'::language_code,
    10,
    'Beginner',
    'Language',
    ARRAY['creole', 'language', 'beginner', 'haiti']
WHERE get_user_id_by_email('admin@tekpounou.com') IS NOT NULL;

INSERT INTO public.courses (title, description, instructor_id, is_published, is_approved, language, duration_hours, difficulty_level, category, tags)
SELECT 
    'Introduction to Haitian History',
    'Learn about the rich history of Haiti from pre-Columbian times to modern day.',
    get_user_id_by_email('admin@tekpounou.com'),
    true,
    true,
    'en-US'::language_code,
    15,
    'Intermediate',
    'History',
    ARRAY['history', 'haiti', 'culture', 'education']
WHERE get_user_id_by_email('admin@tekpounou.com') IS NOT NULL;

-- Sample blog post
INSERT INTO public.blog_posts (title, slug, content, excerpt, author_id, is_published, language, tags, meta_title, meta_description, published_at)
SELECT 
    'Byenvini nan Tek Pou Nou',
    'byenvini-nan-tek-pou-nou',
    'Nou kontan anpil pou nou ka prezante nou nouvo platfòm edikasyon an ki rele Tek Pou Nou. Platfòm lan gen pou objektif li pou li ede moun yo nan kominote ayisyen an yo ka aprann ak devlope yo...',
    'Dekouvri nouvo platfòm edikasyon an ki fèt espesyalman pou kominote ayisyen an.',
    get_user_id_by_email('admin@tekpounou.com'),
    true,
    'ht-HT'::language_code,
    ARRAY['welcome', 'education', 'haiti', 'platform'],
    'Byenvini nan Tek Pou Nou - Platfòm Edikasyon Ayisyen',
    'Dekouvri nouvo platfòm edikasyon an ki fèt pou kominote ayisyen an ak kou yo, blog ak sèvis yo.',
    NOW()
WHERE get_user_id_by_email('admin@tekpounou.com') IS NOT NULL;

-- Sample service listing
INSERT INTO public.services (title, description, service_type, provider_id, price, pricing_model, is_active, language, tags, requirements, deliverables, timeline_days)
SELECT 
    'Devlopman Sit Entènèt',
    'Nou ap ofri sèvis devlopman sit entènèt ak aplikasyon mobil yo pou ti biznis yo ak òganizasyon yo.',
    'development',
    get_user_id_by_email('admin@tekpounou.com'),
    1500.00,
    'fixed',
    true,
    'ht-HT'::language_code,
    ARRAY['web-development', 'mobile-app', 'business', 'technology'],
    ARRAY['Project requirements document', 'Design preferences', 'Content and images'],
    ARRAY['Responsive website', 'Mobile-friendly design', 'Content management system', 'Basic SEO setup'],
    30
WHERE get_user_id_by_email('admin@tekpounou.com') IS NOT NULL;

-- Sample audit log entry
INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
SELECT 
    get_user_id_by_email('admin@tekpounou.com'),
    'SEED_DATA_CREATED',
    'multiple',
    get_user_id_by_email('admin@tekpounou.com'),
    '{"action": "Initial platform setup with sample data"}'::jsonb
WHERE get_user_id_by_email('admin@tekpounou.com') IS NOT NULL;

-- Drop the helper function after use
DROP FUNCTION IF EXISTS get_user_id_by_email(TEXT);

-- Create a function to get platform statistics (for admin dashboard)
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM public.users),
        'total_teachers', (SELECT COUNT(*) FROM public.users WHERE role = 'teacher'),
        'total_students', (SELECT COUNT(*) FROM public.users WHERE role = 'student'),
        'total_courses', (SELECT COUNT(*) FROM public.courses),
        'published_courses', (SELECT COUNT(*) FROM public.courses WHERE is_published = true),
        'total_enrollments', (SELECT COUNT(*) FROM public.course_enrollments),
        'total_blog_posts', (SELECT COUNT(*) FROM public.blog_posts),
        'published_blog_posts', (SELECT COUNT(*) FROM public.blog_posts WHERE is_published = true),
        'total_services', (SELECT COUNT(*) FROM public.services),
        'active_services', (SELECT COUNT(*) FROM public.services WHERE is_active = true),
        'pending_teacher_applications', (SELECT COUNT(*) FROM public.teacher_applications WHERE status = 'pending')
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

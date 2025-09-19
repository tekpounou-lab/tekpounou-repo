-- ======================================
-- Enable Row Level Security on all tables
-- ======================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_approval ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- ======================================
-- Helper functions
-- ======================================

-- Get user roles (array)
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS user_role[] AS $$
BEGIN
    RETURN (SELECT roles FROM public.profiles WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_roles(auth.uid()) && ARRAY['admin','super_admin']::user_role[];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_roles(auth.uid()) && ARRAY['super_admin']::user_role[];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================
-- USERS TABLE POLICIES
-- ======================================
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
CREATE POLICY "Super admins can view all users" ON public.users
    FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (is_admin_or_super());

DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "Users can view own record" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins can update all users" ON public.users;
CREATE POLICY "Super admins can update all users" ON public.users
    FOR UPDATE USING (is_super_admin());

DROP POLICY IF EXISTS "Admins can update users except super_admins" ON public.users;
CREATE POLICY "Admins can update users except super_admins" ON public.users
    FOR UPDATE USING (
        is_admin_or_super() AND
        NOT (get_user_roles(id) && ARRAY['super_admin']::user_role[])
    );

DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins can insert users" ON public.users;
CREATE POLICY "Super admins can insert users" ON public.users
    FOR INSERT WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete users" ON public.users;
CREATE POLICY "Super admins can delete users" ON public.users
    FOR DELETE USING (is_super_admin());

-- ======================================
-- PROFILES TABLE POLICIES
-- ======================================
DROP POLICY IF EXISTS "Anyone can view active profiles" ON public.profiles;
CREATE POLICY "Anyone can view active profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE USING (is_admin_or_super());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;
CREATE POLICY "Super admins can delete profiles" ON public.profiles
    FOR DELETE USING (is_super_admin());

-- ======================================
-- TEACHER APPLICATIONS POLICIES
-- ======================================
DROP POLICY IF EXISTS "Users can view own teacher applications" ON public.teacher_applications;
CREATE POLICY "Users can view own teacher applications" ON public.teacher_applications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all teacher applications" ON public.teacher_applications;
CREATE POLICY "Admins can view all teacher applications" ON public.teacher_applications
    FOR SELECT USING (is_admin_or_super());

DROP POLICY IF EXISTS "Users can create teacher applications" ON public.teacher_applications;
CREATE POLICY "Users can create teacher applications" ON public.teacher_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending applications" ON public.teacher_applications;
CREATE POLICY "Users can update own pending applications" ON public.teacher_applications
    FOR UPDATE USING (
        auth.uid() = user_id AND status = 'pending'
    );

DROP POLICY IF EXISTS "Admins can update teacher applications" ON public.teacher_applications;
CREATE POLICY "Admins can update teacher applications" ON public.teacher_applications
    FOR UPDATE USING (is_admin_or_super());

DROP POLICY IF EXISTS "Super admins can delete teacher applications" ON public.teacher_applications;
CREATE POLICY "Super admins can delete teacher applications" ON public.teacher_applications
    FOR DELETE USING (is_super_admin());

-- ======================================
-- AUDIT LOGS POLICIES
-- ======================================
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (is_admin_or_super());

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Super admins can delete audit logs" ON public.audit_logs;
CREATE POLICY "Super admins can delete audit logs" ON public.audit_logs
    FOR DELETE USING (is_super_admin());

-- ======================================
-- CONTENT APPROVAL POLICIES
-- ======================================
DROP POLICY IF EXISTS "Users can view own content approvals" ON public.content_approval;
CREATE POLICY "Users can view own content approvals" ON public.content_approval
    FOR SELECT USING (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Admins can view all content approvals" ON public.content_approval;
CREATE POLICY "Admins can view all content approvals" ON public.content_approval
    FOR SELECT USING (is_admin_or_super());

DROP POLICY IF EXISTS "Users can create content approvals" ON public.content_approval;
CREATE POLICY "Users can create content approvals" ON public.content_approval
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Admins can update content approvals" ON public.content_approval;
CREATE POLICY "Admins can update content approvals" ON public.content_approval
    FOR UPDATE USING (is_admin_or_super());

-- ======================================
-- COURSES POLICIES
-- ======================================
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses" ON public.courses
    FOR SELECT USING (is_published = true AND is_approved = true);

DROP POLICY IF EXISTS "Instructors can view own courses" ON public.courses;
CREATE POLICY "Instructors can view own courses" ON public.courses
    FOR SELECT USING (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Admins can view all courses" ON public.courses;
CREATE POLICY "Admins can view all courses" ON public.courses
    FOR SELECT USING (is_admin_or_super());

DROP POLICY IF EXISTS "Teachers can create courses" ON public.courses;
CREATE POLICY "Teachers can create courses" ON public.courses
    FOR INSERT WITH CHECK (
        get_user_roles(auth.uid()) && ARRAY['teacher','admin','super_admin']::user_role[] AND
        auth.uid() = instructor_id
    );

DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;
CREATE POLICY "Instructors can update own courses" ON public.courses
    FOR UPDATE USING (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Admins can update any course" ON public.courses;
CREATE POLICY "Admins can update any course" ON public.courses
    FOR UPDATE USING (is_admin_or_super());

DROP POLICY IF EXISTS "Super admins can delete courses" ON public.courses;
CREATE POLICY "Super admins can delete courses" ON public.courses
    FOR DELETE USING (is_super_admin());

-- ======================================
-- COURSE ENROLLMENTS POLICIES
-- ======================================
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.course_enrollments;
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Instructors can view course enrollments" ON public.course_enrollments;
CREATE POLICY "Instructors can view course enrollments" ON public.course_enrollments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT instructor_id FROM public.courses WHERE id = course_id
        )
    );

DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.course_enrollments;
CREATE POLICY "Admins can view all enrollments" ON public.course_enrollments
    FOR SELECT USING (is_admin_or_super());

DROP POLICY IF EXISTS "Users can enroll in courses" ON public.course_enrollments;
CREATE POLICY "Users can enroll in courses" ON public.course_enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enrollment" ON public.course_enrollments;
CREATE POLICY "Users can update own enrollment" ON public.course_enrollments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update any enrollment" ON public.course_enrollments;
CREATE POLICY "Admins can update any enrollment" ON public.course_enrollments
    FOR UPDATE USING (is_admin_or_super());

-- ======================================
-- BLOG POSTS POLICIES
-- ======================================
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;
CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
    FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Authors can view own blog posts" ON public.blog_posts;
CREATE POLICY "Authors can view own blog posts" ON public.blog_posts
    FOR SELECT USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins can view all blog posts" ON public.blog_posts;
CREATE POLICY "Admins can view all blog posts" ON public.blog_posts
    FOR SELECT USING (is_admin_or_super());

DROP POLICY IF EXISTS "Authorized users can create blog posts" ON public.blog_posts;
CREATE POLICY "Authorized users can create blog posts" ON public.blog_posts
    FOR INSERT WITH CHECK (
        get_user_roles(auth.uid()) && ARRAY['admin','super_admin','teacher']::user_role[] AND
        auth.uid() = author_id
    );

DROP POLICY IF EXISTS "Authors can update own blog posts" ON public.blog_posts;
CREATE POLICY "Authors can update own blog posts" ON public.blog_posts
    FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins can update any blog post" ON public.blog_posts;
CREATE POLICY "Admins can update any blog post" ON public.blog_posts
    FOR UPDATE USING (is_admin_or_super());

DROP POLICY IF EXISTS "Super admins can delete blog posts" ON public.blog_posts;
CREATE POLICY "Super admins can delete blog posts" ON public.blog_posts
    FOR DELETE USING (is_super_admin());

-- ======================================
-- SERVICES POLICIES
-- ======================================
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Providers can view own services" ON public.services;
CREATE POLICY "Providers can view own services" ON public.services
    FOR SELECT USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Admins can view all services" ON public.services;
CREATE POLICY "Admins can view all services" ON public.services
    FOR SELECT USING (is_admin_or_super());

DROP POLICY IF EXISTS "Users can create services" ON public.services;
CREATE POLICY "Users can create services" ON public.services
    FOR INSERT WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Providers can update own services" ON public.services;
CREATE POLICY "Providers can update own services" ON public.services
    FOR UPDATE USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Admins can update any service" ON public.services;
CREATE POLICY "Admins can update any service" ON public.services
    FOR UPDATE USING (is_admin_or_super());

DROP POLICY IF EXISTS "Super admins can delete services" ON public.services;
CREATE POLICY "Super admins can delete services" ON public.services
    FOR DELETE USING (is_super_admin());

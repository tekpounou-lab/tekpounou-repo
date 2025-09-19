-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_approval ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM public.users WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(auth.uid()) IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(auth.uid()) = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS TABLE POLICIES
-- Super admins can view all users
CREATE POLICY "Super admins can view all users" ON public.users
    FOR SELECT USING (is_super_admin());

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (is_admin_or_super());

-- Users can view their own record
CREATE POLICY "Users can view own record" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Super admins can update all users
CREATE POLICY "Super admins can update all users" ON public.users
    FOR UPDATE USING (is_super_admin());

-- Admins can update users (except super_admins)
CREATE POLICY "Admins can update users except super_admins" ON public.users
    FOR UPDATE USING (
        is_admin_or_super() AND 
        get_user_role(id) != 'super_admin'
    );

-- Users can update their own record (limited fields)
CREATE POLICY "Users can update own record" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Only super admins can insert users (registration handled by auth)
CREATE POLICY "Super admins can insert users" ON public.users
    FOR INSERT WITH CHECK (is_super_admin());

-- Only super admins can delete users
CREATE POLICY "Super admins can delete users" ON public.users
    FOR DELETE USING (is_super_admin());

-- PROFILES TABLE POLICIES
-- Everyone can view published profiles
CREATE POLICY "Anyone can view active profiles" ON public.profiles
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE USING (is_admin_or_super());

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Only super admins can delete profiles
CREATE POLICY "Super admins can delete profiles" ON public.profiles
    FOR DELETE USING (is_super_admin());

-- TEACHER APPLICATIONS POLICIES
-- Users can view their own applications
CREATE POLICY "Users can view own teacher applications" ON public.teacher_applications
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all teacher applications" ON public.teacher_applications
    FOR SELECT USING (is_admin_or_super());

-- Users can create their own applications
CREATE POLICY "Users can create teacher applications" ON public.teacher_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending applications
CREATE POLICY "Users can update own pending applications" ON public.teacher_applications
    FOR UPDATE USING (
        auth.uid() = user_id AND status = 'pending'
    );

-- Admins can update any application
CREATE POLICY "Admins can update teacher applications" ON public.teacher_applications
    FOR UPDATE USING (is_admin_or_super());

-- Only super admins can delete applications
CREATE POLICY "Super admins can delete teacher applications" ON public.teacher_applications
    FOR DELETE USING (is_super_admin());

-- AUDIT LOGS POLICIES
-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (is_admin_or_super());

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Only super admins can delete audit logs
CREATE POLICY "Super admins can delete audit logs" ON public.audit_logs
    FOR DELETE USING (is_super_admin());

-- CONTENT APPROVAL POLICIES
-- Users can view their own content approvals
CREATE POLICY "Users can view own content approvals" ON public.content_approval
    FOR SELECT USING (auth.uid() = submitted_by);

-- Admins can view all content approvals
CREATE POLICY "Admins can view all content approvals" ON public.content_approval
    FOR SELECT USING (is_admin_or_super());

-- Users can create content approvals
CREATE POLICY "Users can create content approvals" ON public.content_approval
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- Admins can update content approvals
CREATE POLICY "Admins can update content approvals" ON public.content_approval
    FOR UPDATE USING (is_admin_or_super());

-- COURSES POLICIES
-- Everyone can view published and approved courses
CREATE POLICY "Anyone can view published courses" ON public.courses
    FOR SELECT USING (is_published = true AND is_approved = true);

-- Instructors can view their own courses
CREATE POLICY "Instructors can view own courses" ON public.courses
    FOR SELECT USING (auth.uid() = instructor_id);

-- Admins can view all courses
CREATE POLICY "Admins can view all courses" ON public.courses
    FOR SELECT USING (is_admin_or_super());

-- Teachers can create courses
CREATE POLICY "Teachers can create courses" ON public.courses
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) IN ('teacher', 'admin', 'super_admin') AND
        auth.uid() = instructor_id
    );

-- Instructors can update their own courses
CREATE POLICY "Instructors can update own courses" ON public.courses
    FOR UPDATE USING (auth.uid() = instructor_id);

-- Admins can update any course
CREATE POLICY "Admins can update any course" ON public.courses
    FOR UPDATE USING (is_admin_or_super());

-- Only super admins can delete courses
CREATE POLICY "Super admins can delete courses" ON public.courses
    FOR DELETE USING (is_super_admin());

-- COURSE ENROLLMENTS POLICIES
-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments
    FOR SELECT USING (auth.uid() = user_id);

-- Instructors can view enrollments for their courses
CREATE POLICY "Instructors can view course enrollments" ON public.course_enrollments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT instructor_id FROM public.courses WHERE id = course_id
        )
    );

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" ON public.course_enrollments
    FOR SELECT USING (is_admin_or_super());

-- Users can enroll themselves
CREATE POLICY "Users can enroll in courses" ON public.course_enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own enrollment progress
CREATE POLICY "Users can update own enrollment" ON public.course_enrollments
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can update any enrollment
CREATE POLICY "Admins can update any enrollment" ON public.course_enrollments
    FOR UPDATE USING (is_admin_or_super());

-- BLOG POSTS POLICIES
-- Everyone can view published blog posts
CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
    FOR SELECT USING (is_published = true);

-- Authors can view their own posts
CREATE POLICY "Authors can view own blog posts" ON public.blog_posts
    FOR SELECT USING (auth.uid() = author_id);

-- Admins can view all blog posts
CREATE POLICY "Admins can view all blog posts" ON public.blog_posts
    FOR SELECT USING (is_admin_or_super());

-- Users with admin+ roles can create blog posts
CREATE POLICY "Authorized users can create blog posts" ON public.blog_posts
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) IN ('admin', 'super_admin', 'teacher') AND
        auth.uid() = author_id
    );

-- Authors can update their own posts
CREATE POLICY "Authors can update own blog posts" ON public.blog_posts
    FOR UPDATE USING (auth.uid() = author_id);

-- Admins can update any blog post
CREATE POLICY "Admins can update any blog post" ON public.blog_posts
    FOR UPDATE USING (is_admin_or_super());

-- Only super admins can delete blog posts
CREATE POLICY "Super admins can delete blog posts" ON public.blog_posts
    FOR DELETE USING (is_super_admin());

-- SERVICES POLICIES
-- Everyone can view active services
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = true);

-- Providers can view their own services
CREATE POLICY "Providers can view own services" ON public.services
    FOR SELECT USING (auth.uid() = provider_id);

-- Admins can view all services
CREATE POLICY "Admins can view all services" ON public.services
    FOR SELECT USING (is_admin_or_super());

-- Users can create services
CREATE POLICY "Users can create services" ON public.services
    FOR INSERT WITH CHECK (auth.uid() = provider_id);

-- Providers can update their own services
CREATE POLICY "Providers can update own services" ON public.services
    FOR UPDATE USING (auth.uid() = provider_id);

-- Admins can update any service
CREATE POLICY "Admins can update any service" ON public.services
    FOR UPDATE USING (is_admin_or_super());

-- Only super admins can delete services
CREATE POLICY "Super admins can delete services" ON public.services
    FOR DELETE USING (is_super_admin());

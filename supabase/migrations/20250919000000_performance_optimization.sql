-- Database Performance Optimization for Tek Pou Nou
-- This migration adds indexes, constraints, and performance optimizations for large-scale users

-- ==============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON public.users(email, is_active);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON public.profiles(preferred_language);
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON public.profiles USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Course-related indexes
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_language ON public.courses(language);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON public.courses(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_courses_active_category ON public.courses(status, category) WHERE status = 'published';

-- Course enrollments indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.course_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON public.course_enrollments(created_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_progress ON public.course_enrollments(progress_percentage);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_active ON public.course_enrollments(user_id, status) WHERE status = 'active';

-- Blog posts indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON public.blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_language ON public.blog_posts(language);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(status, created_at) WHERE status = 'published';

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON public.services(created_at);
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_language ON public.services(language);

-- Service requests indexes
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_service_id ON public.service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.service_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_service_requests_priority ON public.service_requests(priority);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_path ON public.analytics_events(page_path);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- AI Conversations indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON public.ai_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_role ON public.ai_conversations(user_id, user_role);

-- ==============================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Add missing foreign key constraints for data integrity
ALTER TABLE public.course_enrollments 
ADD CONSTRAINT fk_course_enrollments_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.course_enrollments 
ADD CONSTRAINT fk_course_enrollments_course_id 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.blog_posts 
ADD CONSTRAINT fk_blog_posts_author_id 
FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.services 
ADD CONSTRAINT fk_services_provider_id 
FOREIGN KEY (provider_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.service_requests 
ADD CONSTRAINT fk_service_requests_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.service_requests 
ADD CONSTRAINT fk_service_requests_service_id 
FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;

ALTER TABLE public.analytics_events 
ADD CONSTRAINT fk_analytics_events_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD CONSTRAINT fk_notifications_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.ai_conversations 
ADD CONSTRAINT fk_ai_conversations_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ==============================================
-- PARTITIONING FOR LARGE TABLES
-- ==============================================

-- Partition analytics_events table by month for better performance
-- Note: This requires recreating the table with partitioning

-- Create partitioned analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events_partitioned (
    LIKE public.analytics_events INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for current and future months
CREATE TABLE IF NOT EXISTS public.analytics_events_2025_01 
PARTITION OF public.analytics_events_partitioned
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS public.analytics_events_2025_02 
PARTITION OF public.analytics_events_partitioned
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE IF NOT EXISTS public.analytics_events_2025_03 
PARTITION OF public.analytics_events_partitioned
FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Add more partitions as needed...

-- ==============================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ==============================================

-- Create materialized view for course analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_course_analytics AS
SELECT 
    c.id as course_id,
    c.title,
    c.instructor_id,
    COUNT(ce.id) as total_enrollments,
    COUNT(CASE WHEN ce.status = 'active' THEN 1 END) as active_enrollments,
    COUNT(CASE WHEN ce.status = 'completed' THEN 1 END) as completed_enrollments,
    AVG(ce.progress_percentage) as avg_progress,
    c.created_at,
    c.updated_at
FROM public.courses c
LEFT JOIN public.course_enrollments ce ON c.id = ce.course_id
WHERE c.status = 'published'
GROUP BY c.id, c.title, c.instructor_id, c.created_at, c.updated_at;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_course_analytics_course_id 
ON public.mv_course_analytics(course_id);

-- Create materialized view for user activity
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_user_activity AS
SELECT 
    u.id as user_id,
    u.role,
    u.created_at as user_created_at,
    u.last_login,
    COUNT(DISTINCT ce.id) as total_enrollments,
    COUNT(DISTINCT CASE WHEN ce.status = 'completed' THEN ce.id END) as completed_courses,
    COUNT(DISTINCT bp.id) as blog_posts_created,
    COUNT(DISTINCT sr.id) as service_requests,
    MAX(ae.created_at) as last_activity
FROM public.users u
LEFT JOIN public.course_enrollments ce ON u.id = ce.user_id
LEFT JOIN public.blog_posts bp ON u.id = bp.author_id
LEFT JOIN public.service_requests sr ON u.id = sr.user_id
LEFT JOIN public.analytics_events ae ON u.id = ae.user_id
WHERE u.is_active = true
GROUP BY u.id, u.role, u.created_at, u.last_login;

-- Create unique index on user activity materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_activity_user_id 
ON public.mv_user_activity(user_id);

-- ==============================================
-- FUNCTIONS FOR CACHE INVALIDATION
-- ==============================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_course_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_activity;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_analytics(days_to_keep INTEGER DEFAULT 90)
RETURNS void AS $$
BEGIN
    DELETE FROM public.analytics_events 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    -- Refresh materialized views after cleanup
    PERFORM refresh_analytics_views();
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS FOR AUTOMATIC CACHE INVALIDATION
-- ==============================================

-- Function to handle materialized view refresh on data changes
CREATE OR REPLACE FUNCTION trigger_refresh_analytics()
RETURNS trigger AS $$
BEGIN
    -- Use pg_notify to signal external process to refresh views
    PERFORM pg_notify('refresh_analytics', '');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for course-related changes
CREATE TRIGGER trigger_course_analytics_refresh
    AFTER INSERT OR UPDATE OR DELETE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_analytics();

CREATE TRIGGER trigger_enrollment_analytics_refresh
    AFTER INSERT OR UPDATE OR DELETE ON public.course_enrollments
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_analytics();

-- ==============================================
-- PERFORMANCE MONITORING VIEWS
-- ==============================================

-- View for monitoring query performance
CREATE OR REPLACE VIEW public.v_slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time,
    stddev_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100  -- queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- View for table usage statistics
CREATE OR REPLACE VIEW public.v_table_usage AS
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON INDEX idx_users_email_active IS 'Composite index for active user lookups by email';
COMMENT ON INDEX idx_courses_active_category IS 'Partial index for published courses by category';
COMMENT ON INDEX idx_enrollments_user_active IS 'Partial index for active enrollments by user';
COMMENT ON INDEX idx_blog_posts_published IS 'Partial index for published blog posts';
COMMENT ON INDEX idx_notifications_user_unread IS 'Partial index for unread notifications';

COMMENT ON MATERIALIZED VIEW mv_course_analytics IS 'Aggregated course statistics for dashboards';
COMMENT ON MATERIALIZED VIEW mv_user_activity IS 'User activity summary for admin dashboards';

COMMENT ON FUNCTION refresh_analytics_views() IS 'Manually refresh all analytics materialized views';
COMMENT ON FUNCTION cleanup_old_analytics(INTEGER) IS 'Clean up old analytics data older than specified days';

-- ==============================================
-- GRANT PERMISSIONS
-- ==============================================

-- Grant permissions for the refresh function to service role
GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_analytics(INTEGER) TO service_role;

-- Grant SELECT permissions on materialized views
GRANT SELECT ON public.mv_course_analytics TO authenticated;
GRANT SELECT ON public.mv_user_activity TO authenticated;

-- Grant SELECT permissions on monitoring views to admins only
GRANT SELECT ON public.v_slow_queries TO service_role;
GRANT SELECT ON public.v_table_usage TO service_role;

-- ==============================================
-- INITIAL DATA REFRESH
-- ==============================================

-- Refresh materialized views with initial data
SELECT refresh_analytics_views();

-- Mobile Support and Performance Monitoring Schema
-- This migration adds tables for mobile app support, performance monitoring, and error tracking

-- ==============================================
-- MOBILE DEVICE MANAGEMENT
-- ==============================================

-- Table for tracking mobile devices
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    app_version TEXT,
    os_version TEXT,
    device_model TEXT,
    push_token TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'ht-HT',
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, device_id)
);

-- Table for push notification templates
CREATE TABLE IF NOT EXISTS public.push_notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    category TEXT,
    deep_link_pattern TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table for push notification history
CREATE TABLE IF NOT EXISTS public.push_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    device_id TEXT,
    template_id UUID REFERENCES public.push_notification_templates(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'clicked')),
    external_id TEXT, -- FCM/APNS message ID
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================
-- PERFORMANCE MONITORING
-- ==============================================

-- Table for performance metrics
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('timing', 'navigation', 'resource', 'custom')),
    page_url TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_id TEXT,
    user_agent TEXT,
    device_type TEXT,
    connection_type TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    additional_data JSONB
);

-- Table for error reports
CREATE TABLE IF NOT EXISTS public.error_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    component_stack TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    page_url TEXT NOT NULL,
    user_agent TEXT,
    device_info JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    error_boundary_level TEXT DEFAULT 'component',
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES public.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    additional_info JSONB
);

-- Table for API performance tracking
CREATE TABLE IF NOT EXISTS public.api_performance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms NUMERIC NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    request_size INTEGER,
    response_size INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    error_message TEXT
);

-- Table for system health metrics
CREATE TABLE IF NOT EXISTS public.system_health_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT,
    source TEXT NOT NULL, -- 'server', 'database', 'edge-function', etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    metadata JSONB
);

-- ==============================================
-- CACHING AND OPTIMIZATION
-- ==============================================

-- Table for cache statistics
CREATE TABLE IF NOT EXISTS public.cache_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT NOT NULL,
    cache_type TEXT NOT NULL, -- 'redis', 'memory', 'cdn', etc.
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMP WITH TIME ZONE,
    last_miss_at TIMESTAMP WITH TIME ZONE,
    total_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(cache_key, cache_type)
);

-- Table for A/B testing and feature flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_users JSONB, -- Array of user IDs or criteria
    target_platforms TEXT[], -- ['web', 'ios', 'android']
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table for tracking feature flag usage
CREATE TABLE IF NOT EXISTS public.feature_flag_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flag_id UUID REFERENCES public.feature_flags(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    platform TEXT,
    was_enabled BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    session_id TEXT,
    user_agent TEXT
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Indexes for user_devices
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_platform ON public.user_devices(platform);
CREATE INDEX IF NOT EXISTS idx_user_devices_is_active ON public.user_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_seen ON public.user_devices(last_seen);

-- Indexes for push_notifications
CREATE INDEX IF NOT EXISTS idx_push_notifications_user_id ON public.push_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON public.push_notifications(status);
CREATE INDEX IF NOT EXISTS idx_push_notifications_created_at ON public.push_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_push_notifications_sent_at ON public.push_notifications(sent_at);

-- Indexes for performance_metrics (with partitioning support)
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON public.performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON public.performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_type ON public.performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_page_url ON public.performance_metrics(page_url);

-- Indexes for error_reports
CREATE INDEX IF NOT EXISTS idx_error_reports_timestamp ON public.error_reports(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON public.error_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_is_resolved ON public.error_reports(is_resolved);
CREATE INDEX IF NOT EXISTS idx_error_reports_error_boundary_level ON public.error_reports(error_boundary_level);

-- Indexes for API performance
CREATE INDEX IF NOT EXISTS idx_api_performance_logs_timestamp ON public.api_performance_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_performance_logs_endpoint ON public.api_performance_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_performance_logs_user_id ON public.api_performance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_performance_logs_status_code ON public.api_performance_logs(status_code);

-- Indexes for system health
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_timestamp ON public.system_health_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_metric_name ON public.system_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_source ON public.system_health_metrics(source);

-- Indexes for feature flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_enabled ON public.feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_rollout_percentage ON public.feature_flags(rollout_percentage);
CREATE INDEX IF NOT EXISTS idx_feature_flag_usage_flag_id ON public.feature_flag_usage(flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_usage_user_id ON public.feature_flag_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_usage_timestamp ON public.feature_flag_usage(timestamp);

-- ==============================================
-- TRIGGERS AND FUNCTIONS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_devices_updated_at 
    BEFORE UPDATE ON public.user_devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_notification_templates_updated_at 
    BEFORE UPDATE ON public.push_notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cache_statistics_updated_at 
    BEFORE UPDATE ON public.cache_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at 
    BEFORE UPDATE ON public.feature_flags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup old performance data
CREATE OR REPLACE FUNCTION cleanup_old_performance_data(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old performance metrics
    DELETE FROM public.performance_metrics 
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old API performance logs
    DELETE FROM public.api_performance_logs 
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    -- Delete old system health metrics (keep longer - 90 days)
    DELETE FROM public.system_health_metrics 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Delete old push notifications (keep 60 days)
    DELETE FROM public.push_notifications 
    WHERE created_at < NOW() - INTERVAL '60 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
    metric_name TEXT,
    avg_value NUMERIC,
    min_value NUMERIC,
    max_value NUMERIC,
    count_value BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.metric_name,
        AVG(pm.metric_value) as avg_value,
        MIN(pm.metric_value) as min_value,
        MAX(pm.metric_value) as max_value,
        COUNT(pm.metric_value) as count_value
    FROM public.performance_metrics pm
    WHERE pm.timestamp BETWEEN start_date AND end_date
    GROUP BY pm.metric_name
    ORDER BY pm.metric_name;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Enable RLS on new tables
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_usage ENABLE ROW LEVEL SECURITY;

-- Policies for user_devices
CREATE POLICY "Users can view own devices" ON public.user_devices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own devices" ON public.user_devices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" ON public.user_devices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all devices" ON public.user_devices
    FOR ALL USING (is_admin_or_super());

-- Policies for push_notifications
CREATE POLICY "Users can view own notifications" ON public.push_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON public.push_notifications
    FOR ALL USING (is_admin_or_super());

-- Policies for performance_metrics
CREATE POLICY "Users can insert own metrics" ON public.performance_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all metrics" ON public.performance_metrics
    FOR SELECT USING (is_admin_or_super());

-- Policies for error_reports
CREATE POLICY "Users can insert own error reports" ON public.error_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all error reports" ON public.error_reports
    FOR SELECT USING (is_admin_or_super());

CREATE POLICY "Admins can update error reports" ON public.error_reports
    FOR UPDATE USING (is_admin_or_super());

-- Policies for feature_flags
CREATE POLICY "Everyone can view active feature flags" ON public.feature_flags
    FOR SELECT USING (is_enabled = true);

CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
    FOR ALL USING (is_admin_or_super());

-- Policies for feature_flag_usage
CREATE POLICY "Users can insert own feature flag usage" ON public.feature_flag_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feature flag usage" ON public.feature_flag_usage
    FOR SELECT USING (is_admin_or_super());

-- ==============================================
-- INITIAL DATA
-- ==============================================

-- Insert default push notification templates
INSERT INTO public.push_notification_templates (name, title_template, body_template, category) VALUES
('course_enrollment', 'Nouveau cours!', 'Vous êtes maintenant inscrit au cours "{{course_title}}"', 'education'),
('course_reminder', 'Continuez votre apprentissage', 'Il est temps de continuer le cours "{{course_title}}"', 'education'),
('assignment_due', 'Échéance approche', 'Votre devoir pour "{{course_title}}" est dû dans {{days}} jours', 'education'),
('certificate_earned', 'Félicitations!', 'Vous avez obtenu un certificat pour "{{course_title}}"', 'achievement'),
('service_request_update', 'Mise à jour de demande', 'Votre demande de service "{{service_title}}" a été {{status}}', 'service'),
('blog_post_published', 'Nouvel article', 'Nouvel article publié: "{{post_title}}"', 'content'),
('system_maintenance', 'Maintenance système', 'Maintenance programmée le {{date}} de {{start_time}} à {{end_time}}', 'system')
ON CONFLICT (name) DO NOTHING;

-- Insert default feature flags
INSERT INTO public.feature_flags (name, description, is_enabled, rollout_percentage, target_platforms) VALUES
('mobile_app_v2', 'New mobile app interface', false, 0, ARRAY['ios', 'android']),
('dark_mode', 'Dark mode theme support', true, 100, ARRAY['web', 'ios', 'android']),
('offline_mode', 'Offline content access', false, 10, ARRAY['ios', 'android']),
('ai_assistant_mobile', 'AI Assistant on mobile', true, 50, ARRAY['ios', 'android']),
('push_notifications', 'Push notification system', true, 100, ARRAY['ios', 'android']),
('biometric_auth', 'Biometric authentication', false, 25, ARRAY['ios', 'android'])
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- GRANTS AND PERMISSIONS
-- ==============================================

-- Grant permissions for service role
GRANT ALL ON public.user_devices TO service_role;
GRANT ALL ON public.push_notification_templates TO service_role;
GRANT ALL ON public.push_notifications TO service_role;
GRANT ALL ON public.performance_metrics TO service_role;
GRANT ALL ON public.error_reports TO service_role;
GRANT ALL ON public.api_performance_logs TO service_role;
GRANT ALL ON public.system_health_metrics TO service_role;
GRANT ALL ON public.cache_statistics TO service_role;
GRANT ALL ON public.feature_flags TO service_role;
GRANT ALL ON public.feature_flag_usage TO service_role;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION cleanup_old_performance_data(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_performance_summary(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO service_role;

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON TABLE public.user_devices IS 'Tracks mobile devices registered by users';
COMMENT ON TABLE public.push_notification_templates IS 'Templates for push notifications';
COMMENT ON TABLE public.push_notifications IS 'History of push notifications sent';
COMMENT ON TABLE public.performance_metrics IS 'Frontend performance metrics collection';
COMMENT ON TABLE public.error_reports IS 'Frontend and backend error tracking';
COMMENT ON TABLE public.api_performance_logs IS 'API endpoint performance monitoring';
COMMENT ON TABLE public.system_health_metrics IS 'System-level health and performance metrics';
COMMENT ON TABLE public.cache_statistics IS 'Cache hit/miss statistics';
COMMENT ON TABLE public.feature_flags IS 'Feature flag management for A/B testing';
COMMENT ON TABLE public.feature_flag_usage IS 'Track feature flag usage by users';

COMMENT ON FUNCTION cleanup_old_performance_data(INTEGER) IS 'Cleanup old performance and monitoring data';
COMMENT ON FUNCTION get_performance_summary(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Get performance metrics summary for a time period';

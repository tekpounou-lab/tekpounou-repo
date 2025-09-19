-- Monitoring, Maintenance, and Continuous Improvement System
-- Comprehensive system for tracking, auditing, and improving platform health

-- ==============================================
-- USER FEEDBACK AND CONTINUOUS IMPROVEMENT
-- ==============================================

-- Table for user feedback collection
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    module TEXT NOT NULL CHECK (module IN (
        'dashboard', 'courses', 'blog', 'services', 'payments', 
        'ai_assistant', 'mobile_app', 'search', 'navigation', 
        'user_experience', 'performance', 'content_quality'
    )),
    feedback_type TEXT NOT NULL CHECK (feedback_type IN (
        'bug_report', 'feature_request', 'improvement_suggestion', 
        'usability_issue', 'content_feedback', 'general_feedback'
    )),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'acknowledged', 'in_progress', 'resolved', 
        'rejected', 'duplicate'
    )),
    category TEXT,
    tags TEXT[],
    attachments JSONB DEFAULT '[]',
    user_agent TEXT,
    page_url TEXT,
    device_info JSONB,
    resolved_by UUID REFERENCES public.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table for audit trails of sensitive actions
CREATE TABLE IF NOT EXISTS public.audit_trails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'user_management', 'payment_processing', 'course_management',
        'content_moderation', 'system_configuration', 'security_event',
        'data_export', 'bulk_operation', 'ai_configuration'
    )),
    action_name TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table for system health status
CREATE TABLE IF NOT EXISTS public.system_health_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'maintenance')),
    uptime_percentage DECIMAL(5,2),
    response_time_avg DECIMAL(10,2), -- in milliseconds
    error_rate DECIMAL(5,2), -- percentage
    last_health_check TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    health_details JSONB DEFAULT '{}',
    alert_threshold_exceeded BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table for maintenance notifications
CREATE TABLE IF NOT EXISTS public.maintenance_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN (
        'scheduled', 'emergency', 'security_update', 'feature_update', 'infrastructure'
    )),
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    affected_services TEXT[] DEFAULT '{}',
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'in_progress', 'completed', 'cancelled', 'extended'
    )),
    notification_sent BOOLEAN DEFAULT false,
    user_groups TEXT[] DEFAULT '{}', -- ['all', 'admins', 'teachers', 'students', 'smes']
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Table for automated reports
CREATE TABLE IF NOT EXISTS public.automated_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN (
        'weekly_health', 'monthly_engagement', 'quarterly_growth', 
        'performance_summary', 'user_activity', 'revenue_summary',
        'ai_usage_analytics', 'content_performance'
    )),
    report_name TEXT NOT NULL,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
    recipients TEXT[] NOT NULL,
    report_data JSONB NOT NULL DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    file_url TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Table for API endpoint monitoring
CREATE TABLE IF NOT EXISTS public.api_health_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint_name TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    method TEXT DEFAULT 'GET' CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    expected_status INTEGER DEFAULT 200,
    response_time_ms INTEGER,
    status_code INTEGER,
    is_healthy BOOLEAN DEFAULT true,
    error_message TEXT,
    headers JSONB,
    payload JSONB,
    response_body TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table for database performance monitoring
CREATE TABLE IF NOT EXISTS public.database_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit TEXT,
    query_type TEXT, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
    slow_queries_count INTEGER DEFAULT 0,
    deadlocks_count INTEGER DEFAULT 0,
    connections_active INTEGER,
    connections_total INTEGER,
    buffer_cache_hit_ratio DECIMAL(5,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================
-- INDEXES FOR MONITORING TABLES
-- ==============================================

-- Indexes for user_feedback
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_module ON public.user_feedback(module);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON public.user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_priority ON public.user_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at DESC);

-- Indexes for audit_trails
CREATE INDEX IF NOT EXISTS idx_audit_trails_user_id ON public.audit_trails(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_action_type ON public.audit_trails(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_trails_resource ON public.audit_trails(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_created_at ON public.audit_trails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trails_ip_address ON public.audit_trails(ip_address);

-- Indexes for system_health_status
CREATE INDEX IF NOT EXISTS idx_system_health_service ON public.system_health_status(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON public.system_health_status(status);
CREATE INDEX IF NOT EXISTS idx_system_health_updated_at ON public.system_health_status(updated_at DESC);

-- Indexes for maintenance_notifications
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_start ON public.maintenance_notifications(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_notifications(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_severity ON public.maintenance_notifications(severity);

-- Indexes for automated_reports
CREATE INDEX IF NOT EXISTS idx_automated_reports_type ON public.automated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_automated_reports_generated_at ON public.automated_reports(generated_at DESC);

-- Indexes for api_health_checks
CREATE INDEX IF NOT EXISTS idx_api_health_endpoint ON public.api_health_checks(endpoint_name);
CREATE INDEX IF NOT EXISTS idx_api_health_checked_at ON public.api_health_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_health_is_healthy ON public.api_health_checks(is_healthy);

-- Indexes for database performance
CREATE INDEX IF NOT EXISTS idx_db_performance_metric_name ON public.database_performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_db_performance_timestamp ON public.database_performance_metrics(timestamp DESC);

-- ==============================================
-- TRIGGERS FOR AUTOMATED AUDIT TRAILS
-- ==============================================

-- Function to automatically create audit trail
CREATE OR REPLACE FUNCTION create_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    action_name TEXT;
    old_values JSONB;
    new_values JSONB;
    user_id UUID;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_name := 'CREATE';
        old_values := NULL;
        new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        action_name := 'UPDATE';
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        action_name := 'DELETE';
        old_values := to_jsonb(OLD);
        new_values := NULL;
    END IF;
    
    -- Get current user ID
    user_id := auth.uid();
    
    -- Insert audit trail
    INSERT INTO public.audit_trails (
        user_id,
        action_type,
        action_name,
        resource_type,
        resource_id,
        old_values,
        new_values
    ) VALUES (
        user_id,
        TG_ARGV[0], -- action_type passed as trigger argument
        action_name,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        old_values,
        new_values
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit trail triggers to sensitive tables
CREATE TRIGGER audit_user_profiles
    AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail('user_management');

CREATE TRIGGER audit_payments
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail('payment_processing');

CREATE TRIGGER audit_courses
    AFTER INSERT OR UPDATE OR DELETE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail('course_management');

CREATE TRIGGER audit_ai_personalizations
    AFTER INSERT OR UPDATE OR DELETE ON public.ai_personalizations
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail('ai_configuration');

-- ==============================================
-- FUNCTIONS FOR SYSTEM MONITORING
-- ==============================================

-- Function to check system health
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS TABLE(
    service_name TEXT,
    status TEXT,
    uptime_percentage DECIMAL,
    avg_response_time DECIMAL,
    error_rate DECIMAL,
    details JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        shs.service_name,
        shs.status,
        shs.uptime_percentage,
        shs.response_time_avg,
        shs.error_rate,
        shs.health_details
    FROM public.system_health_status shs
    ORDER BY 
        CASE shs.status 
            WHEN 'unhealthy' THEN 1
            WHEN 'degraded' THEN 2
            WHEN 'maintenance' THEN 3
            WHEN 'healthy' THEN 4
        END,
        shs.service_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance metrics summary
CREATE OR REPLACE FUNCTION get_performance_dashboard(
    hours_back INTEGER DEFAULT 24
)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    start_time TIMESTAMP WITH TIME ZONE;
    page_performance JSONB;
    api_performance JSONB;
    error_summary JSONB;
    user_activity JSONB;
BEGIN
    start_time := NOW() - INTERVAL '1 hour' * hours_back;
    
    -- Page performance metrics
    SELECT jsonb_build_object(
        'avg_page_load_time', COALESCE(AVG(metric_value), 0),
        'p95_page_load_time', COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value), 0),
        'total_page_views', COUNT(*),
        'slowest_pages', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'url', page_url,
                    'avg_time', AVG(metric_value)
                )
            )
            FROM public.performance_metrics
            WHERE timestamp >= start_time
            AND metric_name = 'page_load_time'
            GROUP BY page_url
            ORDER BY AVG(metric_value) DESC
            LIMIT 5
        )
    ) INTO page_performance
    FROM public.performance_metrics
    WHERE timestamp >= start_time
    AND metric_name = 'page_load_time';
    
    -- API performance metrics
    SELECT jsonb_build_object(
        'avg_response_time', COALESCE(AVG(response_time_ms), 0),
        'p95_response_time', COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms), 0),
        'total_requests', COUNT(*),
        'error_rate', COALESCE((COUNT(*) FILTER (WHERE status_code >= 400)::FLOAT / COUNT(*) * 100), 0),
        'slowest_endpoints', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'endpoint', endpoint,
                    'avg_time', AVG(response_time_ms),
                    'error_rate', (COUNT(*) FILTER (WHERE status_code >= 400)::FLOAT / COUNT(*) * 100)
                )
            )
            FROM public.api_performance_logs
            WHERE timestamp >= start_time
            GROUP BY endpoint
            ORDER BY AVG(response_time_ms) DESC
            LIMIT 5
        )
    ) INTO api_performance
    FROM public.api_performance_logs
    WHERE timestamp >= start_time;
    
    -- Error summary
    SELECT jsonb_build_object(
        'total_errors', COUNT(*),
        'unresolved_errors', COUNT(*) FILTER (WHERE is_resolved = false),
        'error_rate_trend', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'hour', date_trunc('hour', timestamp),
                    'count', count(*)
                )
            )
            FROM public.error_reports
            WHERE timestamp >= start_time
            GROUP BY date_trunc('hour', timestamp)
            ORDER BY date_trunc('hour', timestamp)
        ),
        'top_error_types', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'message', LEFT(error_message, 100),
                    'count', count(*)
                )
            )
            FROM public.error_reports
            WHERE timestamp >= start_time
            GROUP BY LEFT(error_message, 100)
            ORDER BY count(*) DESC
            LIMIT 5
        )
    ) INTO error_summary
    FROM public.error_reports
    WHERE timestamp >= start_time;
    
    -- User activity metrics
    SELECT jsonb_build_object(
        'active_users', COUNT(DISTINCT user_id),
        'total_sessions', COUNT(DISTINCT session_id),
        'avg_session_duration', 15.5, -- Placeholder - would need session tracking
        'top_pages', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'page', page_url,
                    'views', count(*)
                )
            )
            FROM public.performance_metrics
            WHERE timestamp >= start_time
            AND metric_name = 'page_view'
            GROUP BY page_url
            ORDER BY count(*) DESC
            LIMIT 10
        )
    ) INTO user_activity
    FROM public.performance_metrics
    WHERE timestamp >= start_time
    AND user_id IS NOT NULL;
    
    -- Combine all metrics
    result := jsonb_build_object(
        'timestamp', NOW(),
        'period_hours', hours_back,
        'page_performance', COALESCE(page_performance, '{}'),
        'api_performance', COALESCE(api_performance, '{}'),
        'error_summary', COALESCE(error_summary, '{}'),
        'user_activity', COALESCE(user_activity, '{}')
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate automated reports
CREATE OR REPLACE FUNCTION generate_automated_report(
    report_type TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    report_data JSONB := '{}';
    recipients TEXT[];
BEGIN
    CASE report_type
        WHEN 'weekly_health' THEN
            SELECT jsonb_build_object(
                'system_health', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'service', service_name,
                            'status', status,
                            'uptime', uptime_percentage,
                            'avg_response_time', response_time_avg
                        )
                    )
                    FROM public.system_health_status
                ),
                'performance_summary', get_performance_dashboard(168), -- 7 days
                'user_feedback_summary', (
                    SELECT jsonb_build_object(
                        'total_feedback', COUNT(*),
                        'by_priority', jsonb_object_agg(priority, count)
                    )
                    FROM (
                        SELECT priority, COUNT(*) as count
                        FROM public.user_feedback
                        WHERE created_at BETWEEN start_date AND end_date
                        GROUP BY priority
                    ) sub
                )
            ) INTO report_data;
            recipients := ARRAY['admin@tekpounou.com'];
            
        WHEN 'monthly_engagement' THEN
            SELECT jsonb_build_object(
                'active_users', COUNT(DISTINCT user_id),
                'course_enrollments', (
                    SELECT COUNT(*) FROM course_enrollments 
                    WHERE enrolled_at BETWEEN start_date AND end_date
                ),
                'ai_interactions', (
                    SELECT COUNT(*) FROM ai_usage_analytics 
                    WHERE created_at BETWEEN start_date AND end_date
                ),
                'engagement_by_feature', (
                    SELECT jsonb_object_agg(feature_name, interaction_count)
                    FROM (
                        SELECT feature_name, COUNT(*) as interaction_count
                        FROM ai_usage_analytics
                        WHERE created_at BETWEEN start_date AND end_date
                        GROUP BY feature_name
                    ) sub
                )
            ) INTO report_data
            FROM growth_metrics
            WHERE created_at BETWEEN start_date AND end_date;
            recipients := ARRAY['admin@tekpounou.com', 'analytics@tekpounou.com'];
    END CASE;
    
    -- Insert report record
    INSERT INTO public.automated_reports (
        report_type,
        report_name,
        schedule_type,
        recipients,
        report_data
    ) VALUES (
        report_type,
        report_type || '_' || to_char(NOW(), 'YYYY_MM_DD'),
        CASE 
            WHEN report_type LIKE '%weekly%' THEN 'weekly'
            WHEN report_type LIKE '%monthly%' THEN 'monthly'
            WHEN report_type LIKE '%quarterly%' THEN 'quarterly'
            ELSE 'daily'
        END,
        recipients,
        report_data
    );
    
    RETURN report_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old monitoring data
CREATE OR REPLACE FUNCTION cleanup_monitoring_data(
    days_to_keep INTEGER DEFAULT 90
)
RETURNS TABLE(
    table_name TEXT,
    deleted_count INTEGER
) AS $$
DECLARE
    cutoff_date TIMESTAMP WITH TIME ZONE;
    deleted_audit INTEGER;
    deleted_api_health INTEGER;
    deleted_db_metrics INTEGER;
    deleted_reports INTEGER;
BEGIN
    cutoff_date := NOW() - INTERVAL '1 day' * days_to_keep;
    
    -- Cleanup audit trails (keep 1 year)
    DELETE FROM public.audit_trails 
    WHERE created_at < NOW() - INTERVAL '365 days';
    GET DIAGNOSTICS deleted_audit = ROW_COUNT;
    
    -- Cleanup API health checks (keep 30 days)
    DELETE FROM public.api_health_checks 
    WHERE checked_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_api_health = ROW_COUNT;
    
    -- Cleanup database performance metrics (keep 90 days)
    DELETE FROM public.database_performance_metrics 
    WHERE timestamp < cutoff_date;
    GET DIAGNOSTICS deleted_db_metrics = ROW_COUNT;
    
    -- Cleanup old automated reports (keep 180 days)
    DELETE FROM public.automated_reports 
    WHERE generated_at < NOW() - INTERVAL '180 days';
    GET DIAGNOSTICS deleted_reports = ROW_COUNT;
    
    -- Return cleanup summary
    RETURN QUERY VALUES 
        ('audit_trails', deleted_audit),
        ('api_health_checks', deleted_api_health),
        ('database_performance_metrics', deleted_db_metrics),
        ('automated_reports', deleted_reports);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Enable RLS on all monitoring tables
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for user_feedback
CREATE POLICY "Users can create their own feedback" ON public.user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" ON public.user_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON public.user_feedback
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all feedback" ON public.user_feedback
    FOR ALL USING (is_admin_or_super());

-- Policies for audit_trails (admin only)
CREATE POLICY "Admins can view audit trails" ON public.audit_trails
    FOR SELECT USING (is_admin_or_super());

-- Policies for system health (admin and service role only)
CREATE POLICY "Admins can view system health" ON public.system_health_status
    FOR SELECT USING (is_admin_or_super());

CREATE POLICY "Service role can manage system health" ON public.system_health_status
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for maintenance notifications
CREATE POLICY "Everyone can view active maintenance" ON public.maintenance_notifications
    FOR SELECT USING (status IN ('scheduled', 'in_progress'));

CREATE POLICY "Admins can manage maintenance notifications" ON public.maintenance_notifications
    FOR ALL USING (is_admin_or_super());

-- Policies for automated reports (admin only)
CREATE POLICY "Admins can view automated reports" ON public.automated_reports
    FOR SELECT USING (is_admin_or_super());

-- Policies for API health checks (admin and service role)
CREATE POLICY "Admins can view API health" ON public.api_health_checks
    FOR SELECT USING (is_admin_or_super());

CREATE POLICY "Service role can manage API health" ON public.api_health_checks
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for database metrics (admin and service role)
CREATE POLICY "Admins can view DB metrics" ON public.database_performance_metrics
    FOR SELECT USING (is_admin_or_super());

CREATE POLICY "Service role can insert DB metrics" ON public.database_performance_metrics
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ==============================================
-- INITIAL DATA AND GRANTS
-- ==============================================

-- Insert initial system health services
INSERT INTO public.system_health_status (service_name, status, uptime_percentage, response_time_avg, error_rate) VALUES
('web_application', 'healthy', 99.9, 150.0, 0.1),
('api_gateway', 'healthy', 99.8, 80.0, 0.2),
('database', 'healthy', 99.9, 20.0, 0.05),
('auth_service', 'healthy', 99.7, 100.0, 0.3),
('ai_services', 'healthy', 99.5, 200.0, 0.5),
('email_service', 'healthy', 99.6, 500.0, 0.4),
('payment_gateway', 'healthy', 99.8, 300.0, 0.2),
('cdn', 'healthy', 99.9, 50.0, 0.1)
ON CONFLICT (service_name) DO NOTHING;

-- Grant permissions to service role
GRANT ALL ON public.user_feedback TO service_role;
GRANT ALL ON public.audit_trails TO service_role;
GRANT ALL ON public.system_health_status TO service_role;
GRANT ALL ON public.maintenance_notifications TO service_role;
GRANT ALL ON public.automated_reports TO service_role;
GRANT ALL ON public.api_health_checks TO service_role;
GRANT ALL ON public.database_performance_metrics TO service_role;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION check_system_health() TO service_role;
GRANT EXECUTE ON FUNCTION get_performance_dashboard(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION generate_automated_report(TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_monitoring_data(INTEGER) TO service_role;

-- ==============================================
-- TABLE COMMENTS
-- ==============================================

COMMENT ON TABLE public.user_feedback IS 'User feedback and suggestions for continuous improvement';
COMMENT ON TABLE public.audit_trails IS 'Audit trail for sensitive actions and security compliance';
COMMENT ON TABLE public.system_health_status IS 'Real-time system health status for all services';
COMMENT ON TABLE public.maintenance_notifications IS 'Scheduled and emergency maintenance notifications';
COMMENT ON TABLE public.automated_reports IS 'Automated reports for admins on platform health and engagement';
COMMENT ON TABLE public.api_health_checks IS 'Health check results for API endpoints';
COMMENT ON TABLE public.database_performance_metrics IS 'Database performance monitoring metrics';

COMMENT ON FUNCTION check_system_health() IS 'Get current system health status for all services';
COMMENT ON FUNCTION get_performance_dashboard(INTEGER) IS 'Get comprehensive performance dashboard data';
COMMENT ON FUNCTION generate_automated_report(TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Generate automated reports for admins';
COMMENT ON FUNCTION cleanup_monitoring_data(INTEGER) IS 'Cleanup old monitoring data to maintain performance';
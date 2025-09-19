-- Additional Analytics Functions and Triggers
-- Created: 2025-09-18
-- Purpose: Support functions for analytics calculations and automated updates

-- Function to get user registration trends
CREATE OR REPLACE FUNCTION get_user_registration_trends()
RETURNS TABLE(
    period TEXT,
    new_users BIGINT,
    total_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE date_series AS (
        SELECT 
            CURRENT_DATE - INTERVAL '29 days' AS date_val
        UNION ALL
        SELECT 
            date_val + INTERVAL '1 day'
        FROM date_series
        WHERE date_val < CURRENT_DATE
    ),
    daily_registrations AS (
        SELECT 
            DATE(created_at) as reg_date,
            COUNT(*) as daily_count,
            SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as running_total
        FROM profiles
        WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
        GROUP BY DATE(created_at)
    )
    SELECT 
        TO_CHAR(ds.date_val, 'Mon DD') as period,
        COALESCE(dr.daily_count, 0) as new_users,
        COALESCE(dr.running_total, 0) as total_users
    FROM date_series ds
    LEFT JOIN daily_registrations dr ON ds.date_val = dr.reg_date
    ORDER BY ds.date_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get enrollment trends
CREATE OR REPLACE FUNCTION get_enrollment_trends()
RETURNS TABLE(
    period TEXT,
    enrollments BIGINT,
    completions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE date_series AS (
        SELECT 
            CURRENT_DATE - INTERVAL '6 days' AS date_val
        UNION ALL
        SELECT 
            date_val + INTERVAL '1 day'
        FROM date_series
        WHERE date_val < CURRENT_DATE
    ),
    daily_stats AS (
        SELECT 
            DATE(created_at) as enroll_date,
            COUNT(*) as daily_enrollments,
            COUNT(*) FILTER (WHERE progress_percentage = 100) as daily_completions
        FROM enrollments
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(created_at)
    )
    SELECT 
        'Week ' || EXTRACT(WEEK FROM ds.date_val)::TEXT as period,
        COALESCE(dst.daily_enrollments, 0) as enrollments,
        COALESCE(dst.daily_completions, 0) as completions
    FROM date_series ds
    LEFT JOIN daily_stats dst ON ds.date_val = dst.enroll_date
    ORDER BY ds.date_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
    content_type_param VARCHAR,
    content_id_param UUID
) RETURNS DECIMAL AS $$
DECLARE
    views_weight DECIMAL := 1.0;
    likes_weight DECIMAL := 3.0;
    shares_weight DECIMAL := 5.0;
    comments_weight DECIMAL := 4.0;
    base_score DECIMAL;
BEGIN
    SELECT 
        (views * views_weight + 
         likes * likes_weight + 
         shares * shares_weight + 
         comments * comments_weight)
    INTO base_score
    FROM content_engagement
    WHERE content_type = content_type_param 
    AND content_id = content_id_param;
    
    RETURN COALESCE(base_score, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update content engagement
CREATE OR REPLACE FUNCTION update_content_engagement(
    content_type_param VARCHAR,
    content_id_param UUID,
    event_type_param VARCHAR
) RETURNS VOID AS $$
BEGIN
    INSERT INTO content_engagement (content_type, content_id, views, likes, shares, comments)
    VALUES (content_type_param, content_id_param, 
            CASE WHEN event_type_param = 'view' THEN 1 ELSE 0 END,
            CASE WHEN event_type_param = 'like' THEN 1 ELSE 0 END,
            CASE WHEN event_type_param = 'share' THEN 1 ELSE 0 END,
            CASE WHEN event_type_param = 'comment' THEN 1 ELSE 0 END)
    ON CONFLICT (content_type, content_id) 
    DO UPDATE SET
        views = content_engagement.views + 
                CASE WHEN event_type_param = 'view' THEN 1 ELSE 0 END,
        likes = content_engagement.likes + 
                CASE WHEN event_type_param = 'like' THEN 1 ELSE 0 END,
        shares = content_engagement.shares + 
                 CASE WHEN event_type_param = 'share' THEN 1 ELSE 0 END,
        comments = content_engagement.comments + 
                   CASE WHEN event_type_param = 'comment' THEN 1 ELSE 0 END,
        engagement_score = calculate_engagement_score(content_type_param, content_id_param),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate analytics summary
CREATE OR REPLACE FUNCTION aggregate_analytics_summary(
    scope_param VARCHAR,
    ref_id_param UUID DEFAULT NULL,
    period_param VARCHAR DEFAULT 'all_time'
) RETURNS JSONB AS $$
DECLARE
    start_date TIMESTAMP WITH TIME ZONE;
    metrics JSONB := '{}';
    event_counts JSONB;
    engagement_data JSONB;
BEGIN
    -- Determine date range based on period
    CASE period_param
        WHEN 'daily' THEN start_date := CURRENT_DATE;
        WHEN 'weekly' THEN start_date := CURRENT_DATE - INTERVAL '7 days';
        WHEN 'monthly' THEN start_date := CURRENT_DATE - INTERVAL '30 days';
        WHEN 'yearly' THEN start_date := CURRENT_DATE - INTERVAL '365 days';
        ELSE start_date := '1900-01-01'::TIMESTAMP; -- all_time
    END CASE;

    -- Get event counts
    SELECT jsonb_object_agg(event_type, event_count)
    INTO event_counts
    FROM (
        SELECT 
            event_type,
            COUNT(*) as event_count
        FROM analytics_events
        WHERE created_at >= start_date
        AND (ref_id_param IS NULL OR 
             (metadata->>'course_id')::UUID = ref_id_param OR
             (metadata->>'project_id')::UUID = ref_id_param OR
             (metadata->>'post_id')::UUID = ref_id_param)
        GROUP BY event_type
    ) event_summary;

    -- Get engagement data if applicable
    IF scope_param IN ('course', 'blog', 'service') THEN
        SELECT jsonb_build_object(
            'views', COALESCE(views, 0),
            'likes', COALESCE(likes, 0),
            'shares', COALESCE(shares, 0),
            'comments', COALESCE(comments, 0),
            'engagement_score', COALESCE(engagement_score, 0)
        )
        INTO engagement_data
        FROM content_engagement
        WHERE content_type = scope_param AND content_id = ref_id_param;
    END IF;

    -- Build metrics JSON
    metrics := jsonb_build_object(
        'period', period_param,
        'start_date', start_date,
        'generated_at', NOW(),
        'event_counts', COALESCE(event_counts, '{}'),
        'engagement', COALESCE(engagement_data, '{}')
    );

    -- Add scope-specific metrics
    CASE scope_param
        WHEN 'course' THEN
            metrics := metrics || jsonb_build_object(
                'total_enrollments', (
                    SELECT COUNT(*) FROM enrollments WHERE course_id = ref_id_param
                ),
                'active_learners', (
                    SELECT COUNT(*) FROM enrollments 
                    WHERE course_id = ref_id_param 
                    AND last_accessed_at > NOW() - INTERVAL '30 days'
                ),
                'completion_rate', (
                    SELECT calculate_course_completion_rate(ref_id_param)
                )
            );
        WHEN 'user' THEN
            metrics := metrics || jsonb_build_object(
                'enrolled_courses', (
                    SELECT COUNT(*) FROM enrollments WHERE user_id = ref_id_param
                ),
                'completed_courses', (
                    SELECT COUNT(*) FROM enrollments 
                    WHERE user_id = ref_id_param AND progress_percentage = 100
                ),
                'total_time_spent', (
                    SELECT COALESCE(SUM(time_spent), 0) FROM enrollments WHERE user_id = ref_id_param
                )
            );
        WHEN 'global' THEN
            metrics := metrics || jsonb_build_object(
                'total_users', (SELECT COUNT(*) FROM profiles),
                'total_courses', (SELECT COUNT(*) FROM courses),
                'total_enrollments', (SELECT COUNT(*) FROM enrollments),
                'active_users_30d', (
                    SELECT COUNT(DISTINCT user_id) FROM analytics_events 
                    WHERE created_at > NOW() - INTERVAL '30 days'
                )
            );
    END CASE;

    RETURN metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to auto-update analytics when events are logged
CREATE OR REPLACE FUNCTION handle_analytics_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Update content engagement for view/like events
    CASE NEW.event_type
        WHEN 'course_view' THEN
            PERFORM update_content_engagement('course', (NEW.metadata->>'course_id')::UUID, 'view');
        WHEN 'blog_view' THEN
            PERFORM update_content_engagement('blog_post', (NEW.metadata->>'post_id')::UUID, 'view');
        WHEN 'blog_like' THEN
            PERFORM update_content_engagement('blog_post', (NEW.metadata->>'post_id')::UUID, 'like');
    END CASE;

    -- Update user progress for lesson events
    IF NEW.event_type = 'lesson_complete' THEN
        INSERT INTO user_progress (
            user_id, course_id, lesson_id, progress_percentage, 
            completed_at, time_spent
        ) VALUES (
            NEW.user_id, 
            (NEW.metadata->>'course_id')::UUID,
            (NEW.metadata->>'lesson_id')::UUID,
            100,
            NOW(),
            (NEW.metadata->>'time_spent')::INTEGER
        ) ON CONFLICT (user_id, lesson_id) DO UPDATE SET
            progress_percentage = 100,
            completed_at = NOW(),
            time_spent = user_progress.time_spent + (NEW.metadata->>'time_spent')::INTEGER,
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for analytics events
CREATE TRIGGER analytics_event_processor
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION handle_analytics_event();

-- Function to batch update learning analytics for all courses
CREATE OR REPLACE FUNCTION update_all_learning_analytics()
RETURNS INTEGER AS $$
DECLARE
    course_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    FOR course_record IN SELECT id FROM courses LOOP
        PERFORM update_learning_analytics(course_record.id);
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create unique constraint on learning_analytics if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'learning_analytics_course_id_key'
    ) THEN
        ALTER TABLE learning_analytics ADD CONSTRAINT learning_analytics_course_id_key UNIQUE (course_id);
    END IF;
END;
$$;

-- Function to clean old analytics events (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM analytics_events
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_registration_trends() IS 'Returns user registration trends over the last 30 days';
COMMENT ON FUNCTION get_enrollment_trends() IS 'Returns enrollment and completion trends over the last 7 days';
COMMENT ON FUNCTION calculate_engagement_score(VARCHAR, UUID) IS 'Calculates weighted engagement score for content';
COMMENT ON FUNCTION update_content_engagement(VARCHAR, UUID, VARCHAR) IS 'Updates content engagement metrics';
COMMENT ON FUNCTION aggregate_analytics_summary(VARCHAR, UUID, VARCHAR) IS 'Aggregates analytics data for dashboard display';
COMMENT ON FUNCTION update_all_learning_analytics() IS 'Batch update learning analytics for all courses';
COMMENT ON FUNCTION cleanup_old_analytics_events() IS 'Removes analytics events older than 90 days';
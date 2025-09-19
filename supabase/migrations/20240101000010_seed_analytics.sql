-- Analytics Module Seed Data
-- Created: 2025-09-18
-- Purpose: Populate analytics tables with sample data for testing and demonstration

-- Insert sample analytics events
INSERT INTO analytics_events (user_id, event_type, metadata, session_id, created_at) 
SELECT 
    p.id as user_id,
    'login' as event_type,
    jsonb_build_object('login_method', 'email') as metadata,
    'session_' || generate_random_uuid()::text as session_id,
    NOW() - (random() * INTERVAL '30 days') as created_at
FROM profiles p
WHERE p.role IN ('student', 'teacher', 'sme_client')
LIMIT 50;

-- Course view events
INSERT INTO analytics_events (user_id, event_type, metadata, session_id, created_at)
SELECT 
    e.user_id,
    'course_view' as event_type,
    jsonb_build_object(
        'course_id', c.id::text,
        'course_title', c.title,
        'category', c.category
    ) as metadata,
    'session_' || generate_random_uuid()::text as session_id,
    e.created_at + (random() * INTERVAL '1 hour') as created_at
FROM enrollments e
JOIN courses c ON c.id = e.course_id
LIMIT 100;

-- Lesson completion events
INSERT INTO analytics_events (user_id, event_type, metadata, session_id, created_at)
SELECT 
    e.user_id,
    'lesson_complete' as event_type,
    jsonb_build_object(
        'lesson_id', l.id::text,
        'lesson_title', l.title,
        'course_id', c.id::text,
        'time_spent', (300 + random() * 1200)::int -- 5-25 minutes
    ) as metadata,
    'session_' || generate_random_uuid()::text as session_id,
    e.created_at + (random() * INTERVAL '7 days') as created_at
FROM enrollments e
JOIN courses c ON c.id = e.course_id
JOIN lessons l ON l.course_id = c.id
WHERE random() < 0.6 -- 60% of enrolled students complete lessons
LIMIT 200;

-- Blog view events
INSERT INTO analytics_events (user_id, event_type, metadata, session_id, created_at)
SELECT 
    p.id as user_id,
    'blog_view' as event_type,
    jsonb_build_object(
        'post_id', bp.id::text,
        'post_title', bp.title,
        'category', bp.category
    ) as metadata,
    'session_' || generate_random_uuid()::text as session_id,
    bp.created_at + (random() * INTERVAL '10 days') as created_at
FROM profiles p
CROSS JOIN blog_posts bp
WHERE random() < 0.3 -- 30% chance of viewing each post
LIMIT 150;

-- Service request events
INSERT INTO analytics_events (user_id, event_type, metadata, session_id, created_at)
SELECT 
    sr.client_id as user_id,
    'service_request' as event_type,
    jsonb_build_object(
        'service_id', s.id::text,
        'service_name', s.name,
        'request_id', sr.id::text
    ) as metadata,
    'session_' || generate_random_uuid()::text as session_id,
    sr.created_at
FROM service_requests sr
JOIN services s ON s.id = sr.service_id;

-- Project view events
INSERT INTO analytics_events (user_id, event_type, metadata, session_id, created_at)
SELECT 
    p.client_id as user_id,
    'project_view' as event_type,
    jsonb_build_object(
        'project_id', p.id::text,
        'project_name', p.title
    ) as metadata,
    'session_' || generate_random_uuid()::text as session_id,
    p.created_at + (random() * INTERVAL '5 days') as created_at
FROM projects p;

-- Search events
INSERT INTO analytics_events (user_id, event_type, metadata, session_id, created_at)
SELECT 
    p.id as user_id,
    'search' as event_type,
    jsonb_build_object(
        'query', (ARRAY['web development', 'data science', 'AI', 'mobile apps', 'business services', 'marketing'])[floor(random() * 6) + 1],
        'results_count', (5 + random() * 20)::int,
        'search_type', 'courses'
    ) as metadata,
    'session_' || generate_random_uuid()::text as session_id,
    NOW() - (random() * INTERVAL '7 days') as created_at
FROM profiles p
WHERE random() < 0.4
LIMIT 30;

-- Update blog posts with view counts (simulate engagement)
UPDATE blog_posts 
SET 
    view_count = (50 + random() * 200)::int,
    like_count = (5 + random() * 50)::int
WHERE id IN (SELECT id FROM blog_posts LIMIT 10);

-- Initialize content engagement for blog posts
INSERT INTO content_engagement (content_type, content_id, views, likes, engagement_score)
SELECT 
    'blog_post' as content_type,
    id as content_id,
    view_count as views,
    like_count as likes,
    (view_count * 1.0 + like_count * 3.0) as engagement_score
FROM blog_posts
WHERE view_count > 0;

-- Initialize content engagement for courses
INSERT INTO content_engagement (content_type, content_id, views, likes, engagement_score)
SELECT 
    'course' as content_type,
    c.id as content_id,
    COUNT(ae.*) as views,
    0 as likes,
    COUNT(ae.*) * 1.0 as engagement_score
FROM courses c
LEFT JOIN analytics_events ae ON ae.event_type = 'course_view' 
    AND (ae.metadata->>'course_id')::uuid = c.id
GROUP BY c.id;

-- Initialize learning analytics for all courses
SELECT update_all_learning_analytics();

-- Create sample analytics summaries
INSERT INTO analytics_summary (scope, ref_id, period, metrics) VALUES
('global', NULL, 'monthly', jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_courses', (SELECT COUNT(*) FROM courses),
    'total_enrollments', (SELECT COUNT(*) FROM enrollments),
    'active_users', (SELECT COUNT(DISTINCT user_id) FROM analytics_events WHERE created_at > NOW() - INTERVAL '30 days'),
    'generated_at', NOW()
)),
('global', NULL, 'weekly', jsonb_build_object(
    'new_enrollments', (SELECT COUNT(*) FROM enrollments WHERE created_at > NOW() - INTERVAL '7 days'),
    'course_views', (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'course_view' AND created_at > NOW() - INTERVAL '7 days'),
    'blog_views', (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'blog_view' AND created_at > NOW() - INTERVAL '7 days'),
    'generated_at', NOW()
));

-- Insert user-specific analytics summaries
INSERT INTO analytics_summary (scope, ref_id, period, metrics)
SELECT 
    'user' as scope,
    p.id as ref_id,
    'all_time' as period,
    jsonb_build_object(
        'enrolled_courses', COALESCE(e.enrollment_count, 0),
        'completed_courses', COALESCE(e.completed_count, 0),
        'total_events', COALESCE(ae.event_count, 0),
        'last_activity', COALESCE(ae.last_activity, p.created_at),
        'generated_at', NOW()
    ) as metrics
FROM profiles p
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as enrollment_count,
        COUNT(*) FILTER (WHERE progress_percentage = 100) as completed_count
    FROM enrollments
    GROUP BY user_id
) e ON e.user_id = p.id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as event_count,
        MAX(created_at) as last_activity
    FROM analytics_events
    GROUP BY user_id
) ae ON ae.user_id = p.id
WHERE p.role IN ('student', 'teacher', 'sme_client')
LIMIT 20;

-- Course-specific analytics summaries
INSERT INTO analytics_summary (scope, ref_id, period, metrics)
SELECT 
    'course' as scope,
    c.id as ref_id,
    'all_time' as period,
    jsonb_build_object(
        'total_enrollments', COALESCE(e.enrollment_count, 0),
        'completion_rate', COALESCE(ROUND((e.completed_count::DECIMAL / NULLIF(e.enrollment_count, 0) * 100), 2), 0),
        'average_progress', COALESCE(e.avg_progress, 0),
        'total_views', COALESCE(ae.view_count, 0),
        'generated_at', NOW()
    ) as metrics
FROM courses c
LEFT JOIN (
    SELECT 
        course_id,
        COUNT(*) as enrollment_count,
        COUNT(*) FILTER (WHERE progress_percentage = 100) as completed_count,
        ROUND(AVG(progress_percentage), 2) as avg_progress
    FROM enrollments
    GROUP BY course_id
) e ON e.course_id = c.id
LEFT JOIN (
    SELECT 
        (metadata->>'course_id')::uuid as course_id,
        COUNT(*) as view_count
    FROM analytics_events
    WHERE event_type = 'course_view'
    GROUP BY (metadata->>'course_id')::uuid
) ae ON ae.course_id = c.id
LIMIT 10;

-- Add some user progress records
INSERT INTO user_progress (user_id, course_id, lesson_id, progress_percentage, time_spent, completed_at)
SELECT 
    e.user_id,
    e.course_id,
    l.id as lesson_id,
    CASE 
        WHEN random() < 0.7 THEN 100 
        ELSE (30 + random() * 70)::int 
    END as progress_percentage,
    (300 + random() * 1500)::int as time_spent,
    CASE 
        WHEN random() < 0.7 THEN e.created_at + (random() * INTERVAL '10 days')
        ELSE NULL 
    END as completed_at
FROM enrollments e
JOIN courses c ON c.id = e.course_id
JOIN lessons l ON l.course_id = c.id
WHERE random() < 0.5 -- 50% of enrolled students have progress records
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- Update enrollment progress based on user progress
UPDATE enrollments 
SET 
    progress_percentage = progress_stats.avg_progress,
    last_accessed_at = progress_stats.last_access,
    time_spent = progress_stats.total_time
FROM (
    SELECT 
        up.user_id,
        up.course_id,
        ROUND(AVG(up.progress_percentage)) as avg_progress,
        MAX(up.updated_at) as last_access,
        SUM(up.time_spent) as total_time
    FROM user_progress up
    GROUP BY up.user_id, up.course_id
) progress_stats
WHERE enrollments.user_id = progress_stats.user_id 
    AND enrollments.course_id = progress_stats.course_id;

-- Update project completion percentages
UPDATE projects 
SET 
    completion_percentage = task_stats.completion_rate,
    last_activity_at = task_stats.last_update
FROM (
    SELECT 
        project_id,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'done')::DECIMAL / 
             NULLIF(COUNT(*), 0) * 100)
        ) as completion_rate,
        MAX(updated_at) as last_update
    FROM project_tasks
    GROUP BY project_id
) task_stats
WHERE projects.id = task_stats.project_id;

-- Trigger analytics summary calculations for existing data
SELECT aggregate_analytics_summary('global', NULL, 'all_time');

COMMENT ON TABLE analytics_events IS 'Sample analytics events showing user interactions across the platform';
COMMENT ON TABLE user_progress IS 'Sample progress data for users across different lessons and courses';
COMMENT ON TABLE analytics_summary IS 'Pre-calculated analytics summaries for dashboard performance';
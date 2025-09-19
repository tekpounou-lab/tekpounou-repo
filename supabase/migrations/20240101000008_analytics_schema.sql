-- Analytics & AI Insights Module Database Schema
-- Created: 2025-09-18
-- Purpose: Track user events, analytics summaries, and prepare for AI insights

-- Analytics Events Table - Track all user interactions
CREATE TABLE analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'login', 'logout', 'course_view', 'lesson_start', 'lesson_complete', 
        'quiz_attempt', 'blog_view', 'blog_like', 'service_request', 
        'project_view', 'task_update', 'enrollment', 'search'
    )),
    metadata JSONB DEFAULT '{}'::jsonb,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Summary Table - Aggregated metrics for dashboards
CREATE TABLE analytics_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scope VARCHAR(50) NOT NULL CHECK (scope IN (
        'global', 'course', 'service', 'blog', 'user', 'project'
    )),
    ref_id UUID, -- Reference to course_id, user_id, etc.
    period VARCHAR(20) NOT NULL CHECK (period IN (
        'daily', 'weekly', 'monthly', 'yearly', 'all_time'
    )),
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Progress Tracking - Extend existing functionality
CREATE TABLE user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Learning Analytics - Course-specific metrics
CREATE TABLE learning_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    total_enrollments INTEGER DEFAULT 0,
    active_learners INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    average_progress DECIMAL(5,2) DEFAULT 0.00,
    total_time_spent BIGINT DEFAULT 0, -- total seconds across all users
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Engagement - Blog and general content metrics
CREATE TABLE content_engagement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('blog_post', 'course', 'lesson', 'service')),
    content_id UUID NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    engagement_score DECIMAL(8,2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_type, content_id)
);

-- Create indexes for performance
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_summary_scope ON analytics_summary(scope, ref_id);
CREATE INDEX idx_analytics_summary_period ON analytics_summary(period);
CREATE INDEX idx_user_progress_user_course ON user_progress(user_id, course_id);
CREATE INDEX idx_learning_analytics_course ON learning_analytics(course_id);
CREATE INDEX idx_content_engagement_type_id ON content_engagement(content_type, content_id);

-- Add tracking columns to existing tables
ALTER TABLE enrollments ADD COLUMN progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
ALTER TABLE enrollments ADD COLUMN last_accessed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE enrollments ADD COLUMN time_spent INTEGER DEFAULT 0;

ALTER TABLE projects ADD COLUMN completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
ALTER TABLE projects ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE blog_posts ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN like_count INTEGER DEFAULT 0;

-- Row Level Security Policies

-- Analytics Events - Users can only see their own events, admins see all
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics events" ON analytics_events
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin'))
    );

CREATE POLICY "System can insert analytics events" ON analytics_events
    FOR INSERT WITH CHECK (true); -- Allow system to log events

-- Analytics Summary - Role-based access
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can view all analytics summaries" ON analytics_summary
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

CREATE POLICY "Admin can view content analytics summaries" ON analytics_summary
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') AND
        scope IN ('course', 'service', 'blog', 'global')
    );

CREATE POLICY "Teachers can view their course analytics summaries" ON analytics_summary
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher') AND
        scope = 'course' AND
        ref_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())
    );

CREATE POLICY "SME clients can view their project analytics summaries" ON analytics_summary
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'sme_client') AND
        scope = 'project' AND
        ref_id IN (SELECT id FROM projects WHERE client_id = auth.uid())
    );

CREATE POLICY "Users can view their own user analytics summaries" ON analytics_summary
    FOR SELECT USING (
        scope = 'user' AND ref_id = auth.uid()
    );

-- User Progress - Users can view their own progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')) OR
        EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid())
    );

CREATE POLICY "System can manage user progress" ON user_progress
    FOR ALL USING (true); -- Allow system to update progress

-- Learning Analytics - Teachers can view their courses, admins can view all
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own course analytics" ON learning_analytics
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.instructor_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin'))
    );

-- Content Engagement - Role-based access
ALTER TABLE content_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all content engagement" ON content_engagement
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin'))
    );

CREATE POLICY "Teachers can view their content engagement" ON content_engagement
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher') AND (
            (content_type = 'course' AND content_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())) OR
            (content_type = 'lesson' AND content_id IN (SELECT lessons.id FROM lessons JOIN courses ON lessons.course_id = courses.id WHERE courses.instructor_id = auth.uid())) OR
            (content_type = 'blog_post' AND content_id IN (SELECT id FROM blog_posts WHERE author_id = auth.uid()))
        )
    );

CREATE POLICY "SME clients can view their service engagement" ON content_engagement
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'sme_client') AND
        content_type = 'service' AND 
        content_id IN (SELECT service_id FROM service_requests WHERE client_id = auth.uid())
    );

-- Functions for analytics calculations

-- Function to calculate course completion rate
CREATE OR REPLACE FUNCTION calculate_course_completion_rate(course_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_enrollments INTEGER;
    completed_enrollments INTEGER;
    completion_rate DECIMAL;
BEGIN
    SELECT COUNT(*) INTO total_enrollments 
    FROM enrollments 
    WHERE course_id = course_uuid;
    
    SELECT COUNT(*) INTO completed_enrollments 
    FROM enrollments 
    WHERE course_id = course_uuid AND progress_percentage = 100;
    
    IF total_enrollments > 0 THEN
        completion_rate := (completed_enrollments::DECIMAL / total_enrollments::DECIMAL) * 100;
    ELSE
        completion_rate := 0;
    END IF;
    
    RETURN completion_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update learning analytics
CREATE OR REPLACE FUNCTION update_learning_analytics(course_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total_enroll INTEGER;
    active_learn INTEGER;
    avg_progress DECIMAL;
    completion_rt DECIMAL;
    total_time BIGINT;
BEGIN
    -- Get total enrollments
    SELECT COUNT(*) INTO total_enroll 
    FROM enrollments 
    WHERE course_id = course_uuid;
    
    -- Get active learners (accessed in last 30 days)
    SELECT COUNT(*) INTO active_learn 
    FROM enrollments 
    WHERE course_id = course_uuid 
    AND last_accessed_at > NOW() - INTERVAL '30 days';
    
    -- Get average progress
    SELECT COALESCE(AVG(progress_percentage), 0) INTO avg_progress 
    FROM enrollments 
    WHERE course_id = course_uuid;
    
    -- Get completion rate
    SELECT calculate_course_completion_rate(course_uuid) INTO completion_rt;
    
    -- Get total time spent
    SELECT COALESCE(SUM(time_spent), 0) INTO total_time 
    FROM enrollments 
    WHERE course_id = course_uuid;
    
    -- Insert or update learning analytics
    INSERT INTO learning_analytics (
        course_id, total_enrollments, active_learners, 
        completion_rate, average_progress, total_time_spent
    ) VALUES (
        course_uuid, total_enroll, active_learn, 
        completion_rt, avg_progress, total_time
    )
    ON CONFLICT (course_id) DO UPDATE SET
        total_enrollments = EXCLUDED.total_enrollments,
        active_learners = EXCLUDED.active_learners,
        completion_rate = EXCLUDED.completion_rate,
        average_progress = EXCLUDED.average_progress,
        total_time_spent = EXCLUDED.total_time_spent,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update analytics when enrollment progress changes
CREATE OR REPLACE FUNCTION update_enrollment_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update learning analytics for the course
    PERFORM update_learning_analytics(NEW.course_id);
    
    -- Log analytics event
    INSERT INTO analytics_events (user_id, event_type, metadata)
    VALUES (NEW.user_id, 'enrollment', jsonb_build_object(
        'course_id', NEW.course_id,
        'progress_percentage', NEW.progress_percentage,
        'time_spent', NEW.time_spent
    ));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enrollment_analytics_trigger
    AFTER INSERT OR UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_analytics();

-- Trigger to update content engagement
CREATE OR REPLACE FUNCTION update_blog_engagement()
RETURNS TRIGGER AS $$
BEGIN
    -- Update content engagement
    INSERT INTO content_engagement (content_type, content_id, views, likes)
    VALUES ('blog_post', NEW.id, NEW.view_count, NEW.like_count)
    ON CONFLICT (content_type, content_id) DO UPDATE SET
        views = EXCLUDED.views,
        likes = EXCLUDED.likes,
        engagement_score = (EXCLUDED.views * 1.0 + EXCLUDED.likes * 3.0),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER blog_engagement_trigger
    AFTER UPDATE ON blog_posts
    FOR EACH ROW
    WHEN (OLD.view_count != NEW.view_count OR OLD.like_count != NEW.like_count)
    EXECUTE FUNCTION update_blog_engagement();

COMMENT ON TABLE analytics_events IS 'Tracks all user interactions for analytics and AI insights';
COMMENT ON TABLE analytics_summary IS 'Aggregated metrics for dashboards and reporting';
COMMENT ON TABLE user_progress IS 'Detailed progress tracking for individual users and lessons';
COMMENT ON TABLE learning_analytics IS 'Course-specific analytics and metrics';
COMMENT ON TABLE content_engagement IS 'Content engagement metrics across all content types';
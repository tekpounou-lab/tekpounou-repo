-- AI Personalization and Expansion System for Tek Pou Nou
-- Advanced AI features with personalized learning, predictive analytics, and voice assistance

-- Create ai_personalizations table for AI-driven recommendations
CREATE TABLE IF NOT EXISTS public.ai_personalizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('learning_path', 'content_recommendation', 'teacher_insight', 'sme_guidance', 'course_suggestion', 'event_recommendation')),
    context JSONB NOT NULL DEFAULT '{}',
    recommendation_json JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    is_active BOOLEAN DEFAULT true,
    user_action TEXT CHECK (user_action IN ('viewed', 'clicked', 'dismissed', 'completed', 'bookmarked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_feedback table for user feedback on AI suggestions
CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    personalization_id UUID REFERENCES public.ai_personalizations(id) ON DELETE CASCADE,
    module TEXT NOT NULL CHECK (module IN ('chat_assistant', 'learning_path', 'content_recommendation', 'voice_assistant', 'predictive_analytics', 'summary_generation')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    feedback_type TEXT CHECK (feedback_type IN ('helpful', 'not_helpful', 'inappropriate', 'incorrect', 'excellent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_learning_paths table for personalized learning journeys
CREATE TABLE IF NOT EXISTS public.ai_learning_paths (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    estimated_duration_hours INTEGER,
    path_data JSONB NOT NULL DEFAULT '{}', -- Contains courses, resources, milestones
    completion_percentage DECIMAL(5,2) DEFAULT 0.0,
    is_ai_generated BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_content_recommendations table for personalized content
CREATE TABLE IF NOT EXISTS public.ai_content_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('course', 'blog_post', 'event', 'resource', 'service', 'project')),
    content_id UUID,
    recommendation_reason TEXT,
    relevance_score DECIMAL(3,2) DEFAULT 0.0,
    interaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    viewed_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE
);

-- Create ai_analytics_predictions table for predictive analytics
CREATE TABLE IF NOT EXISTS public.ai_analytics_predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('course_demand', 'user_engagement', 'completion_rate', 'sme_project_trends', 'event_attendance')),
    target_entity_type TEXT CHECK (target_entity_type IN ('course', 'user', 'event', 'service', 'platform')),
    target_entity_id UUID,
    prediction_data JSONB NOT NULL DEFAULT '{}',
    confidence_level DECIMAL(3,2) DEFAULT 0.0,
    prediction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_outcome JSONB DEFAULT '{}',
    accuracy_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_voice_interactions table for voice assistant features
CREATE TABLE IF NOT EXISTS public.ai_voice_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    audio_url TEXT,
    transcribed_text TEXT,
    response_text TEXT,
    response_audio_url TEXT,
    language TEXT DEFAULT 'ht' CHECK (language IN ('ht', 'en', 'fr')),
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_summaries table for AI-generated content summaries
CREATE TABLE IF NOT EXISTS public.ai_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('course_lesson', 'blog_post', 'event', 'project', 'service_description')),
    content_id UUID NOT NULL,
    original_content_hash TEXT,
    summary_text TEXT NOT NULL,
    summary_language TEXT DEFAULT 'ht' CHECK (summary_language IN ('ht', 'en', 'fr')),
    summary_length TEXT CHECK (summary_length IN ('short', 'medium', 'long')),
    generated_by TEXT DEFAULT 'ai_system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_usage_analytics table for tracking AI feature usage
CREATE TABLE IF NOT EXISTS public.ai_usage_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'use', 'complete', 'dismiss', 'rate')),
    session_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_personalizations_user_id ON public.ai_personalizations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_personalizations_type ON public.ai_personalizations(type);
CREATE INDEX IF NOT EXISTS idx_ai_personalizations_active ON public.ai_personalizations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_personalizations_expires ON public.ai_personalizations(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON public.ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_module ON public.ai_feedback(module);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON public.ai_feedback(rating);

CREATE INDEX IF NOT EXISTS idx_ai_learning_paths_user_id ON public.ai_learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_paths_active ON public.ai_learning_paths(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ai_content_recommendations_user_id ON public.ai_content_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_recommendations_type ON public.ai_content_recommendations(content_type);
CREATE INDEX IF NOT EXISTS idx_ai_content_recommendations_score ON public.ai_content_recommendations(relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analytics_predictions_type ON public.ai_analytics_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_predictions_date ON public.ai_analytics_predictions(prediction_date);

CREATE INDEX IF NOT EXISTS idx_ai_voice_interactions_user_id ON public.ai_voice_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_voice_interactions_session ON public.ai_voice_interactions(session_id);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_content ON public.ai_summaries(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_language ON public.ai_summaries(summary_language);

CREATE INDEX IF NOT EXISTS idx_ai_usage_analytics_user_id ON public.ai_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_analytics_feature ON public.ai_usage_analytics(feature_name);
CREATE INDEX IF NOT EXISTS idx_ai_usage_analytics_created_at ON public.ai_usage_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_personalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_content_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analytics_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_voice_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_personalizations
CREATE POLICY "Users can view their own AI personalizations" ON public.ai_personalizations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI personalizations" ON public.ai_personalizations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI personalizations" ON public.ai_personalizations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all AI personalizations" ON public.ai_personalizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for ai_feedback
CREATE POLICY "Users can manage their own AI feedback" ON public.ai_feedback
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI feedback" ON public.ai_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for ai_learning_paths
CREATE POLICY "Users can manage their own learning paths" ON public.ai_learning_paths
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student learning paths" ON public.ai_learning_paths
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('teacher', 'admin', 'super_admin')
        )
    );

-- RLS Policies for ai_content_recommendations
CREATE POLICY "Users can view their own content recommendations" ON public.ai_content_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own content recommendations" ON public.ai_content_recommendations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert content recommendations" ON public.ai_content_recommendations
    FOR INSERT WITH CHECK (true);

-- RLS Policies for ai_analytics_predictions
CREATE POLICY "Admins can manage predictions" ON public.ai_analytics_predictions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Teachers can view relevant predictions" ON public.ai_analytics_predictions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'teacher'
        ) AND prediction_type IN ('course_demand', 'completion_rate', 'user_engagement')
    );

-- RLS Policies for ai_voice_interactions
CREATE POLICY "Users can manage their own voice interactions" ON public.ai_voice_interactions
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for ai_summaries
CREATE POLICY "Anyone can view AI summaries" ON public.ai_summaries
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage AI summaries" ON public.ai_summaries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for ai_usage_analytics
CREATE POLICY "Users can view their own usage analytics" ON public.ai_usage_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage analytics" ON public.ai_usage_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage analytics" ON public.ai_usage_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Functions for AI personalization system

-- Function to generate personalized learning path
CREATE OR REPLACE FUNCTION generate_personalized_learning_path(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    path_id UUID;
    user_profile RECORD;
    user_skills JSONB;
    recommended_courses JSONB;
    path_name TEXT;
BEGIN
    -- Get user profile and context
    SELECT * INTO user_profile FROM user_profiles WHERE user_id = user_uuid;
    
    IF user_profile IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
    
    -- Analyze user's current courses and progress
    SELECT jsonb_agg(
        jsonb_build_object(
            'course_id', ce.course_id,
            'progress', ce.progress,
            'enrolled_at', ce.enrolled_at,
            'completion_rate', ce.completion_rate
        )
    ) INTO user_skills
    FROM course_enrollments ce
    WHERE ce.user_id = user_uuid;
    
    -- Generate course recommendations based on user's skill level and interests
    SELECT jsonb_agg(
        jsonb_build_object(
            'course_id', c.id,
            'title', c.title,
            'difficulty', c.difficulty_level,
            'relevance_score', 
            CASE 
                WHEN c.difficulty_level = 'beginner' THEN 0.8
                WHEN c.difficulty_level = 'intermediate' THEN 0.6
                ELSE 0.4
            END
        )
    ) INTO recommended_courses
    FROM courses c
    WHERE c.is_published = true
    AND c.id NOT IN (
        SELECT course_id FROM course_enrollments 
        WHERE user_id = user_uuid
    )
    ORDER BY c.created_at DESC
    LIMIT 10;
    
    -- Create personalized learning path name
    path_name := CASE user_profile.role
        WHEN 'student' THEN 'Personal Learning Journey'
        WHEN 'teacher' THEN 'Professional Development Path'
        WHEN 'sme' THEN 'Business Skills Enhancement'
        ELSE 'Customized Learning Path'
    END;
    
    -- Insert new learning path
    INSERT INTO ai_learning_paths (
        user_id,
        name,
        description,
        difficulty_level,
        estimated_duration_hours,
        path_data,
        is_ai_generated
    ) VALUES (
        user_uuid,
        path_name,
        'AI-generated personalized learning path based on your interests and current skill level',
        CASE 
            WHEN jsonb_array_length(COALESCE(user_skills, '[]'::jsonb)) = 0 THEN 'beginner'
            WHEN jsonb_array_length(COALESCE(user_skills, '[]'::jsonb)) < 3 THEN 'intermediate'
            ELSE 'advanced'
        END,
        40, -- Estimated 40 hours
        jsonb_build_object(
            'user_skills', COALESCE(user_skills, '[]'::jsonb),
            'recommended_courses', COALESCE(recommended_courses, '[]'::jsonb),
            'milestones', jsonb_build_array(
                jsonb_build_object('name', 'Complete first course', 'progress', 0),
                jsonb_build_object('name', 'Reach 50% overall progress', 'progress', 0),
                jsonb_build_object('name', 'Complete learning path', 'progress', 0)
            )
        ),
        true
    ) RETURNING id INTO path_id;
    
    -- Create personalization record
    INSERT INTO ai_personalizations (
        user_id,
        type,
        context,
        recommendation_json,
        confidence_score
    ) VALUES (
        user_uuid,
        'learning_path',
        jsonb_build_object(
            'user_role', user_profile.role,
            'current_courses_count', jsonb_array_length(COALESCE(user_skills, '[]'::jsonb))
        ),
        jsonb_build_object(
            'learning_path_id', path_id,
            'path_name', path_name,
            'estimated_duration', 40
        ),
        0.85
    );
    
    RETURN path_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate content recommendations
CREATE OR REPLACE FUNCTION generate_content_recommendations(user_uuid UUID, content_type TEXT DEFAULT 'course')
RETURNS TABLE (
    recommendation_id UUID,
    content_id UUID,
    content_title TEXT,
    relevance_score DECIMAL,
    recommendation_reason TEXT
) AS $$
DECLARE
    user_context JSONB;
    user_role TEXT;
BEGIN
    -- Get user context
    SELECT up.role INTO user_role FROM user_profiles up WHERE up.user_id = user_uuid;
    
    -- Generate recommendations based on content type and user role
    IF content_type = 'course' THEN
        RETURN QUERY
        WITH user_interests AS (
            SELECT DISTINCT category
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            WHERE ce.user_id = user_uuid
        ),
        recommended_courses AS (
            SELECT DISTINCT
                uuid_generate_v4() as rec_id,
                c.id,
                c.title,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM user_interests ui WHERE ui.category = c.category) THEN 0.9
                    WHEN c.difficulty_level = 'beginner' THEN 0.7
                    ELSE 0.5
                END as score,
                CASE 
                    WHEN EXISTS(SELECT 1 FROM user_interests ui WHERE ui.category = c.category) 
                    THEN 'Based on your interest in ' || c.category
                    ELSE 'Popular course recommendation'
                END as reason
            FROM courses c
            WHERE c.is_published = true
            AND c.id NOT IN (
                SELECT course_id FROM course_enrollments 
                WHERE user_id = user_uuid
            )
            ORDER BY score DESC
            LIMIT 5
        )
        SELECT rec_id, id, title, score, reason
        FROM recommended_courses;
        
        -- Insert recommendations into database
        INSERT INTO ai_content_recommendations (user_id, content_type, content_id, recommendation_reason, relevance_score)
        SELECT user_uuid, 'course', id, reason, score
        FROM recommended_courses;
        
    ELSIF content_type = 'event' THEN
        RETURN QUERY
        SELECT 
            uuid_generate_v4() as rec_id,
            e.id,
            e.title,
            0.8::DECIMAL as score,
            'Upcoming event you might like'::TEXT as reason
        FROM events e
        WHERE e.event_date > NOW()
        AND e.id NOT IN (
            SELECT event_id FROM event_attendees 
            WHERE user_id = user_uuid
        )
        ORDER BY e.event_date
        LIMIT 3;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track AI usage analytics
CREATE OR REPLACE FUNCTION track_ai_usage(
    user_uuid UUID,
    feature_name TEXT,
    interaction_type TEXT,
    session_uuid UUID DEFAULT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO ai_usage_analytics (
        user_id,
        feature_name,
        interaction_type,
        session_id,
        metadata
    ) VALUES (
        user_uuid,
        feature_name,
        interaction_type,
        session_uuid,
        metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get AI insights for teachers
CREATE OR REPLACE FUNCTION get_teacher_ai_insights(teacher_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    insights JSONB := '{}';
    student_performance JSONB;
    engagement_patterns JSONB;
    recommendations JSONB;
BEGIN
    -- Analyze student performance in teacher's courses
    SELECT jsonb_agg(
        jsonb_build_object(
            'course_id', c.id,
            'course_title', c.title,
            'total_students', COUNT(ce.user_id),
            'avg_progress', AVG(ce.progress),
            'completion_rate', 
            COUNT(CASE WHEN ce.completion_rate >= 100 THEN 1 END)::FLOAT / NULLIF(COUNT(ce.user_id), 0) * 100
        )
    ) INTO student_performance
    FROM courses c
    LEFT JOIN course_enrollments ce ON c.id = ce.course_id
    WHERE c.instructor_id = teacher_uuid
    GROUP BY c.id, c.title;
    
    -- Analyze engagement patterns
    SELECT jsonb_build_object(
        'peak_activity_hours', json_agg(extract(hour from created_at)),
        'most_active_days', json_agg(extract(dow from created_at))
    ) INTO engagement_patterns
    FROM (
        SELECT created_at
        FROM course_progress cp
        JOIN courses c ON cp.course_id = c.id
        WHERE c.instructor_id = teacher_uuid
        AND cp.created_at > NOW() - INTERVAL '30 days'
        LIMIT 1000
    ) recent_activity;
    
    -- Generate recommendations
    recommendations := jsonb_build_array(
        jsonb_build_object(
            'type', 'engagement',
            'title', 'Increase interaction',
            'suggestion', 'Consider adding more interactive elements to courses with lower engagement'
        ),
        jsonb_build_object(
            'type', 'content',
            'title', 'Content optimization',
            'suggestion', 'Break down complex lessons into smaller, digestible parts'
        )
    );
    
    insights := jsonb_build_object(
        'student_performance', COALESCE(student_performance, '[]'::jsonb),
        'engagement_patterns', COALESCE(engagement_patterns, '{}'::jsonb),
        'recommendations', recommendations,
        'generated_at', NOW()
    );
    
    RETURN insights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get SME guidance suggestions
CREATE OR REPLACE FUNCTION get_sme_ai_guidance(sme_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    guidance JSONB := '{}';
    business_opportunities JSONB;
    trending_services JSONB;
    recommendations JSONB;
BEGIN
    -- Analyze business opportunities
    SELECT jsonb_agg(
        jsonb_build_object(
            'service_category', sc.name,
            'demand_level', COUNT(sr.id),
            'avg_budget', AVG(
                CASE 
                    WHEN sr.budget_range = 'small' THEN 500
                    WHEN sr.budget_range = 'medium' THEN 2000
                    WHEN sr.budget_range = 'large' THEN 5000
                    ELSE 1000
                END
            )
        )
    ) INTO business_opportunities
    FROM service_categories sc
    LEFT JOIN services s ON sc.id = s.category_id
    LEFT JOIN service_requests sr ON s.id = sr.service_id
    WHERE sr.created_at > NOW() - INTERVAL '90 days'
    GROUP BY sc.id, sc.name
    ORDER BY COUNT(sr.id) DESC
    LIMIT 5;
    
    -- Get trending services
    SELECT jsonb_agg(
        jsonb_build_object(
            'service_title', s.title,
            'category', sc.name,
            'recent_requests', COUNT(sr.id)
        )
    ) INTO trending_services
    FROM services s
    JOIN service_categories sc ON s.category_id = sc.id
    LEFT JOIN service_requests sr ON s.id = sr.service_id
    WHERE sr.created_at > NOW() - INTERVAL '30 days'
    GROUP BY s.id, s.title, sc.name
    ORDER BY COUNT(sr.id) DESC
    LIMIT 3;
    
    -- Generate SME recommendations
    recommendations := jsonb_build_array(
        jsonb_build_object(
            'type', 'market_opportunity',
            'title', 'High-demand services',
            'suggestion', 'Consider expanding services in high-demand categories'
        ),
        jsonb_build_object(
            'type', 'networking',
            'title', 'Collaboration opportunities',
            'suggestion', 'Connect with complementary service providers for partnership opportunities'
        ),
        jsonb_build_object(
            'type', 'skill_development',
            'title', 'Skill enhancement',
            'suggestion', 'Take courses related to trending service categories to expand your offerings'
        )
    );
    
    guidance := jsonb_build_object(
        'business_opportunities', COALESCE(business_opportunities, '[]'::jsonb),
        'trending_services', COALESCE(trending_services, '[]'::jsonb),
        'recommendations', recommendations,
        'generated_at', NOW()
    );
    
    RETURN guidance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger function for ai_personalizations
CREATE OR REPLACE FUNCTION update_ai_personalization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_ai_personalizations_updated_at
    BEFORE UPDATE ON public.ai_personalizations
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_personalization_timestamp();

CREATE TRIGGER update_ai_learning_paths_updated_at
    BEFORE UPDATE ON public.ai_learning_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_personalization_timestamp();

CREATE TRIGGER update_ai_analytics_predictions_updated_at
    BEFORE UPDATE ON public.ai_analytics_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_personalization_timestamp();

CREATE TRIGGER update_ai_summaries_updated_at
    BEFORE UPDATE ON public.ai_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_personalization_timestamp();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.ai_personalizations TO authenticated;
GRANT ALL ON public.ai_feedback TO authenticated;
GRANT ALL ON public.ai_learning_paths TO authenticated;
GRANT ALL ON public.ai_content_recommendations TO authenticated;
GRANT ALL ON public.ai_analytics_predictions TO authenticated;
GRANT ALL ON public.ai_voice_interactions TO authenticated;
GRANT ALL ON public.ai_summaries TO authenticated;
GRANT ALL ON public.ai_usage_analytics TO authenticated;

GRANT EXECUTE ON FUNCTION generate_personalized_learning_path(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_content_recommendations(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION track_ai_usage(UUID, TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_teacher_ai_insights(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sme_ai_guidance(UUID) TO authenticated;

-- Insert default AI settings for new features
INSERT INTO public.ai_settings (setting_key, setting_value, description) VALUES
    ('personalization_enabled', 'true', 'Enable AI personalization features'),
    ('voice_assistant_enabled', 'false', 'Enable voice assistant functionality'),
    ('predictive_analytics_enabled', 'true', 'Enable predictive analytics'),
    ('content_recommendations_enabled', 'true', 'Enable AI content recommendations'),
    ('learning_path_generation_enabled', 'true', 'Enable AI learning path generation'),
    ('summary_generation_enabled', 'true', 'Enable AI summary generation'),
    ('teacher_insights_enabled', 'true', 'Enable AI insights for teachers'),
    ('sme_guidance_enabled', 'true', 'Enable AI guidance for SMEs'),
    ('max_recommendations_per_user', '10', 'Maximum recommendations to show per user'),
    ('recommendation_refresh_hours', '24', 'Hours between recommendation refreshes'),
    ('voice_session_max_duration_minutes', '30', 'Maximum voice session duration'),
    ('summary_max_length_words', '150', 'Maximum words in AI-generated summaries')
ON CONFLICT (setting_key) DO NOTHING;
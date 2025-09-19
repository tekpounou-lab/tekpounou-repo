-- Add AI Assistant System to Tek Pou Nou

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    response TEXT,
    context JSONB DEFAULT '{}',
    language TEXT DEFAULT 'ht' CHECK (language IN ('ht', 'en', 'fr')),
    is_helpful BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_behavior_templates table for admin-configurable responses
CREATE TABLE IF NOT EXISTS public.ai_behavior_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    user_role TEXT NOT NULL CHECK (user_role IN ('student', 'teacher', 'sme', 'admin')),
    trigger_keywords TEXT[],
    template_response TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'ht' CHECK (language IN ('ht', 'en', 'fr')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_settings table for global AI configuration
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_user_preferences table for individual user AI settings
CREATE TABLE IF NOT EXISTS public.ai_user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    ai_enabled BOOLEAN DEFAULT true,
    preferred_language TEXT DEFAULT 'ht' CHECK (preferred_language IN ('ht', 'en', 'fr')),
    voice_enabled BOOLEAN DEFAULT false,
    quick_suggestions_enabled BOOLEAN DEFAULT true,
    conversation_history_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON public.ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON public.ai_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_behavior_templates_user_role ON public.ai_behavior_templates(user_role);
CREATE INDEX IF NOT EXISTS idx_ai_behavior_templates_active ON public.ai_behavior_templates(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_behavior_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view their own conversations" ON public.ai_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON public.ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.ai_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations" ON public.ai_conversations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS Policies for ai_behavior_templates
CREATE POLICY "Anyone can view active templates" ON public.ai_behavior_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON public.ai_behavior_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS Policies for ai_settings
CREATE POLICY "Admins can manage AI settings" ON public.ai_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS Policies for ai_user_preferences
CREATE POLICY "Users can view their own AI preferences" ON public.ai_user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI preferences" ON public.ai_user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Insert default AI settings
INSERT INTO public.ai_settings (setting_key, setting_value, description) VALUES
    ('ai_enabled_global', 'true', 'Global AI assistant enable/disable'),
    ('ai_model_provider', '"local"', 'AI model provider: local, openai, anthropic'),
    ('ai_response_max_length', '500', 'Maximum response length in characters'),
    ('ai_context_window', '10', 'Number of previous messages to include in context'),
    ('rate_limit_per_user', '50', 'Maximum AI requests per user per hour'),
    ('default_language', '"ht"', 'Default AI response language');

-- Insert default behavior templates
INSERT INTO public.ai_behavior_templates (name, user_role, trigger_keywords, template_response, language) VALUES
    ('Welcome Student', 'student', ARRAY['hello', 'hi', 'bonjou', 'alo'], 
     'Bonjou! Mwen se asistan AI ou an pou Tek Pou Nou. Mwen ka ede w ak kou yo, pwogre w yo, ak rekòmandasyon yo. Ki sa ou vle konnen?', 'ht'),
    
    ('Welcome Teacher', 'teacher', ARRAY['hello', 'hi', 'bonjou', 'alo'], 
     'Bonjou Pwofesè! Mwen ka ede w ak analitik yo, estrateji angajman ak jesyon kou yo. Ki sa ou bezwen konnen?', 'ht'),
    
    ('Welcome SME', 'sme', ARRAY['hello', 'hi', 'bonjou', 'alo'], 
     'Bonjou! Mwen ka ede w ak sèvis yo, nouvo pwojè yo ak resous yo. Ki jan mwen ka asiste w jodi a?', 'ht'),
    
    ('Course Help', 'student', ARRAY['course', 'lesson', 'kou', 'leson'], 
     'Mwen ka ede w ak kou yo w yo! Ou ka gade pwogre w yo, jwenn leson yo, oswa mande kesyon yo sou materyèl la.', 'ht'),
    
    ('Analytics Help', 'teacher', ARRAY['analytics', 'stats', 'performance', 'analitik'], 
     'Mwen ka montre w estatistik yo ak pèfòmans elèv yo. Ou vle wè ki analytics ki gen ak kou w yo?', 'ht');

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER update_ai_behavior_templates_updated_at
    BEFORE UPDATE ON public.ai_behavior_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER update_ai_user_preferences_updated_at
    BEFORE UPDATE ON public.ai_user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_updated_at();

-- Create function to get user context for AI
CREATE OR REPLACE FUNCTION get_user_context_for_ai(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    context JSONB := '{}';
    user_profile RECORD;
    recent_courses JSONB;
    recent_events JSONB;
    recent_groups JSONB;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile FROM user_profiles WHERE user_id = user_uuid;
    
    IF user_profile IS NOT NULL THEN
        context := context || jsonb_build_object(
            'user_role', user_profile.role,
            'full_name', user_profile.full_name,
            'preferred_language', COALESCE(user_profile.preferred_language, 'ht')
        );
    END IF;
    
    -- Get recent course enrollments for students
    IF user_profile.role = 'student' THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'course_id', ce.course_id,
                'enrolled_at', ce.enrolled_at,
                'progress', ce.progress
            )
        ) INTO recent_courses
        FROM course_enrollments ce
        WHERE ce.user_id = user_uuid
        AND ce.enrolled_at > NOW() - INTERVAL '30 days'
        LIMIT 5;
        
        context := context || jsonb_build_object('recent_courses', COALESCE(recent_courses, '[]'::jsonb));
    END IF;
    
    -- Get recent events for all users
    SELECT jsonb_agg(
        jsonb_build_object(
            'event_id', e.id,
            'title', e.title,
            'event_date', e.event_date,
            'is_attending', ea.id IS NOT NULL
        )
    ) INTO recent_events
    FROM events e
    LEFT JOIN event_attendees ea ON e.id = ea.event_id AND ea.user_id = user_uuid
    WHERE e.event_date > NOW() - INTERVAL '7 days'
    OR e.event_date > NOW()
    LIMIT 3;
    
    context := context || jsonb_build_object('recent_events', COALESCE(recent_events, '[]'::jsonb));
    
    -- Get user groups
    SELECT jsonb_agg(
        jsonb_build_object(
            'group_id', g.id,
            'name', g.name,
            'member_since', gm.joined_at
        )
    ) INTO recent_groups
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = user_uuid
    LIMIT 3;
    
    context := context || jsonb_build_object('user_groups', COALESCE(recent_groups, '[]'::jsonb));
    
    RETURN context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_behavior_templates TO authenticated;
GRANT ALL ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_context_for_ai(UUID) TO authenticated;
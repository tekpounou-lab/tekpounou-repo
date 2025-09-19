-- Certificates & Gamification Database Schema
-- Created: 2025-09-18
-- Purpose: Certificate generation, badge system, and gamification features

-- Certificates Table
CREATE TABLE certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    certificate_number TEXT UNIQUE NOT NULL, -- Auto-generated unique certificate number
    title TEXT NOT NULL, -- "Certificate of Completion in [Course Title]"
    description TEXT,
    issue_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE, -- NULL means no expiry
    certificate_url TEXT, -- URL to generated PDF certificate
    template_used TEXT DEFAULT 'default', -- Certificate template identifier
    verification_code TEXT UNIQUE NOT NULL, -- For public verification
    is_public BOOLEAN DEFAULT false, -- Student can choose to make it public
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id) -- One certificate per student per course
);

-- Badges Table - Achievement badges
CREATE TABLE badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_url TEXT, -- Badge icon/image URL
    badge_type TEXT CHECK (badge_type IN ('milestone', 'skill', 'engagement', 'special')) DEFAULT 'milestone',
    condition_type TEXT CHECK (condition_type IN (
        'course_complete', 'lesson_count', 'quiz_score', 'discussion_posts', 
        'first_course', 'perfect_quiz', 'early_bird', 'consistent_learner',
        'mentor', 'innovator', 'community_champion'
    )) NOT NULL,
    condition_value INTEGER DEFAULT 1, -- Threshold value (e.g., 5 for "5 courses completed")
    points INTEGER DEFAULT 10, -- Gamification points earned
    rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Badges Table - Junction table for users and their earned badges
CREATE TABLE user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    progress INTEGER DEFAULT 0, -- Current progress towards badge (if applicable)
    completed BOOLEAN DEFAULT true, -- Whether badge is fully earned
    UNIQUE(user_id, badge_id)
);

-- User Gamification Profile - Extended user stats
CREATE TABLE user_gamification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0, -- Current learning streak
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    achievements_unlocked INTEGER DEFAULT 0,
    preferred_badge_display UUID REFERENCES badges(id), -- Featured badge on profile
    is_profile_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Streaks Table - Track daily learning activity
CREATE TABLE learning_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activities_completed INTEGER DEFAULT 0, -- Lessons, quizzes, discussions
    time_spent_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, activity_date)
);

-- Certificate Templates Table - Different certificate designs
CREATE TABLE certificate_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    template_data JSONB NOT NULL, -- Template configuration (colors, layout, etc.)
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_certificates_student_id ON certificates(student_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_verification_code ON certificates(verification_code);
CREATE INDEX idx_certificates_is_public ON certificates(is_public);

CREATE INDEX idx_badges_condition_type ON badges(condition_type);
CREATE INDEX idx_badges_badge_type ON badges(badge_type);
CREATE INDEX idx_badges_is_active ON badges(is_active);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);

CREATE INDEX idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX idx_user_gamification_total_points ON user_gamification(total_points DESC);
CREATE INDEX idx_user_gamification_level ON user_gamification(level DESC);

CREATE INDEX idx_learning_streaks_user_date ON learning_streaks(user_id, activity_date);
CREATE INDEX idx_learning_streaks_activity_date ON learning_streaks(activity_date DESC);

-- Row Level Security Policies

-- Certificates RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own certificates" ON certificates
    FOR SELECT USING (
        auth.uid() = student_id OR 
        is_public = true OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "System can create certificates" ON certificates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Students can update their certificate privacy" ON certificates
    FOR UPDATE USING (auth.uid() = student_id);

-- Badges RLS (public read, admin manage)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active badges" ON badges
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage badges" ON badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- User Badges RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges" ON user_badges
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM user_gamification ug 
            WHERE ug.user_id = user_badges.user_id AND ug.is_profile_public = true
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "System can award badges" ON user_badges
    FOR INSERT WITH CHECK (true);

-- User Gamification RLS
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gamification data" ON user_gamification
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public gamification profiles" ON user_gamification
    FOR SELECT USING (is_profile_public = true);

CREATE POLICY "Users can update their own gamification settings" ON user_gamification
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage user gamification" ON user_gamification
    FOR ALL USING (true);

-- Learning Streaks RLS
ALTER TABLE learning_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learning streaks" ON learning_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage learning streaks" ON learning_streaks
    FOR ALL USING (true);

-- Certificate Templates RLS
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates" ON certificate_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON certificate_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Functions for certificate and badge logic

-- Function to generate unique certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
    cert_number TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        cert_number := 'TPN-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                      LPAD((EXTRACT(DOY FROM CURRENT_DATE))::TEXT, 3, '0') || '-' ||
                      LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');
        
        -- Check if this number already exists
        IF NOT EXISTS (SELECT 1 FROM certificates WHERE certificate_number = cert_number) THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique certificate number';
        END IF;
    END LOOP;
    
    RETURN cert_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
    verification_code TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        verification_code := UPPER(
            SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 12)
        );
        
        -- Check if this code already exists
        IF NOT EXISTS (SELECT 1 FROM certificates WHERE verification_code = verification_code) THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique verification code';
        END IF;
    END LOOP;
    
    RETURN verification_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-issue certificate when course is completed
CREATE OR REPLACE FUNCTION check_and_issue_certificate()
RETURNS TRIGGER AS $$
DECLARE
    course_title TEXT;
    certificate_title TEXT;
BEGIN
    -- Only trigger when course is 100% completed
    IF NEW.progress_percentage = 100 AND (OLD.progress_percentage IS NULL OR OLD.progress_percentage < 100) THEN
        
        -- Get course title
        SELECT title INTO course_title FROM courses WHERE id = NEW.course_id;
        
        -- Create certificate title
        certificate_title := 'Certificate of Completion in ' || course_title;
        
        -- Insert certificate if it doesn't already exist
        INSERT INTO certificates (
            student_id, 
            course_id, 
            certificate_number,
            title,
            description,
            verification_code
        )
        SELECT 
            NEW.student_id,
            NEW.course_id,
            generate_certificate_number(),
            certificate_title,
            'This certifies that the student has successfully completed all requirements for the course: ' || course_title,
            generate_verification_code()
        WHERE NOT EXISTS (
            SELECT 1 FROM certificates 
            WHERE student_id = NEW.student_id AND course_id = NEW.course_id
        );
        
        -- Create notification for certificate
        INSERT INTO notifications (user_id, type, title, content, data)
        VALUES (
            NEW.student_id,
            'certificate_issued',
            'Certificate Earned! 🎓',
            'Congratulations! You have earned a certificate for completing: ' || course_title,
            jsonb_build_object(
                'course_id', NEW.course_id,
                'course_title', course_title,
                'certificate_id', (SELECT id FROM certificates WHERE student_id = NEW.student_id AND course_id = NEW.course_id)
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    badge_record RECORD;
    current_count INTEGER;
    gamification_record RECORD;
BEGIN
    -- Get user's current gamification data
    SELECT * INTO gamification_record 
    FROM user_gamification 
    WHERE user_id = user_uuid;
    
    -- If no gamification record exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_gamification (user_id) VALUES (user_uuid);
        SELECT * INTO gamification_record FROM user_gamification WHERE user_id = user_uuid;
    END IF;
    
    -- Loop through all active badges to check conditions
    FOR badge_record IN 
        SELECT * FROM badges 
        WHERE is_active = true 
        AND id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = user_uuid AND completed = true)
    LOOP
        current_count := 0;
        
        -- Check different badge conditions
        CASE badge_record.condition_type
            WHEN 'course_complete' THEN
                SELECT COUNT(*) INTO current_count
                FROM enrollments 
                WHERE student_id = user_uuid AND progress_percentage = 100;
                
            WHEN 'lesson_count' THEN
                SELECT COUNT(*) INTO current_count
                FROM course_progress 
                WHERE student_id = user_uuid AND progress_type = 'lesson_complete';
                
            WHEN 'quiz_score' THEN
                SELECT COUNT(*) INTO current_count
                FROM quiz_results 
                WHERE student_id = user_uuid AND score >= badge_record.condition_value;
                
            WHEN 'discussion_posts' THEN
                SELECT COUNT(*) INTO current_count
                FROM course_discussions 
                WHERE user_id = user_uuid;
                
            WHEN 'first_course' THEN
                SELECT COUNT(*) INTO current_count
                FROM enrollments 
                WHERE student_id = user_uuid 
                LIMIT 1;
                
            WHEN 'perfect_quiz' THEN
                SELECT COUNT(*) INTO current_count
                FROM quiz_results 
                WHERE student_id = user_uuid AND score = 100;
                
        END CASE;
        
        -- Award badge if condition is met
        IF current_count >= badge_record.condition_value THEN
            INSERT INTO user_badges (user_id, badge_id, earned_at, completed)
            VALUES (user_uuid, badge_record.id, NOW(), true)
            ON CONFLICT (user_id, badge_id) DO NOTHING;
            
            -- Update user's total points and achievements
            UPDATE user_gamification 
            SET 
                total_points = total_points + badge_record.points,
                achievements_unlocked = achievements_unlocked + 1,
                experience_points = experience_points + (badge_record.points * 10),
                updated_at = NOW()
            WHERE user_id = user_uuid;
            
            -- Create notification for badge
            INSERT INTO notifications (user_id, type, title, content, data)
            VALUES (
                user_uuid,
                'badge_earned',
                'New Badge Earned! 🏆',
                'You have earned the "' || badge_record.title || '" badge!',
                jsonb_build_object(
                    'badge_id', badge_record.id,
                    'badge_title', badge_record.title,
                    'points_earned', badge_record.points
                )
            );
        END IF;
    END LOOP;
    
    -- Update user level based on experience points
    UPDATE user_gamification 
    SET level = GREATEST(1, (experience_points / 1000) + 1)
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update learning streak
CREATE OR REPLACE FUNCTION update_learning_streak(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    yesterday_date DATE := CURRENT_DATE - 1;
    has_today_activity BOOLEAN;
    has_yesterday_activity BOOLEAN;
    current_streak INTEGER := 0;
BEGIN
    -- Check if user has activity today
    SELECT EXISTS(
        SELECT 1 FROM learning_streaks 
        WHERE user_id = user_uuid AND activity_date = today_date
    ) INTO has_today_activity;
    
    -- If no activity today, create record
    IF NOT has_today_activity THEN
        INSERT INTO learning_streaks (user_id, activity_date, activities_completed, time_spent_minutes)
        VALUES (user_uuid, today_date, 1, 0)
        ON CONFLICT (user_id, activity_date) 
        DO UPDATE SET activities_completed = learning_streaks.activities_completed + 1;
    ELSE
        -- Update today's activity count
        UPDATE learning_streaks 
        SET activities_completed = activities_completed + 1
        WHERE user_id = user_uuid AND activity_date = today_date;
    END IF;
    
    -- Calculate current streak
    WITH consecutive_days AS (
        SELECT activity_date,
               activity_date - ROW_NUMBER() OVER (ORDER BY activity_date) AS grp
        FROM learning_streaks
        WHERE user_id = user_uuid
        AND activity_date <= today_date
        ORDER BY activity_date DESC
    ),
    streak_groups AS (
        SELECT grp, COUNT(*) as consecutive_count
        FROM consecutive_days
        GROUP BY grp
        ORDER BY MAX(activity_date) DESC
        LIMIT 1
    )
    SELECT COALESCE(consecutive_count, 0) INTO current_streak FROM streak_groups;
    
    -- Update user gamification with new streak
    UPDATE user_gamification 
    SET 
        streak_days = current_streak,
        longest_streak = GREATEST(longest_streak, current_streak),
        last_activity_date = today_date,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Check for streak-based badges
    PERFORM check_and_award_badges(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_issue_certificate
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION check_and_issue_certificate();

-- Insert default badges
INSERT INTO badges (title, description, condition_type, condition_value, points, badge_type, rarity) VALUES
('First Steps', 'Complete your first lesson', 'lesson_count', 1, 10, 'milestone', 'common'),
('Knowledge Seeker', 'Complete 5 lessons', 'lesson_count', 5, 25, 'milestone', 'uncommon'),
('Dedicated Learner', 'Complete 25 lessons', 'lesson_count', 25, 50, 'milestone', 'rare'),
('Course Finisher', 'Complete your first course', 'first_course', 1, 100, 'milestone', 'uncommon'),
('Graduate', 'Complete 3 courses', 'course_complete', 3, 200, 'milestone', 'rare'),
('Master Student', 'Complete 10 courses', 'course_complete', 10, 500, 'milestone', 'epic'),
('Quiz Master', 'Score 100% on a quiz', 'perfect_quiz', 1, 50, 'skill', 'uncommon'),
('Perfect Scholar', 'Score 100% on 5 quizzes', 'perfect_quiz', 5, 150, 'skill', 'rare'),
('Discussion Starter', 'Make your first discussion post', 'discussion_posts', 1, 15, 'engagement', 'common'),
('Community Voice', 'Make 10 discussion posts', 'discussion_posts', 10, 75, 'engagement', 'uncommon'),
('Community Leader', 'Make 50 discussion posts', 'discussion_posts', 50, 200, 'engagement', 'epic');

-- Insert default certificate template
INSERT INTO certificate_templates (name, description, is_default, template_data) VALUES
('Tek Pou Nou Default', 'Official Tek Pou Nou certificate template with brand colors and logo', true, 
'{"background_color": "#FFFFFF", "accent_color": "#FF6B6B", "text_color": "#001F3F", "font_family": "Roboto", "includes_logo": true, "border_style": "gradient"}');

-- Update timestamps triggers
CREATE TRIGGER trigger_certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_badges_updated_at
    BEFORE UPDATE ON badges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_gamification_updated_at
    BEFORE UPDATE ON user_gamification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
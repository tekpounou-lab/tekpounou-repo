-- Enhanced Analytics & Progress Tracking Database Schema
-- Created: 2025-09-18
-- Purpose: Comprehensive progress tracking, quiz system, and enhanced analytics

-- Quizzes Table - Course assessments
CREATE TABLE quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE, -- Optional: quiz can be tied to specific lesson
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    time_limit_minutes INTEGER, -- NULL means no time limit
    passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
    max_attempts INTEGER DEFAULT 3, -- NULL means unlimited attempts
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Questions Table
CREATE TABLE quiz_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')) NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB, -- For multiple choice: ["Option A", "Option B", "Option C", "Option D"]
    correct_answer TEXT, -- For objective questions
    points INTEGER DEFAULT 1 CHECK (points > 0),
    explanation TEXT, -- Optional explanation for the correct answer
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Results Table - Individual quiz attempts
CREATE TABLE quiz_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    total_points INTEGER NOT NULL,
    earned_points INTEGER NOT NULL,
    passed BOOLEAN GENERATED ALWAYS AS (score >= (SELECT passing_score FROM quizzes WHERE id = quiz_id)) STORED,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent_minutes INTEGER,
    answers JSONB, -- Student's answers: {"question_id": "answer", ...}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Course Progress Table (replaces basic lesson_progress)
CREATE TABLE course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE, -- For quiz progress
    progress_type TEXT CHECK (progress_type IN ('lesson_view', 'lesson_complete', 'quiz_attempt', 'quiz_pass')) NOT NULL,
    percentage_complete INTEGER DEFAULT 0 CHECK (percentage_complete >= 0 AND percentage_complete <= 100),
    time_spent_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, lesson_id), -- One progress record per student per lesson
    UNIQUE(student_id, quiz_id, created_at) -- Multiple quiz attempts allowed
);

-- Analytics Events Extended Table (enhance existing)
-- Add new event types to existing analytics_events table
ALTER TABLE analytics_events 
DROP CONSTRAINT IF EXISTS analytics_events_event_type_check,
ADD CONSTRAINT analytics_events_event_type_check CHECK (event_type IN (
    'login', 'logout', 'course_view', 'lesson_start', 'lesson_complete', 
    'quiz_attempt', 'quiz_complete', 'quiz_pass', 'quiz_fail',
    'blog_view', 'blog_like', 'service_request', 'project_view', 
    'task_update', 'enrollment', 'search', 'discussion_post', 
    'message_sent', 'certificate_earned', 'badge_earned',
    'profile_update', 'course_review', 'lesson_replay'
));

-- Student Dashboard Analytics View
CREATE OR REPLACE VIEW student_dashboard_analytics AS
SELECT 
    e.student_id,
    COUNT(DISTINCT e.course_id) as enrolled_courses,
    COUNT(DISTINCT CASE WHEN e.progress_percentage = 100 THEN e.course_id END) as completed_courses,
    COALESCE(AVG(e.progress_percentage), 0) as avg_progress,
    COUNT(DISTINCT qr.quiz_id) as quizzes_taken,
    COUNT(DISTINCT CASE WHEN qr.passed THEN qr.quiz_id END) as quizzes_passed,
    COALESCE(AVG(qr.score), 0) as avg_quiz_score,
    SUM(cp.time_spent_seconds) as total_time_spent_seconds,
    COUNT(DISTINCT cert.id) as certificates_earned,
    COUNT(DISTINCT ub.badge_id) as badges_earned
FROM enrollments e
LEFT JOIN quiz_results qr ON qr.student_id = e.student_id
LEFT JOIN course_progress cp ON cp.student_id = e.student_id AND cp.course_id = e.course_id
LEFT JOIN certificates cert ON cert.student_id = e.student_id
LEFT JOIN user_badges ub ON ub.user_id = e.student_id
GROUP BY e.student_id;

-- Teacher Dashboard Analytics View
CREATE OR REPLACE VIEW teacher_dashboard_analytics AS
SELECT 
    c.teacher_id,
    COUNT(DISTINCT c.id) as total_courses,
    COUNT(DISTINCT CASE WHEN c.status = 'published' THEN c.id END) as published_courses,
    COUNT(DISTINCT e.student_id) as total_students,
    COUNT(DISTINCT CASE WHEN e.progress_percentage = 100 THEN e.student_id END) as students_completed,
    COALESCE(AVG(e.progress_percentage), 0) as avg_student_progress,
    COUNT(DISTINCT qr.id) as total_quiz_attempts,
    COALESCE(AVG(qr.score), 0) as avg_quiz_score,
    COUNT(DISTINCT cert.id) as certificates_issued,
    COUNT(DISTINCT cd.id) as discussion_posts
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
LEFT JOIN quizzes q ON q.course_id = c.id
LEFT JOIN quiz_results qr ON qr.quiz_id = q.id
LEFT JOIN certificates cert ON cert.course_id = c.id
LEFT JOIN course_discussions cd ON cd.course_id = c.id
GROUP BY c.teacher_id;

-- Create indexes for performance
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_order ON quiz_questions(quiz_id, order_index);
CREATE INDEX idx_quiz_results_quiz_id ON quiz_results(quiz_id);
CREATE INDEX idx_quiz_results_student_id ON quiz_results(student_id);
CREATE INDEX idx_quiz_results_completed_at ON quiz_results(completed_at);
CREATE INDEX idx_course_progress_student_course ON course_progress(student_id, course_id);
CREATE INDEX idx_course_progress_lesson_id ON course_progress(lesson_id);
CREATE INDEX idx_course_progress_quiz_id ON course_progress(quiz_id);

-- Row Level Security Policies

-- Quizzes RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view quizzes in enrolled courses" ON quizzes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments e 
            WHERE e.course_id = quizzes.course_id AND e.student_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = quizzes.course_id AND c.teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Teachers can manage quizzes in their courses" ON quizzes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = quizzes.course_id AND c.teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Quiz Questions RLS
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view quiz questions" ON quiz_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quizzes q
            JOIN enrollments e ON e.course_id = q.course_id
            WHERE q.id = quiz_questions.quiz_id AND e.student_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM quizzes q
            JOIN courses c ON c.id = q.course_id
            WHERE q.id = quiz_questions.quiz_id AND c.teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Teachers can manage quiz questions" ON quiz_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM quizzes q
            JOIN courses c ON c.id = q.course_id
            WHERE q.id = quiz_questions.quiz_id AND c.teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Quiz Results RLS
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own quiz results" ON quiz_results
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own quiz results" ON quiz_results
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can view quiz results in their courses" ON quiz_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quizzes q
            JOIN courses c ON c.id = q.course_id
            WHERE q.id = quiz_results.quiz_id AND c.teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Course Progress RLS
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own progress" ON course_progress
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view progress in their courses" ON course_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = course_progress.course_id AND c.teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Functions for progress tracking

-- Function to update enrollment progress when lesson/quiz is completed
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_items INTEGER;
    completed_items INTEGER;
    new_percentage INTEGER;
BEGIN
    -- Count total lessons and required quizzes in the course
    SELECT 
        (SELECT COUNT(*) FROM lessons l JOIN course_modules cm ON l.module_id = cm.id WHERE cm.course_id = NEW.course_id) +
        (SELECT COUNT(*) FROM quizzes q WHERE q.course_id = NEW.course_id AND q.is_required = true)
    INTO total_items;
    
    -- Count completed lessons and passed required quizzes
    SELECT 
        (SELECT COUNT(*) FROM course_progress cp 
         JOIN lessons l ON l.id = cp.lesson_id 
         JOIN course_modules cm ON l.module_id = cm.id 
         WHERE cp.student_id = NEW.student_id AND cm.course_id = NEW.course_id AND cp.progress_type = 'lesson_complete') +
        (SELECT COUNT(*) FROM course_progress cp 
         JOIN quizzes q ON q.id = cp.quiz_id 
         WHERE cp.student_id = NEW.student_id AND q.course_id = NEW.course_id AND q.is_required = true AND cp.progress_type = 'quiz_pass')
    INTO completed_items;
    
    -- Calculate new percentage
    IF total_items > 0 THEN
        new_percentage := ROUND((completed_items::DECIMAL / total_items::DECIMAL) * 100);
    ELSE
        new_percentage := 0;
    END IF;
    
    -- Update enrollment progress
    UPDATE enrollments 
    SET 
        progress_percentage = new_percentage,
        last_accessed_at = NOW(),
        completed_at = CASE WHEN new_percentage = 100 THEN NOW() ELSE completed_at END
    WHERE student_id = NEW.student_id AND course_id = NEW.course_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate quiz score
CREATE OR REPLACE FUNCTION calculate_quiz_score(quiz_result_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER;
    earned_points INTEGER;
    final_score INTEGER;
BEGIN
    SELECT 
        qr.total_points,
        qr.earned_points
    INTO total_points, earned_points
    FROM quiz_results qr
    WHERE qr.id = quiz_result_id;
    
    IF total_points > 0 THEN
        final_score := ROUND((earned_points::DECIMAL / total_points::DECIMAL) * 100);
    ELSE
        final_score := 0;
    END IF;
    
    UPDATE quiz_results 
    SET score = final_score 
    WHERE id = quiz_result_id;
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_update_enrollment_progress
    AFTER INSERT OR UPDATE ON course_progress
    FOR EACH ROW
    WHEN (NEW.progress_type IN ('lesson_complete', 'quiz_pass'))
    EXECUTE FUNCTION update_enrollment_progress();

-- Update timestamps trigger for new tables
CREATE TRIGGER trigger_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_course_progress_updated_at
    BEFORE UPDATE ON course_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
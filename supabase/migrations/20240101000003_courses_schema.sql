-- Courses & Learning Platform Schema

-- Teacher Applications Table
CREATE TABLE IF NOT EXISTS teacher_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  motivation TEXT,
  qualifications TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  language TEXT DEFAULT 'ht',
  thumbnail_url TEXT,
  duration_hours INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Modules Table
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('video', 'audio', 'document', 'image')),
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Lesson Progress Table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,
  UNIQUE(student_id, lesson_id)
);

-- Course Reviews Table (Optional)
CREATE TABLE IF NOT EXISTS course_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Row Level Security Policies

-- Teacher Applications RLS
ALTER TABLE teacher_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications" ON teacher_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" ON teacher_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON teacher_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update applications" ON teacher_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Courses RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Teachers can manage their own courses" ON courses
  FOR ALL USING (
    auth.uid() = teacher_id AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'super_admin'))
  );

CREATE POLICY "Teachers can create courses" ON courses
  FOR INSERT WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Course Modules RLS
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view modules of published courses" ON course_modules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND status = 'published')
  );

CREATE POLICY "Teachers can manage modules of their courses" ON course_modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = course_id AND c.teacher_id = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'super_admin'))
    )
  );

CREATE POLICY "Admins can manage all modules" ON course_modules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Lessons RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lessons of published courses" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_modules cm 
      JOIN courses c ON cm.course_id = c.id 
      WHERE cm.id = module_id AND c.status = 'published'
    )
  );

CREATE POLICY "Teachers can manage lessons of their courses" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM course_modules cm 
      JOIN courses c ON cm.course_id = c.id 
      WHERE cm.id = module_id AND c.teacher_id = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'super_admin'))
    )
  );

CREATE POLICY "Admins can manage all lessons" ON lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Enrollments RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own enrollments" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own enrollment progress" ON enrollments
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view enrollments in their courses" ON enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = course_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all enrollments" ON enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Lesson Progress RLS
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own lesson progress" ON lesson_progress
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view progress in their courses" ON lesson_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN course_modules cm ON l.module_id = cm.id
      JOIN courses c ON cm.course_id = c.id
      WHERE l.id = lesson_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all lesson progress" ON lesson_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Course Reviews RLS
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course reviews" ON course_reviews
  FOR SELECT USING (true);

CREATE POLICY "Students can create reviews for enrolled courses" ON course_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (SELECT 1 FROM enrollments WHERE student_id = auth.uid() AND course_id = course_reviews.course_id)
  );

CREATE POLICY "Students can update their own reviews" ON course_reviews
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Students can delete their own reviews" ON course_reviews
  FOR DELETE USING (auth.uid() = student_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_order ON course_modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_id ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_applications_user_id ON teacher_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_applications_status ON teacher_applications(status);

-- Functions
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update enrollment progress when lesson progress is updated
  UPDATE enrollments 
  SET progress_percentage = (
    SELECT COALESCE(
      ROUND(
        (COUNT(CASE WHEN lp.completed_at IS NOT NULL THEN 1 END) * 100.0) / 
        COUNT(l.id)
      ), 0
    )
    FROM lessons l
    JOIN course_modules cm ON l.module_id = cm.id
    LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.student_id = NEW.student_id
    WHERE cm.course_id = (
      SELECT cm2.course_id 
      FROM lessons l2 
      JOIN course_modules cm2 ON l2.module_id = cm2.id 
      WHERE l2.id = NEW.lesson_id
    )
  ),
  last_accessed_at = NOW()
  WHERE student_id = NEW.student_id 
  AND course_id = (
    SELECT cm.course_id 
    FROM lessons l 
    JOIN course_modules cm ON l.module_id = cm.id 
    WHERE l.id = NEW.lesson_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_progress
  AFTER INSERT OR UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_course_progress();

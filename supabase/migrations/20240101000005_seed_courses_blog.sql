-- Seed Data for Courses & Blog Platform

-- Insert sample categories
INSERT INTO blog_categories (name, slug, description, color) VALUES
('Technology', 'technology', 'Articles about latest technology trends', '#3B82F6'),
('Education', 'education', 'Educational content and learning resources', '#10B981'),
('Career', 'career', 'Career development and professional growth', '#F59E0B'),
('Culture', 'culture', 'Haitian culture and traditions', '#EF4444')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample tags
INSERT INTO blog_tags (name, slug, color) VALUES
('Programming', 'programming', '#8B5CF6'),
('Web Development', 'web-development', '#06B6D4'),
('Career Tips', 'career-tips', '#F59E0B'),
('Haiti', 'haiti', '#EF4444'),
('Beginner', 'beginner', '#10B981'),
('Advanced', 'advanced', '#F97316')
ON CONFLICT (slug) DO NOTHING;

-- Insert a sample teacher application
INSERT INTO teacher_applications (
  user_id, 
  status, 
  motivation, 
  qualifications
)
SELECT 
  u.id,
  'pending',
  'I want to share my knowledge of web development with Haitian students and help build the next generation of developers.',
  'Bachelor in Computer Science, 5 years of professional experience in fullstack development'
FROM users u 
WHERE u.email = 'admin@tekpounou.com'
ON CONFLICT DO NOTHING;

-- Create a sample course (assuming we have a teacher)
DO $$
DECLARE
  admin_user_id UUID;
  course_id UUID;
  module1_id UUID;
  module2_id UUID;
  lesson1_id UUID;
  lesson2_id UUID;
  lesson3_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id FROM users WHERE email = 'admin@tekpounou.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Insert sample course
    INSERT INTO courses (
      title,
      description,
      short_description,
      teacher_id,
      status,
      difficulty_level,
      language,
      duration_hours,
      is_free
    ) VALUES (
      'Introduction to Web Development',
      'Learn the fundamentals of web development including HTML, CSS, and JavaScript. This course is designed for beginners who want to start their journey in web development.',
      'Learn HTML, CSS, and JavaScript basics',
      admin_user_id,
      'published',
      'beginner',
      'ht',
      20,
      true
    )
    RETURNING id INTO course_id;
    
    -- Insert course modules
    INSERT INTO course_modules (course_id, title, description, order_index)
    VALUES 
      (course_id, 'HTML Fundamentals', 'Learn the basics of HTML markup language', 1),
      (course_id, 'CSS Styling', 'Master CSS for beautiful web designs', 2)
    RETURNING id INTO module1_id;
    
    -- Get second module ID
    SELECT id INTO module2_id FROM course_modules WHERE course_id = course_id AND order_index = 2;
    
    -- Insert lessons
    INSERT INTO lessons (module_id, title, content, order_index, duration_minutes, is_free)
    VALUES 
      (
        module1_id,
        'What is HTML?',
        '# Introduction to HTML\n\nHTML (HyperText Markup Language) is the standard markup language for creating web pages. In this lesson, you will learn:\n\n- What HTML stands for\n- Basic HTML structure\n- Common HTML tags\n\n## HTML Structure\n\nEvery HTML document has a basic structure:\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n    <title>Page Title</title>\n</head>\n<body>\n    <h1>My First Heading</h1>\n    <p>My first paragraph.</p>\n</body>\n</html>\n```',
        1,
        15,
        true
      ),
      (
        module1_id,
        'HTML Tags and Elements',
        '# HTML Tags and Elements\n\nHTML elements are the building blocks of web pages. Learn about:\n\n- Headings (h1-h6)\n- Paragraphs (p)\n- Links (a)\n- Images (img)\n- Lists (ul, ol, li)\n\n## Examples\n\n### Headings\n```html\n<h1>Main Title</h1>\n<h2>Subtitle</h2>\n<h3>Section Title</h3>\n```\n\n### Links\n```html\n<a href="https://example.com">Visit Example</a>\n```',
        2,
        20,
        false
      ),
      (
        module2_id,
        'CSS Basics',
        '# Introduction to CSS\n\nCSS (Cascading Style Sheets) is used to style HTML elements. Topics covered:\n\n- CSS Syntax\n- Selectors\n- Properties\n- Colors and fonts\n\n## CSS Syntax\n\n```css\nselector {\n    property: value;\n}\n```\n\n## Example\n\n```css\nh1 {\n    color: blue;\n    font-size: 24px;\n}\n```',
        1,
        25,
        false
      );
      
    -- Create sample enrollment for super admin
    INSERT INTO enrollments (student_id, course_id, progress_percentage)
    SELECT id, course_id, 33
    FROM users 
    WHERE email = 'superadmin@tekpounou.com'
    ON CONFLICT (student_id, course_id) DO NOTHING;
    
  END IF;
END $$;

-- Insert sample blog posts
DO $$
DECLARE
  admin_user_id UUID;
  tech_category_id UUID;
  edu_category_id UUID;
  programming_tag_id UUID;
  beginner_tag_id UUID;
  blog_post_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO admin_user_id FROM users WHERE email = 'admin@tekpounou.com';
  SELECT id INTO tech_category_id FROM blog_categories WHERE slug = 'technology';
  SELECT id INTO edu_category_id FROM blog_categories WHERE slug = 'education';
  SELECT id INTO programming_tag_id FROM blog_tags WHERE slug = 'programming';
  SELECT id INTO beginner_tag_id FROM blog_tags WHERE slug = 'beginner';
  
  IF admin_user_id IS NOT NULL THEN
    -- Insert blog post in Haitian Creole
    INSERT INTO blog_posts (
      title,
      slug,
      excerpt,
      content,
      author_id,
      category_id,
      status,
      language,
      is_featured,
      published_at
    ) VALUES (
      'Kòmanse ak Pwogramasyon Web',
      'komanse-ak-pwogramasyon-web',
      'Aprann kijan pou w kòmanse yon karyè nan pwogramasyon web ak konsèy pratik yo.',
      '# Kòmanse ak Pwogramasyon Web\n\nPwogramasyon web se yon domèn ki gen anpil opòtinite. Si w ap chèche kòmanse, men kèk konsèy:\n\n## Sa ou bezwen aprann\n\n1. **HTML** - Lang baz la pou kreye paj web\n2. **CSS** - Pou fè depo yo bèl\n3. **JavaScript** - Pou fonksyonalite entèaktif yo\n\n## Kijan pou w kòmanse\n\n- Kòmanse ak pwojè ti ti yo\n- Pratike chak jou\n- Antre nan kominote pwogramè yo\n- Pa pè fè erè\n\n## Resous yo\n\nGen anpil resous gratis sou entènèt la ki ka ede w aprann. Men kèk yo:\n\n- Kous an liy yo\n- YouTube videyo\n- Liv ak dokiman\n- Pwojè pratik\n\nSonje, pwogramasyon se yon kapasite ki bezwen tanp ak pasians. Pa dekouraje w si ou pa konprann bagay yo yo rapidman.',
      admin_user_id,
      tech_category_id,
      'published',
      'ht',
      true,
      NOW() - INTERVAL '2 days'
    )
    RETURNING id INTO blog_post_id;
    
    -- Add tags to the blog post
    INSERT INTO blog_post_tags (blog_post_id, tag_id)
    VALUES 
      (blog_post_id, programming_tag_id),
      (blog_post_id, beginner_tag_id);
    
    -- Insert blog post in English
    INSERT INTO blog_posts (
      title,
      slug,
      excerpt,
      content,
      author_id,
      category_id,
      status,
      language,
      published_at
    ) VALUES (
      'The Future of Education in Haiti',
      'future-of-education-haiti',
      'Exploring how technology can transform educational opportunities in Haiti.',
      '# The Future of Education in Haiti\n\nEducation is the foundation of any developing nation, and Haiti has tremendous potential for growth through technological advancement in learning.\n\n## Current Challenges\n\n- Limited access to quality educational resources\n- Geographic barriers\n- Economic constraints\n- Language barriers\n\n## Technology Solutions\n\n### Online Learning Platforms\n\nPlatforms like Tek Pou Nou can bridge the gap by providing:\n- Accessible courses in Haitian Creole\n- Flexible learning schedules\n- Affordable or free content\n- Mobile-friendly interfaces\n\n### Skills Development\n\nFocus areas should include:\n- Digital literacy\n- Programming and technology\n- Entrepreneurship\n- Language skills\n\n## Building Community\n\nSuccess requires:\n- Local content creators\n- Community engagement\n- Government support\n- Private sector partnerships\n\n## Conclusion\n\nBy leveraging technology and focusing on community needs, we can create lasting change in Haitian education. The future is bright when we invest in our people.',
      admin_user_id,
      edu_category_id,
      'published',
      'en',
      NOW() - INTERVAL '1 day'
    );
    
  END IF;
END $$;

-- Update views for sample posts
UPDATE blog_posts SET views_count = 45 WHERE slug = 'komanse-ak-pwogramasyon-web';
UPDATE blog_posts SET views_count = 32 WHERE slug = 'future-of-education-haiti';

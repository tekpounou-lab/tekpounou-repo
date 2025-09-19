-- Communication System Database Schema
-- Created: 2025-09-18
-- Purpose: Course discussions and private messaging between teachers and students

-- Course Discussions Table - Public course-specific discussions
CREATE TABLE course_discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES course_discussions(id) ON DELETE CASCADE, -- For threaded replies
    is_pinned BOOLEAN DEFAULT false,
    is_answered BOOLEAN DEFAULT false, -- For Q&A style discussions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Private Messages Table - 1-on-1 messaging between teacher and student
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- For message threads
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Participants Table - For group messaging (future enhancement)
CREATE TABLE message_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    UNIQUE(message_id, user_id)
);

-- Notifications Table - Real-time notifications for messages and discussions
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('message', 'discussion_reply', 'course_announcement', 'badge_earned', 'certificate_issued', 'quiz_graded')) NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    data JSONB DEFAULT '{}'::jsonb, -- Additional notification data
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_course_discussions_course_id ON course_discussions(course_id);
CREATE INDEX idx_course_discussions_user_id ON course_discussions(user_id);
CREATE INDEX idx_course_discussions_parent_id ON course_discussions(parent_id);
CREATE INDEX idx_course_discussions_created_at ON course_discussions(created_at DESC);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Row Level Security Policies

-- Course Discussions RLS
ALTER TABLE course_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled students can view course discussions" ON course_discussions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments e 
            WHERE e.course_id = course_discussions.course_id AND e.student_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = course_discussions.course_id AND c.teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Enrolled students can create course discussions" ON course_discussions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            EXISTS (
                SELECT 1 FROM enrollments e 
                WHERE e.course_id = course_discussions.course_id AND e.student_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM courses c 
                WHERE c.id = course_discussions.course_id AND c.teacher_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own discussions" ON course_discussions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Teachers can pin/answer discussions in their courses" ON course_discussions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = course_discussions.course_id AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own discussions" ON course_discussions
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = course_discussions.course_id AND c.teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = recipient_id OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON messages
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Functions for real-time features

-- Function to create notification when new message is sent
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, content, data)
    VALUES (
        NEW.recipient_id,
        'message',
        'New Message',
        'You have received a new message from ' || (SELECT full_name FROM users WHERE id = NEW.sender_id),
        jsonb_build_object(
            'message_id', NEW.id,
            'sender_id', NEW.sender_id,
            'sender_name', (SELECT full_name FROM users WHERE id = NEW.sender_id)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when discussion is replied to
CREATE OR REPLACE FUNCTION notify_discussion_reply()
RETURNS TRIGGER AS $$
DECLARE
    parent_user_id UUID;
    course_title TEXT;
BEGIN
    -- Only notify if this is a reply (has parent_id)
    IF NEW.parent_id IS NOT NULL THEN
        -- Get the user who created the original discussion
        SELECT user_id INTO parent_user_id 
        FROM course_discussions 
        WHERE id = NEW.parent_id;
        
        -- Get course title
        SELECT title INTO course_title 
        FROM courses 
        WHERE id = NEW.course_id;
        
        -- Don't notify if user is replying to themselves
        IF parent_user_id != NEW.user_id THEN
            INSERT INTO notifications (user_id, type, title, content, data)
            VALUES (
                parent_user_id,
                'discussion_reply',
                'New Reply in ' || course_title,
                (SELECT full_name FROM users WHERE id = NEW.user_id) || ' replied to your discussion',
                jsonb_build_object(
                    'discussion_id', NEW.id,
                    'course_id', NEW.course_id,
                    'replier_id', NEW.user_id,
                    'replier_name', (SELECT full_name FROM users WHERE id = NEW.user_id)
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark message as read
CREATE OR REPLACE FUNCTION mark_message_read(message_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE messages 
    SET is_read = true, read_at = NOW() 
    WHERE id = message_id AND recipient_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_notify_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();

CREATE TRIGGER trigger_notify_discussion_reply
    AFTER INSERT ON course_discussions
    FOR EACH ROW
    EXECUTE FUNCTION notify_discussion_reply();

-- Update timestamps trigger for course_discussions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_course_discussions_updated_at
    BEFORE UPDATE ON course_discussions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
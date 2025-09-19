-- Migration: Add Unified Notifications System
-- Created: 2024-10-03
-- Description: Comprehensive notifications system with in-app, email, and push-ready structure

-- =============================================
-- NOTIFICATIONS SYSTEM TABLES
-- =============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('system', 'course', 'event', 'payment', 'message', 'community', 'announcement')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link_url TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) -- For admin-sent notifications
);

-- User notification settings
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Email preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    email_course_updates BOOLEAN DEFAULT TRUE,
    email_community_updates BOOLEAN DEFAULT TRUE,
    email_payment_updates BOOLEAN DEFAULT TRUE,
    email_system_updates BOOLEAN DEFAULT TRUE,
    email_marketing BOOLEAN DEFAULT FALSE,
    
    -- In-app preferences  
    inapp_enabled BOOLEAN DEFAULT TRUE,
    inapp_course_updates BOOLEAN DEFAULT TRUE,
    inapp_community_updates BOOLEAN DEFAULT TRUE,
    inapp_payment_updates BOOLEAN DEFAULT TRUE,
    inapp_system_updates BOOLEAN DEFAULT TRUE,
    
    -- Push preferences (for future mobile app)
    push_enabled BOOLEAN DEFAULT FALSE,
    push_course_updates BOOLEAN DEFAULT FALSE,
    push_community_updates BOOLEAN DEFAULT FALSE,
    push_payment_updates BOOLEAN DEFAULT FALSE,
    push_system_updates BOOLEAN DEFAULT FALSE,
    
    -- User preferences
    language_pref TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('immediate', 'hourly', 'daily', 'weekly', 'never')),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification templates for consistent messaging
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    email_subject_template TEXT,
    email_body_template TEXT,
    link_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(type, trigger_event)
);

-- Email queue for reliable delivery
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    to_email TEXT NOT NULL,
    from_email TEXT DEFAULT 'noreply@techpounou.com',
    reply_to TEXT,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    template_id TEXT,
    template_data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'retrying')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Email queue indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON public.email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON public.email_queue(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all notifications" 
    ON public.notifications FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can manage all notifications" 
    ON public.notifications FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- User notification settings policies
CREATE POLICY "Users can view their own notification settings" 
    ON public.user_notification_settings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
    ON public.user_notification_settings FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
    ON public.user_notification_settings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Notification templates policies (read-only for users, full access for admins)
CREATE POLICY "Users can view notification templates" 
    ON public.notification_templates FOR SELECT 
    USING (is_active = TRUE);

CREATE POLICY "Super admins can manage notification templates" 
    ON public.notification_templates FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Email queue policies (admin only)
CREATE POLICY "Super admins can view email queue" 
    ON public.email_queue FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.notifications
        WHERE user_id = target_user_id
        AND is_read = FALSE
        AND is_archived = FALSE
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(notification_ids UUID[])
RETURNS VOID AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = TRUE, read_at = NOW()
    WHERE id = ANY(notification_ids)
    AND user_id = auth.uid()
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    target_user_id UUID,
    notification_type TEXT,
    notification_title TEXT,
    notification_body TEXT,
    notification_link TEXT DEFAULT NULL,
    notification_metadata JSONB DEFAULT '{}',
    notification_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id, type, title, body, link_url, metadata, priority
    ) VALUES (
        target_user_id, notification_type, notification_title, 
        notification_body, notification_link, notification_metadata, notification_priority
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_notification_settings_updated_at
    BEFORE UPDATE ON public.user_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON public.notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DEFAULT NOTIFICATION TEMPLATES
-- =============================================

-- Insert default notification templates
INSERT INTO public.notification_templates (type, trigger_event, title_template, body_template, email_subject_template, email_body_template, link_template) VALUES

-- Course notifications
('course', 'enrollment_confirmed', 'Welcome to {{course_title}}!', 'You have successfully enrolled in {{course_title}}. Start learning now!', 'Welcome to {{course_title}} - Tech Pou Nou', 'Congratulations! You are now enrolled in {{course_title}}. Access your course materials and start your learning journey.', '/courses/{{course_id}}'),

('course', 'new_lesson', 'New lesson available: {{lesson_title}}', 'A new lesson "{{lesson_title}}" is now available in {{course_title}}.', 'New Lesson Available - {{course_title}}', 'A new lesson "{{lesson_title}}" has been added to your course {{course_title}}. Continue your learning journey!', '/courses/{{course_id}}/lessons/{{lesson_id}}'),

('course', 'quiz_graded', 'Quiz Results: {{quiz_title}}', 'Your quiz "{{quiz_title}}" has been graded. Score: {{score}}%', 'Quiz Results - {{quiz_title}}', 'Your quiz "{{quiz_title}}" has been graded. You scored {{score}}%. Review your results and keep learning!', '/courses/{{course_id}}/quizzes/{{quiz_id}}/results'),

('course', 'certificate_issued', 'Congratulations! Certificate Earned', 'You have earned a certificate for completing {{course_title}}!', 'Certificate Earned - {{course_title}}', 'Congratulations! You have successfully completed {{course_title}} and earned your certificate. Download it now!', '/certificates/{{certificate_id}}'),

-- Community notifications
('community', 'new_group_member', 'New member joined {{group_name}}', '{{member_name}} has joined the group {{group_name}}.', 'New Member in {{group_name}}', '{{member_name}} has joined your group {{group_name}}. Welcome them to the community!', '/groups/{{group_id}}'),

('community', 'event_reminder', 'Event Reminder: {{event_title}}', 'Your registered event "{{event_title}}" starts {{time_until}}.', 'Upcoming Event - {{event_title}}', 'This is a reminder that your registered event "{{event_title}}" starts {{time_until}}. Don''t miss it!', '/events/{{event_id}}'),

('community', 'connection_request', 'New connection request', '{{requester_name}} wants to connect with you on Tech Pou Nou.', 'New Connection Request', '{{requester_name}} has sent you a connection request on Tech Pou Nou. View their profile and respond!', '/networking'),

-- Payment notifications
('payment', 'subscription_renewed', 'Subscription Renewed', 'Your subscription has been successfully renewed for another period.', 'Subscription Renewed - Tech Pou Nou', 'Your subscription has been successfully renewed. Continue enjoying premium features!', '/dashboard/billing'),

('payment', 'payment_failed', 'Payment Failed', 'We couldn''t process your payment. Please update your payment method.', 'Payment Failed - Tech Pou Nou', 'We encountered an issue processing your payment. Please update your payment method to continue your subscription.', '/dashboard/billing'),

('payment', 'payout_available', 'Payout Available', 'Your instructor payout of ${{amount}} is ready for withdrawal.', 'Payout Available - Tech Pou Nou', 'Your instructor payout of ${{amount}} is ready for withdrawal. Access your instructor dashboard to process it.', '/instructor/payouts'),

-- System notifications
('system', 'platform_update', 'Platform Update Available', 'We''ve released new features and improvements to Tech Pou Nou.', 'Platform Updates - Tech Pou Nou', 'We''ve released exciting new features and improvements. Check out what''s new on Tech Pou Nou!', '/updates'),

('system', 'maintenance_notice', 'Scheduled Maintenance', 'Tech Pou Nou will undergo maintenance on {{date}} from {{start_time}} to {{end_time}}.', 'Scheduled Maintenance Notice', 'Tech Pou Nou will be temporarily unavailable for maintenance on {{date}} from {{start_time}} to {{end_time}}.', NULL),

-- Message notifications
('message', 'new_private_message', 'New Message from {{sender_name}}', 'You have received a new message from {{sender_name}}.', 'New Message - Tech Pou Nou', 'You have received a new message from {{sender_name}} on Tech Pou Nou.', '/messages/{{conversation_id}}'),

-- Announcement notifications
('announcement', 'global_announcement', '{{title}}', '{{body}}', '{{title}} - Tech Pou Nou', '{{body}}', '{{link}}');

-- =============================================
-- DEFAULT USER SETTINGS
-- =============================================

-- Function to create default notification settings for new users
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default settings for new users
CREATE TRIGGER create_user_notification_settings
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_settings();

-- Create settings for existing users
INSERT INTO public.user_notification_settings (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_notification_settings TO authenticated;
GRANT SELECT ON public.notification_templates TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_notifications() TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.notifications IS 'Stores all user notifications for in-app, email, and push delivery';
COMMENT ON TABLE public.user_notification_settings IS 'User preferences for notification delivery channels and types';
COMMENT ON TABLE public.notification_templates IS 'Templates for consistent notification formatting across channels';
COMMENT ON TABLE public.email_queue IS 'Queue for reliable email delivery with retry logic';

-- Migration complete
COMMIT;
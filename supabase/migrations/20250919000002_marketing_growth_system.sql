-- Marketing, SEO, and Growth System Migration
-- Created: 2025-09-19

-- Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    source TEXT, -- 'website', 'course_page', 'blog_post', 'referral', etc.
    tags TEXT[], -- For segmentation
    preferences JSONB DEFAULT '{}', -- Email frequency, topics, etc.
    metadata JSONB DEFAULT '{}', -- UTM parameters, referring page, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Email Campaigns Table
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
    type TEXT DEFAULT 'newsletter' CHECK (type IN ('newsletter', 'course_announcement', 'promotion', 'system', 'welcome', 'drip')),
    created_by UUID REFERENCES public.users(id) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    recipient_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    tags TEXT[], -- For filtering/segmentation
    metadata JSONB DEFAULT '{}', -- UTM parameters, A/B test info, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Email Campaign Recipients (for tracking individual sends)
CREATE TABLE IF NOT EXISTS public.email_campaign_recipients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE NOT NULL,
    subscriber_id UUID REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(campaign_id, subscriber_id)
);

-- Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    referee_email TEXT NOT NULL,
    referee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'converted', 'expired', 'cancelled')),
    referral_code TEXT UNIQUE NOT NULL, -- Unique code for tracking
    reward_type TEXT DEFAULT 'discount' CHECK (reward_type IN ('discount', 'credit', 'course_access', 'points')),
    reward_value DECIMAL(10,2), -- Amount of discount/credit
    reward_description TEXT,
    referrer_reward_claimed BOOLEAN DEFAULT FALSE,
    referee_reward_claimed BOOLEAN DEFAULT FALSE,
    converted_at TIMESTAMP WITH TIME ZONE, -- When referee made first purchase/enrollment
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}', -- UTM parameters, campaign info, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Landing Pages Table
CREATE TABLE IF NOT EXISTS public.landing_pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    meta_title TEXT,
    meta_description TEXT,
    og_image TEXT,
    content JSONB NOT NULL, -- Page content as JSON blocks
    cta_text TEXT DEFAULT 'Get Started',
    cta_link TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    template_type TEXT DEFAULT 'course' CHECK (template_type IN ('course', 'service', 'general', 'coming_soon')),
    target_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    target_service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    a_b_test_variant TEXT, -- For A/B testing different versions
    conversion_goal TEXT, -- 'signup', 'purchase', 'download', etc.
    analytics_data JSONB DEFAULT '{}', -- Track views, conversions, etc.
    created_by UUID REFERENCES public.users(id) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Growth Metrics Tracking
CREATE TABLE IF NOT EXISTS public.growth_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_type TEXT NOT NULL, -- 'signup', 'enrollment', 'purchase', 'referral', 'newsletter_signup', etc.
    metric_value DECIMAL(15,2) DEFAULT 1, -- Usually 1 for counts, but can be amount for revenue
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id TEXT, -- For tracking anonymous users
    source TEXT, -- 'organic', 'referral', 'social', 'email', 'direct', etc.
    medium TEXT, -- 'search', 'email', 'social', 'cpc', etc.
    campaign TEXT, -- Campaign name
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    referrer_url TEXT,
    landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE SET NULL,
    related_id UUID, -- Related course, service, blog post, etc.
    related_type TEXT, -- 'course', 'service', 'blog_post', etc.
    ip_address INET,
    user_agent TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT, -- 'desktop', 'tablet', 'mobile'
    browser TEXT,
    os TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Social Shares Tracking
CREATE TABLE IF NOT EXISTS public.social_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('course', 'blog_post', 'service', 'certificate', 'landing_page')),
    content_id UUID NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'email', 'copy_link')),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id TEXT,
    shared_url TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- SEO Meta Data for Dynamic Pages
CREATE TABLE IF NOT EXISTS public.seo_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('course', 'blog_post', 'service', 'landing_page', 'page')),
    content_id UUID,
    page_path TEXT, -- For static pages like /about, /contact
    title TEXT,
    description TEXT,
    keywords TEXT[],
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    og_type TEXT DEFAULT 'website',
    twitter_card TEXT DEFAULT 'summary_large_image',
    twitter_title TEXT,
    twitter_description TEXT,
    twitter_image TEXT,
    canonical_url TEXT,
    structured_data JSONB, -- JSON-LD structured data
    robots TEXT DEFAULT 'index,follow',
    priority DECIMAL(2,1) DEFAULT 0.5 CHECK (priority >= 0 AND priority <= 1),
    changefreq TEXT DEFAULT 'weekly' CHECK (changefreq IN ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(content_type, content_id),
    UNIQUE(page_path) WHERE page_path IS NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON public.newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_source ON public.newsletter_subscribers(source);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created_at ON public.newsletter_subscribers(created_at);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_type ON public.email_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON public.email_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON public.email_campaigns(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign_id ON public.email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_subscriber_id ON public.email_campaign_recipients(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_status ON public.email_campaign_recipients(status);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_email ON public.referrals(referee_email);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON public.landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_landing_pages_template_type ON public.landing_pages(template_type);

CREATE INDEX IF NOT EXISTS idx_growth_metrics_metric_type ON public.growth_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_growth_metrics_user_id ON public.growth_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_metrics_created_at ON public.growth_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_growth_metrics_source ON public.growth_metrics(source);
CREATE INDEX IF NOT EXISTS idx_growth_metrics_utm_campaign ON public.growth_metrics(utm_campaign);

CREATE INDEX IF NOT EXISTS idx_social_shares_content_type_id ON public.social_shares(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_platform ON public.social_shares(platform);
CREATE INDEX IF NOT EXISTS idx_social_shares_created_at ON public.social_shares(created_at);

CREATE INDEX IF NOT EXISTS idx_seo_metadata_content_type_id ON public.seo_metadata(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_seo_metadata_page_path ON public.seo_metadata(page_path);

-- Enable RLS on all tables
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (to be refined in separate policy file)
-- Newsletter subscribers - public can subscribe, admins can manage
CREATE POLICY "Public can subscribe to newsletter" ON public.newsletter_subscribers
    FOR INSERT TO public
    WITH CHECK (true);

CREATE POLICY "Users can view their subscription" ON public.newsletter_subscribers
    FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('super_admin', 'admin')
    ));

CREATE POLICY "Admins can manage newsletter subscribers" ON public.newsletter_subscribers
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('super_admin', 'admin')
    ));

-- Email campaigns - only admins can manage
CREATE POLICY "Admins can manage email campaigns" ON public.email_campaigns
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('super_admin', 'admin')
    ));

-- Email campaign recipients - only admins can view
CREATE POLICY "Admins can view campaign recipients" ON public.email_campaign_recipients
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('super_admin', 'admin')
    ));

-- Referrals - users can view their own referrals
CREATE POLICY "Users can view their referrals" ON public.referrals
    FOR SELECT USING (referrer_id = auth.uid() OR referee_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('super_admin', 'admin')
    ));

CREATE POLICY "Users can create referrals" ON public.referrals
    FOR INSERT WITH CHECK (referrer_id = auth.uid());

-- Landing pages - public can view published, admins can manage
CREATE POLICY "Public can view published landing pages" ON public.landing_pages
    FOR SELECT USING (status = 'published' OR auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('super_admin', 'admin')
    ));

CREATE POLICY "Admins can manage landing pages" ON public.landing_pages
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('super_admin', 'admin')
    ));

-- Growth metrics - only admins can view
CREATE POLICY "Admins can view growth metrics" ON public.growth_metrics
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('super_admin', 'admin')
    ));

CREATE POLICY "Public can create growth metrics" ON public.growth_metrics
    FOR INSERT WITH CHECK (true);

-- Social shares - public can create, admins can view
CREATE POLICY "Public can create social shares" ON public.social_shares
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view social shares" ON public.social_shares
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('super_admin', 'admin')
    ));

-- SEO metadata - public can view, admins can manage
CREATE POLICY "Public can view SEO metadata" ON public.seo_metadata
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage SEO metadata" ON public.seo_metadata
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role IN ('super_admin', 'admin')
    ));

-- Create functions for common operations
-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN UPPER(SUBSTRING(MD5(user_id::text || EXTRACT(EPOCH FROM NOW())), 1, 8));
END;
$$ LANGUAGE plpgsql;

-- Function to track growth metrics
CREATE OR REPLACE FUNCTION track_growth_metric(
    p_metric_type TEXT,
    p_metric_value DECIMAL DEFAULT 1,
    p_user_id UUID DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_utm_source TEXT DEFAULT NULL,
    p_utm_medium TEXT DEFAULT NULL,
    p_utm_campaign TEXT DEFAULT NULL,
    p_related_id UUID DEFAULT NULL,
    p_related_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    metric_id UUID;
BEGIN
    INSERT INTO public.growth_metrics (
        metric_type, metric_value, user_id, source,
        utm_source, utm_medium, utm_campaign,
        related_id, related_type
    ) VALUES (
        p_metric_type, p_metric_value, p_user_id, p_source,
        p_utm_source, p_utm_medium, p_utm_campaign,
        p_related_id, p_related_type
    )
    RETURNING id INTO metric_id;
    
    RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get growth stats
CREATE OR REPLACE FUNCTION get_growth_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    metric_type TEXT,
    total_count BIGINT,
    total_value DECIMAL,
    daily_average DECIMAL,
    growth_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH current_period AS (
        SELECT 
            gm.metric_type,
            COUNT(*) as count,
            SUM(gm.metric_value) as value
        FROM public.growth_metrics gm
        WHERE gm.created_at::date BETWEEN start_date AND end_date
        GROUP BY gm.metric_type
    ),
    previous_period AS (
        SELECT 
            gm.metric_type,
            COUNT(*) as count,
            SUM(gm.metric_value) as value
        FROM public.growth_metrics gm
        WHERE gm.created_at::date BETWEEN 
            start_date - (end_date - start_date + 1) AND 
            start_date - 1
        GROUP BY gm.metric_type
    )
    SELECT 
        cp.metric_type,
        cp.count::BIGINT,
        cp.value::DECIMAL,
        ROUND(cp.value / (end_date - start_date + 1), 2)::DECIMAL as daily_avg,
        CASE 
            WHEN pp.value > 0 THEN ROUND(((cp.value - pp.value) / pp.value * 100), 2)
            ELSE NULL
        END::DECIMAL as growth_rate
    FROM current_period cp
    LEFT JOIN previous_period pp ON cp.metric_type = pp.metric_type
    ORDER BY cp.value DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_newsletter_subscribers_updated_at
    BEFORE UPDATE ON public.newsletter_subscribers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
    BEFORE UPDATE ON public.email_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaign_recipients_updated_at
    BEFORE UPDATE ON public.email_campaign_recipients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landing_pages_updated_at
    BEFORE UPDATE ON public.landing_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_metadata_updated_at
    BEFORE UPDATE ON public.seo_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

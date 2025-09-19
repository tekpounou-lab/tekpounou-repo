-- Community Features Migration
-- Events, Groups, and Networking functionality

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location VARCHAR(255),
    is_virtual BOOLEAN DEFAULT false,
    link_url VARCHAR(500),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tags TEXT[],
    cover_image VARCHAR(500),
    max_attendees INTEGER,
    is_featured BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(event_id, user_id)
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cover_image VARCHAR(500),
    tags TEXT[],
    is_private BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    member_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Group posts table
CREATE TABLE IF NOT EXISTS group_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    attachments TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group post comments table
CREATE TABLE IF NOT EXISTS group_post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES group_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections/Networking table
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked', 'declined')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, receiver_id),
    CHECK (requester_id != receiver_id)
);

-- Event attendees view for easy querying
CREATE VIEW event_attendees AS
SELECT 
    e.id as event_id,
    e.title as event_title,
    er.user_id,
    p.full_name,
    p.avatar_url,
    er.status,
    er.registered_at
FROM events e
JOIN event_registrations er ON e.id = er.event_id
JOIN profiles p ON er.user_id = p.id;

-- Group members view with profile info
CREATE VIEW group_members_view AS
SELECT 
    gm.group_id,
    gm.user_id,
    gm.role,
    gm.joined_at,
    p.full_name,
    p.avatar_url,
    p.bio
FROM group_members gm
JOIN profiles p ON gm.user_id = p.id;

-- User connections view
CREATE VIEW user_connections AS
SELECT 
    c.id,
    c.requester_id,
    c.receiver_id,
    c.status,
    c.message,
    c.created_at,
    p1.full_name as requester_name,
    p1.avatar_url as requester_avatar,
    p2.full_name as receiver_name,
    p2.avatar_url as receiver_avatar
FROM connections c
JOIN profiles p1 ON c.requester_id = p1.id
JOIN profiles p2 ON c.receiver_id = p2.id;

-- Indexes for better performance
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_tags ON events USING GIN(tags);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_tags ON groups USING GIN(tags);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX idx_connections_requester_id ON connections(requester_id);
CREATE INDEX idx_connections_receiver_id ON connections(receiver_id);
CREATE INDEX idx_connections_status ON connections(status);

-- Full-text search for events
ALTER TABLE events ADD COLUMN search_vector tsvector;
CREATE INDEX idx_events_search ON events USING gin(search_vector);

-- Update search vector function for events
CREATE OR REPLACE FUNCTION update_events_search_vector()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector := setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
                        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating search vector
CREATE TRIGGER update_events_search_vector_trigger
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_events_search_vector();

-- Full-text search for groups
ALTER TABLE groups ADD COLUMN search_vector tsvector;
CREATE INDEX idx_groups_search ON groups USING gin(search_vector);

-- Update search vector function for groups
CREATE OR REPLACE FUNCTION update_groups_search_vector()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector := setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
                        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating search vector
CREATE TRIGGER update_groups_search_vector_trigger
    BEFORE INSERT OR UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_groups_search_vector();

-- Function to update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups 
        SET member_count = member_count + 1 
        WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups 
        SET member_count = member_count - 1 
        WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for group member count
CREATE TRIGGER update_group_member_count_trigger
    AFTER INSERT OR DELETE ON group_members
    FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE group_posts 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE group_posts 
        SET comments_count = comments_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for post comments count
CREATE TRIGGER update_post_comments_count_trigger
    AFTER INSERT OR DELETE ON group_post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Row Level Security (RLS) Policies

-- Events policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Event creators can update their events" ON events FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Event creators and admins can delete events" ON events FOR DELETE USING (
    auth.uid() = created_by OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- Event registrations policies
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own registrations" ON event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register for events" ON event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own registrations" ON event_registrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can cancel their registrations" ON event_registrations FOR DELETE USING (auth.uid() = user_id);

-- Groups policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups are viewable by everyone" ON groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups" ON groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Group creators can update their groups" ON groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Group creators and admins can delete groups" ON groups FOR DELETE USING (
    auth.uid() = created_by OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- Group members policies
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members are viewable by group members" ON group_members FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Group posts policies
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group posts are viewable by group members" ON group_posts FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Group members can create posts" ON group_posts FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Post authors can update their posts" ON group_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Post authors can delete their posts" ON group_posts FOR DELETE USING (auth.uid() = user_id);

-- Group post comments policies
ALTER TABLE group_post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by group members" ON group_post_comments FOR SELECT USING (
    post_id IN (
        SELECT id FROM group_posts WHERE group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    )
);
CREATE POLICY "Group members can comment" ON group_post_comments FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    post_id IN (
        SELECT id FROM group_posts WHERE group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    )
);
CREATE POLICY "Comment authors can update their comments" ON group_post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Comment authors can delete their comments" ON group_post_comments FOR DELETE USING (auth.uid() = user_id);

-- Connections policies
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their connections" ON connections FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send connection requests" ON connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update received requests" ON connections FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Users can delete their connections" ON connections FOR DELETE USING (
    auth.uid() = requester_id OR auth.uid() = receiver_id
);

-- Insert some sample data for testing
INSERT INTO events (title, description, start_date, end_date, location, is_virtual, created_by, tags) VALUES
('Atèlye Pwogramam Python', 'Yon atèlye entèaktif pou aprann fondasyon yo nan pwogramam Python.', '2025-01-15 14:00:00+00', '2025-01-15 17:00:00+00', 'Inisiatè Kominotè Teknoloji Ayiti', false, (SELECT id FROM auth.users LIMIT 1), ARRAY['python', 'programming', 'beginner']),
('Webinar: AI nan Edikasyon', 'Diskisyon sou kijan AI ap transforme peyi ak edikasyon nan Ayiti.', '2025-01-20 19:00:00+00', '2025-01-20 20:30:00+00', 'Online', true, (SELECT id FROM auth.users LIMIT 1), ARRAY['ai', 'education', 'technology']),
('Hackathon pou Solisyon Edikasyon', 'Yon aktivite 48-è kote ekip yo ap devlope solisyon teknoloji pou defi edikasyon nan Ayiti.', '2025-02-01 09:00:00+00', '2025-02-03 18:00:00+00', 'Inisiatè Kominotè Teknoloji Ayiti', false, (SELECT id FROM auth.users LIMIT 1), ARRAY['hackathon', 'education', 'innovation']);

INSERT INTO groups (name, description, created_by, tags) VALUES
('AI nan Ayiti', 'Yon kominotè pou moun ki enterese nan entèlijans atifisyèl ak aplikasyon li yo nan Ayiti.', (SELECT id FROM auth.users LIMIT 1), ARRAY['ai', 'haiti', 'technology']),
('Aprann Blockchain', 'Gwoup pou aprann ak diskite sou teknoloji blockchain ak kriptomonn.', (SELECT id FROM auth.users LIMIT 1), ARRAY['blockchain', 'cryptocurrency', 'learning']),
('Depo FemTech Ayiti', 'Enkontrè ak sipò fanm yo nan teknoloji nan Ayiti.', (SELECT id FROM auth.users LIMIT 1), ARRAY['women', 'technology', 'empowerment']);
-- Create team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_in_project TEXT DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, profile_id)
);

-- Disable RLS for testing (you can enable it later with proper policies)
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- Or if you want RLS enabled, use these policies:
-- ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Allow all for authenticated users" ON team_members;
-- CREATE POLICY "Allow all for authenticated users" ON team_members
--     FOR ALL
--     USING (true)
--     WITH CHECK (true);

-- Grant access
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON team_members TO anon;

-- Verify table exists
SELECT * FROM team_members LIMIT 1;

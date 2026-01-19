-- 1. Create project_time_logs table
CREATE TABLE IF NOT EXISTS project_time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) NOT NULL,
    project_id UUID REFERENCES projects(id) NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- Optional link to a specific task
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    description TEXT,
    duration_seconds INTEGER, -- Calculated on completion
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create View for Reporting (Total Hours & Days Worked)
CREATE OR REPLACE VIEW project_work_summary AS
SELECT 
    org_id,
    project_id,
    user_id,
    -- Sum of completed durations (converted to hours)
    ROUND(SUM(duration_seconds)::numeric / 3600, 2) as total_hours,
    -- Count of unique days worked
    COUNT(DISTINCT DATE(start_time)) as days_worked,
    -- Optional: Count of sessions
    COUNT(id) as total_sessions
FROM 
    project_time_logs
WHERE 
    end_time IS NOT NULL
GROUP BY 
    org_id, project_id, user_id;


-- 3. Enable RLS
ALTER TABLE project_time_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Policy for Executives/Org Managers (See ALL in their Org)
-- Assuming 'profiles' table has 'role' and 'org_id'
CREATE POLICY "Execs and Admins view all in org" ON project_time_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.org_id = project_time_logs.org_id
            AND profiles.role IN ('executive', 'system_admin', 'org_manager')
        )
    );

-- Policy for Project Managers (See ALL in their Projects)
CREATE POLICY "Project Managers view project team logs" ON project_time_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = project_time_logs.project_id
            AND project_members.user_id = auth.uid()
            AND project_members.role = 'project_manager'
        )
    );

-- Policy for Employees/Team Leads (See ONLY their OWN logs)
-- Note: Team Leads might need to see their team's logs, but for now enforcing own-only per requirement "employee side like only his own time"
CREATE POLICY "Employees view own logs" ON project_time_logs
    FOR ALL
    USING (
        auth.uid() = user_id
    );

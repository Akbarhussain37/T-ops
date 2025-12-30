-- Project Documents Table
-- Allows managers to add documentation visible to all team members
-- IMPORTANT: Run AFTER project_analytics_setup.sql

CREATE TABLE IF NOT EXISTS project_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    doc_type TEXT DEFAULT 'other' CHECK (doc_type IN ('requirements', 'tech_stack', 'project_tasks', 'other')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);

-- Enable RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Project members can view documents" ON project_documents;
DROP POLICY IF EXISTS "Managers can insert documents" ON project_documents;
DROP POLICY IF EXISTS "Managers can update documents" ON project_documents;
DROP POLICY IF EXISTS "Managers can delete documents" ON project_documents;

-- Policy: All project members can view documents
-- Uses profile_id (not user_id) as that's how team_members is structured
CREATE POLICY "Project members can view documents"
    ON project_documents FOR SELECT
    USING (
        project_id IN (
            SELECT team_id FROM team_members WHERE profile_id = auth.uid()
        )
        OR 
        created_by = auth.uid()
    );

-- Policy: Managers and team leads can insert documents
CREATE POLICY "Managers can insert documents"
    ON project_documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_id = project_documents.project_id 
            AND profile_id = auth.uid() 
            AND role_in_project IN ('pm', 'team_lead')
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'executive')
        )
    );

-- Policy: Managers and team leads can update documents
CREATE POLICY "Managers can update documents"
    ON project_documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_id = project_documents.project_id 
            AND profile_id = auth.uid() 
            AND role_in_project IN ('pm', 'team_lead')
        )
        OR
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'executive')
        )
    );

-- Policy: Managers can delete documents
CREATE POLICY "Managers can delete documents"
    ON project_documents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_id = project_documents.project_id 
            AND profile_id = auth.uid() 
            AND role_in_project = 'pm'
        )
        OR
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'executive')
        )
    );

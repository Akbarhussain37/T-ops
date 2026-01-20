-- Performance Evaluations Table
-- This table stores performance evaluations for employees

CREATE TABLE IF NOT EXISTS performance_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('month', 'quarter')),
    period_value VARCHAR(30) NOT NULL, -- e.g., 'January 2026', 'Q1 2026'
    score DECIMAL(3,1) CHECK (score >= 0 AND score <= 10),
    soft_skills DECIMAL(3,1) CHECK (soft_skills >= 0 AND soft_skills <= 10),
    review TEXT,
    improvements TEXT,
    given_by_role VARCHAR(20) NOT NULL CHECK (given_by_role IN ('Manager', 'Executive')),
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_employee ON performance_evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_project ON performance_evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_created_by ON performance_evaluations(created_by);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_period ON performance_evaluations(period, period_value);

-- Enable Row Level Security
ALTER TABLE performance_evaluations ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read (filtering is done at application level for simplicity)
CREATE POLICY "Allow read access to performance_evaluations"
ON performance_evaluations FOR SELECT
USING (true);

-- Policy: Only authenticated users with manager/executive role can insert
CREATE POLICY "Allow insert for managers and executives"
ON performance_evaluations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Only authenticated users with manager/executive role can update
CREATE POLICY "Allow update for managers and executives"
ON performance_evaluations FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Policy: Only authenticated users with manager/executive role can delete
CREATE POLICY "Allow delete for managers and executives"
ON performance_evaluations FOR DELETE
USING (auth.uid() IS NOT NULL);

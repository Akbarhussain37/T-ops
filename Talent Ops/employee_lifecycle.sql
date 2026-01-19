-- 1. Add columns to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'employee_stage') THEN
        ALTER TABLE profiles ADD COLUMN employee_stage TEXT DEFAULT 'Intern';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'functional_track') THEN
        ALTER TABLE profiles ADD COLUMN functional_track TEXT DEFAULT 'Engineering';
    END IF;
END $$;

-- 1.1 Add check constraints for enums
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_employee_stage;
ALTER TABLE profiles ADD CONSTRAINT check_employee_stage 
    CHECK (employee_stage IN ('Intern', 'FullTime_IC', 'Senior_IC', 'TeamLead', 'Manager', 'HR', 'Exited'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_functional_track;
ALTER TABLE profiles ADD CONSTRAINT check_functional_track 
    CHECK (functional_track IN ('Engineering', 'Management', 'HR', 'Operations', 'Sales'));


-- 2. Create employee_stage_history table
CREATE TABLE IF NOT EXISTS employee_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    from_stage TEXT,
    to_stage TEXT NOT NULL,
    reason TEXT,
    approved_by UUID REFERENCES profiles(id),
    effective_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create stored procedure for safe stage updates
CREATE OR REPLACE FUNCTION update_employee_stage(
    p_employee_id UUID,
    p_new_stage TEXT,
    p_reason TEXT,
    p_approved_by UUID
)
RETURNS VOID AS $$
DECLARE
    v_current_stage TEXT;
BEGIN
    -- Get current stage
    SELECT employee_stage INTO v_current_stage FROM profiles WHERE id = p_employee_id;

    -- If no change, we ensure idempotency or simple return. 
    -- But if they are calling this, they likely intend a change.
    IF v_current_stage IS DISTINCT FROM p_new_stage THEN
        -- Update profile
        UPDATE profiles 
        SET employee_stage = p_new_stage,
            updated_at = NOW()
        WHERE id = p_employee_id;

        -- Insert history
        INSERT INTO employee_stage_history (employee_id, from_stage, to_stage, reason, approved_by, effective_date)
        VALUES (p_employee_id, v_current_stage, p_new_stage, p_reason, p_approved_by, NOW());
    END IF;
END;
$$ LANGUAGE plpgsql;

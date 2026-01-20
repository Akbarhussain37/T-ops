-- Run this in Supabase SQL Editor to fix delete permissions
DO $$
BEGIN
    -- Enable RLS (idempotent)
    ALTER TABLE performance_evaluations ENABLE ROW LEVEL SECURITY;

    -- Create delete policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'performance_evaluations' 
        AND cmd = 'DELETE'
    ) THEN
        CREATE POLICY "Enable delete for authenticated users" 
        ON performance_evaluations 
        FOR DELETE 
        USING (auth.uid() IS NOT NULL);
    END IF;
END
$$;

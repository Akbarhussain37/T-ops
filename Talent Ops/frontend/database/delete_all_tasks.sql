-- DELETE ALL TASKS - USING TRUNCATE (BYPASSES TRIGGERS)
-- TRUNCATE is faster and doesn't fire row-level triggers

-- Step 1: Truncate all task-related tables (CASCADE handles dependencies)
TRUNCATE TABLE task_progress CASCADE;
TRUNCATE TABLE task_submissions CASCADE;
TRUNCATE TABLE task_state_history CASCADE;
TRUNCATE TABLE tasks CASCADE;

-- Step 2: Verify
SELECT 'Tasks remaining: ' || COUNT(*)::text as status FROM tasks;

-- ⚠️ WARNING: This will delete ALL users from the system!
-- Run this in Supabase SQL Editor

-- Step 1: Delete related data first (child tables with foreign keys)

-- Delete team memberships
DELETE FROM team_members;

-- Delete project memberships  
DELETE FROM project_members;

-- Delete tasks (they reference assigned_to which is a profile)
DELETE FROM tasks;

-- Delete leaves (they reference employee_id which is a profile)
DELETE FROM leaves;

-- Delete attendance records
DELETE FROM attendance;

-- Delete project documents
DELETE FROM project_documents;

-- Delete announcements if they reference profiles
-- DELETE FROM announcements;

-- Delete messages and conversations
DELETE FROM messages;
DELETE FROM conversation_participants;
DELETE FROM conversations;

-- Step 2: Now delete all profiles
DELETE FROM profiles;

-- Step 3: Verify the cleanup
SELECT 'profiles' as table_name, COUNT(*) as remaining FROM profiles
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'project_members', COUNT(*) FROM project_members
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'leaves', COUNT(*) FROM leaves;

-- NOTE: This does NOT delete auth.users (login credentials)
-- To fully remove users, you'd also need to delete from auth.users:
-- DELETE FROM auth.users;
-- But this might require service_role access

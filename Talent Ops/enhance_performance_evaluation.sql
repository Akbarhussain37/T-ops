-- Performance Evaluations Table Enhancement
-- Run this in your Supabase SQL Editor to add soft skill columns

-- PART 1: Add 10 individual soft skill columns to performance_evaluations table
-- (This should work regardless of other tables)

ALTER TABLE performance_evaluations 
ADD COLUMN IF NOT EXISTS skill_accountability DECIMAL(3,1) CHECK (skill_accountability >= 0 AND skill_accountability <= 10),
ADD COLUMN IF NOT EXISTS skill_compliance DECIMAL(3,1) CHECK (skill_compliance >= 0 AND skill_compliance <= 10),
ADD COLUMN IF NOT EXISTS skill_learnability DECIMAL(3,1) CHECK (skill_learnability >= 0 AND skill_learnability <= 10),
ADD COLUMN IF NOT EXISTS skill_ambitious DECIMAL(3,1) CHECK (skill_ambitious >= 0 AND skill_ambitious <= 10),
ADD COLUMN IF NOT EXISTS skill_abstract_thinking DECIMAL(3,1) CHECK (skill_abstract_thinking >= 0 AND skill_abstract_thinking <= 10),
ADD COLUMN IF NOT EXISTS skill_communication DECIMAL(3,1) CHECK (skill_communication >= 0 AND skill_communication <= 10),
ADD COLUMN IF NOT EXISTS skill_curiosity DECIMAL(3,1) CHECK (skill_curiosity >= 0 AND skill_curiosity <= 10),
ADD COLUMN IF NOT EXISTS skill_english DECIMAL(3,1) CHECK (skill_english >= 0 AND skill_english <= 10),
ADD COLUMN IF NOT EXISTS skill_second_order_thinking DECIMAL(3,1) CHECK (skill_second_order_thinking >= 0 AND skill_second_order_thinking <= 10),
ADD COLUMN IF NOT EXISTS skill_first_principle_thinking DECIMAL(3,1) CHECK (skill_first_principle_thinking >= 0 AND skill_first_principle_thinking <= 10);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'performance_evaluations' 
AND column_name LIKE 'skill_%';

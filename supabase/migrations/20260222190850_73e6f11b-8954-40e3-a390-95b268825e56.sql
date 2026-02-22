
-- Add plan_type and target_students columns to treatment_plans
ALTER TABLE public.treatment_plans 
ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS target_student_ids uuid[] DEFAULT '{}';

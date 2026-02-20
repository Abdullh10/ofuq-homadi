
-- Add new grade columns: class_interaction_score, project_score, practical_score
ALTER TABLE public.grades ADD COLUMN class_interaction_score numeric DEFAULT 0;
ALTER TABLE public.grades ADD COLUMN project_score numeric DEFAULT 0;
ALTER TABLE public.grades ADD COLUMN practical_score numeric DEFAULT 0;


-- Drop all existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Allow all " ON public.students;
DROP POLICY IF EXISTS "Allow all " ON public.grades;
DROP POLICY IF EXISTS "Allow all " ON public.behaviors;
DROP POLICY IF EXISTS "Allow all " ON public.alerts;
DROP POLICY IF EXISTS "Allow all " ON public.alert_settings;
DROP POLICY IF EXISTS "Allow all " ON public.interventions;
DROP POLICY IF EXISTS "Allow all " ON public.parent_meetings;
DROP POLICY IF EXISTS "Allow all " ON public.treatment_plans;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Allow all access" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.grades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.behaviors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.alert_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.interventions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.parent_meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.treatment_plans FOR ALL USING (true) WITH CHECK (true);

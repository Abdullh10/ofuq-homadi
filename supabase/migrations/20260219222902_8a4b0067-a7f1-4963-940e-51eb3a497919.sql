
-- Update all RLS policies to allow public (anon) access

-- students
DROP POLICY IF EXISTS "Authenticated users can manage students" ON public.students;
CREATE POLICY "Allow public access to students" ON public.students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- grades
DROP POLICY IF EXISTS "Authenticated users can manage grades" ON public.grades;
CREATE POLICY "Allow public access to grades" ON public.grades FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- behaviors
DROP POLICY IF EXISTS "Authenticated users can manage behaviors" ON public.behaviors;
CREATE POLICY "Allow public access to behaviors" ON public.behaviors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- alerts
DROP POLICY IF EXISTS "Authenticated users can manage alerts" ON public.alerts;
CREATE POLICY "Allow public access to alerts" ON public.alerts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- alert_settings
DROP POLICY IF EXISTS "Authenticated users can manage alert_settings" ON public.alert_settings;
CREATE POLICY "Allow public access to alert_settings" ON public.alert_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- treatment_plans
DROP POLICY IF EXISTS "Authenticated users can manage treatment_plans" ON public.treatment_plans;
CREATE POLICY "Allow public access to treatment_plans" ON public.treatment_plans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- interventions
DROP POLICY IF EXISTS "Authenticated users can manage interventions" ON public.interventions;
CREATE POLICY "Allow public access to interventions" ON public.interventions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- parent_meetings
DROP POLICY IF EXISTS "Authenticated users can manage parent_meetings" ON public.parent_meetings;
CREATE POLICY "Allow public access to parent_meetings" ON public.parent_meetings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

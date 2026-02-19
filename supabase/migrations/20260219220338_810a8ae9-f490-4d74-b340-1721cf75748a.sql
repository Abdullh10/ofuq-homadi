
-- Drop all existing permissive policies and replace with authenticated-only

-- students
DROP POLICY IF EXISTS "Allow all" ON public.students;
DROP POLICY IF EXISTS "Allow all access" ON public.students;
CREATE POLICY "Authenticated users can manage students" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- grades
DROP POLICY IF EXISTS "Allow all" ON public.grades;
DROP POLICY IF EXISTS "Allow all access" ON public.grades;
CREATE POLICY "Authenticated users can manage grades" ON public.grades FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- behaviors
DROP POLICY IF EXISTS "Allow all" ON public.behaviors;
DROP POLICY IF EXISTS "Allow all access" ON public.behaviors;
CREATE POLICY "Authenticated users can manage behaviors" ON public.behaviors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- alerts
DROP POLICY IF EXISTS "Allow all" ON public.alerts;
DROP POLICY IF EXISTS "Allow all access" ON public.alerts;
CREATE POLICY "Authenticated users can manage alerts" ON public.alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- alert_settings
DROP POLICY IF EXISTS "Allow all" ON public.alert_settings;
DROP POLICY IF EXISTS "Allow all access" ON public.alert_settings;
CREATE POLICY "Authenticated users can manage alert_settings" ON public.alert_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- interventions
DROP POLICY IF EXISTS "Allow all" ON public.interventions;
DROP POLICY IF EXISTS "Allow all access" ON public.interventions;
CREATE POLICY "Authenticated users can manage interventions" ON public.interventions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- parent_meetings
DROP POLICY IF EXISTS "Allow all" ON public.parent_meetings;
DROP POLICY IF EXISTS "Allow all access" ON public.parent_meetings;
CREATE POLICY "Authenticated users can manage parent_meetings" ON public.parent_meetings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- treatment_plans
DROP POLICY IF EXISTS "Allow all" ON public.treatment_plans;
DROP POLICY IF EXISTS "Allow all access" ON public.treatment_plans;
CREATE POLICY "Authenticated users can manage treatment_plans" ON public.treatment_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

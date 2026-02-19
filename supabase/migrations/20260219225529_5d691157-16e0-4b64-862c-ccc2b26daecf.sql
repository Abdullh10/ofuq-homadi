
-- Update all tables: public SELECT, authenticated-only INSERT/UPDATE/DELETE

-- students
DROP POLICY IF EXISTS "Allow public access to students" ON public.students;
CREATE POLICY "Public read students" ON public.students FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth write students" ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update students" ON public.students FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete students" ON public.students FOR DELETE TO authenticated USING (true);

-- grades
DROP POLICY IF EXISTS "Allow public access to grades" ON public.grades;
CREATE POLICY "Public read grades" ON public.grades FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth write grades" ON public.grades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update grades" ON public.grades FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete grades" ON public.grades FOR DELETE TO authenticated USING (true);

-- behaviors
DROP POLICY IF EXISTS "Allow public access to behaviors" ON public.behaviors;
CREATE POLICY "Public read behaviors" ON public.behaviors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth write behaviors" ON public.behaviors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update behaviors" ON public.behaviors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete behaviors" ON public.behaviors FOR DELETE TO authenticated USING (true);

-- alerts
DROP POLICY IF EXISTS "Allow public access to alerts" ON public.alerts;
CREATE POLICY "Public read alerts" ON public.alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth write alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update alerts" ON public.alerts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete alerts" ON public.alerts FOR DELETE TO authenticated USING (true);

-- alert_settings
DROP POLICY IF EXISTS "Allow public access to alert_settings" ON public.alert_settings;
CREATE POLICY "Public read alert_settings" ON public.alert_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth write alert_settings" ON public.alert_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update alert_settings" ON public.alert_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete alert_settings" ON public.alert_settings FOR DELETE TO authenticated USING (true);

-- treatment_plans
DROP POLICY IF EXISTS "Allow public access to treatment_plans" ON public.treatment_plans;
CREATE POLICY "Public read treatment_plans" ON public.treatment_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth write treatment_plans" ON public.treatment_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update treatment_plans" ON public.treatment_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete treatment_plans" ON public.treatment_plans FOR DELETE TO authenticated USING (true);

-- interventions
DROP POLICY IF EXISTS "Allow public access to interventions" ON public.interventions;
CREATE POLICY "Public read interventions" ON public.interventions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth write interventions" ON public.interventions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update interventions" ON public.interventions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete interventions" ON public.interventions FOR DELETE TO authenticated USING (true);

-- parent_meetings
DROP POLICY IF EXISTS "Allow public access to parent_meetings" ON public.parent_meetings;
CREATE POLICY "Public read parent_meetings" ON public.parent_meetings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth write parent_meetings" ON public.parent_meetings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update parent_meetings" ON public.parent_meetings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete parent_meetings" ON public.parent_meetings FOR DELETE TO authenticated USING (true);

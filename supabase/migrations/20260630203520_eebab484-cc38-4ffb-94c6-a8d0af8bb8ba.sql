
-- Align RLS write policies with frontend role model: accept both 'admin' and 'club_admin'

-- rotation_duties
DROP POLICY IF EXISTS "Club admins manage own club rotation" ON public.rotation_duties;
CREATE POLICY "Club admins manage own club rotation" ON public.rotation_duties
FOR ALL TO authenticated
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)) AND club_id = get_user_club_id(auth.uid()));

-- events
DROP POLICY IF EXISTS "Club admins manage own club events" ON public.events;
CREATE POLICY "Club admins manage own club events" ON public.events
FOR ALL TO authenticated
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)) AND club_id = get_user_club_id(auth.uid()));

-- athletes
DROP POLICY IF EXISTS "Club admins manage own club athletes" ON public.athletes;
CREATE POLICY "Club admins manage own club athletes" ON public.athletes
FOR ALL TO authenticated
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)) AND club_id = get_user_club_id(auth.uid()));

-- attendances
DROP POLICY IF EXISTS "Club admins manage own club attendances" ON public.attendances;
CREATE POLICY "Club admins manage own club attendances" ON public.attendances
FOR ALL TO authenticated
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)) AND club_id = get_user_club_id(auth.uid()));

-- debts
DROP POLICY IF EXISTS "Club admins manage own club debts" ON public.debts;
CREATE POLICY "Club admins manage own club debts" ON public.debts
FOR ALL TO authenticated
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)) AND club_id = get_user_club_id(auth.uid()));

-- expenses
DROP POLICY IF EXISTS "Club admins manage own club expenses" ON public.expenses;
CREATE POLICY "Club admins manage own club expenses" ON public.expenses
FOR ALL TO authenticated
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)) AND club_id = get_user_club_id(auth.uid()));

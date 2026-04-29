-- Club admins can manage data within their own club.
-- Uses has_role(uid,'admin') + matching club_id via get_user_club_id.

-- EVENTS
CREATE POLICY "Club admins manage own club events"
ON public.events FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()));

-- ATHLETES
CREATE POLICY "Club admins manage own club athletes"
ON public.athletes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()));

-- COACHES
CREATE POLICY "Club admins manage own club coaches"
ON public.coaches FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()));

-- ATTENDANCES
CREATE POLICY "Club admins manage own club attendances"
ON public.attendances FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()));

-- ROTATION DUTIES
CREATE POLICY "Club admins manage own club rotation"
ON public.rotation_duties FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()));

-- EXPENSES
CREATE POLICY "Club admins manage own club expenses"
ON public.expenses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()));

-- DEBTS
CREATE POLICY "Club admins manage own club debts"
ON public.debts FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND club_id = get_user_club_id(auth.uid()));
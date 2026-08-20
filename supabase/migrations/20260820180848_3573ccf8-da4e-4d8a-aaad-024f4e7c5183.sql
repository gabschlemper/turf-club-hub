-- 1. user_roles: one role per user + deterministic club resolution
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_unique ON public.user_roles (user_id);

CREATE OR REPLACE FUNCTION public.get_user_club_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT club_id
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY created_at ASC, id ASC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY created_at ASC, id ASC
  LIMIT 1
$$;

-- 2. audits: readable by admins, writable only by triggers (security definer)
GRANT SELECT ON public.audits TO authenticated;
GRANT ALL ON public.audits TO service_role;

DROP POLICY IF EXISTS "audits_insert_blocked" ON public.audits;
CREATE POLICY "Audits cannot be inserted by clients"
ON public.audits FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "Admins view audits" ON public.audits;
CREATE POLICY "Admins view audits"
ON public.audits FOR SELECT TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'club_admin'::app_role)
);

-- 3. coaches: audit trail via trigger (client inserts were silently failing)
CREATE OR REPLACE FUNCTION public.audit_coaches_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action audit_action;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', 'coaches', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'SOFT_DELETE';
    ELSE
      v_action := 'UPDATE';
    END IF;
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), v_action, 'coaches', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', 'coaches', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_coaches_trigger ON public.coaches;
CREATE TRIGGER audit_coaches_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.coaches
FOR EACH ROW EXECUTE FUNCTION public.audit_coaches_changes();

-- 4. Restrict all read policies to authenticated role
DROP POLICY IF EXISTS "Club members view athletes" ON public.athletes;
CREATE POLICY "Club members view athletes" ON public.athletes FOR SELECT TO authenticated
USING ((deleted_at IS NULL) AND (club_id = get_user_club_id(auth.uid())));

DROP POLICY IF EXISTS "Super admin manage all athletes" ON public.athletes;
CREATE POLICY "Super admin manage all athletes" ON public.athletes FOR ALL TO authenticated
USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Club members view attendances" ON public.attendances;
CREATE POLICY "Club members view attendances" ON public.attendances FOR SELECT TO authenticated
USING ((deleted_at IS NULL) AND (club_id = get_user_club_id(auth.uid())));

DROP POLICY IF EXISTS "Super admin manage all attendances" ON public.attendances;
CREATE POLICY "Super admin manage all attendances" ON public.attendances FOR ALL TO authenticated
USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Club members view coaches" ON public.coaches;
CREATE POLICY "Club members view coaches" ON public.coaches FOR SELECT TO authenticated
USING ((deleted_at IS NULL) AND (club_id = get_user_club_id(auth.uid())));

DROP POLICY IF EXISTS "Super admin manage all coaches" ON public.coaches;
CREATE POLICY "Super admin manage all coaches" ON public.coaches FOR ALL TO authenticated
USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Club members view events" ON public.events;
CREATE POLICY "Club members view events" ON public.events FOR SELECT TO authenticated
USING (club_id = get_user_club_id(auth.uid()));

DROP POLICY IF EXISTS "Super admin manage all events" ON public.events;
CREATE POLICY "Super admin manage all events" ON public.events FOR ALL TO authenticated
USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Club members view rotation" ON public.rotation_duties;
CREATE POLICY "Club members view rotation" ON public.rotation_duties FOR SELECT TO authenticated
USING (club_id = get_user_club_id(auth.uid()));

DROP POLICY IF EXISTS "Super admin manage all rotation" ON public.rotation_duties;
CREATE POLICY "Super admin manage all rotation" ON public.rotation_duties FOR ALL TO authenticated
USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Club members view confirmations" ON public.training_confirmations;
CREATE POLICY "Club members view confirmations" ON public.training_confirmations FOR SELECT TO authenticated
USING (club_id = get_user_club_id(auth.uid()));

DROP POLICY IF EXISTS "Super admin manage all confirmations" ON public.training_confirmations;
CREATE POLICY "Super admin manage all confirmations" ON public.training_confirmations FOR ALL TO authenticated
USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admin manage all debts" ON public.debts;
CREATE POLICY "Super admin manage all debts" ON public.debts FOR ALL TO authenticated
USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own role" ON public.user_roles;
CREATE POLICY "Users view own role" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admin manage all roles" ON public.user_roles;
CREATE POLICY "Super admin manage all roles" ON public.user_roles FOR ALL TO authenticated
USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view their own club" ON public.clubs;
CREATE POLICY "Users can view their own club" ON public.clubs FOR SELECT TO authenticated
USING (id = get_user_club_id(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage all clubs" ON public.clubs;
CREATE POLICY "Super admins can manage all clubs" ON public.clubs FOR ALL TO authenticated
USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

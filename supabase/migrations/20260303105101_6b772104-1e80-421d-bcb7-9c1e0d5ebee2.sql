
-- =============================================
-- MULTI-TENANCY: Club Isolation (Part 2)
-- =============================================

-- 1. Create clubs table
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- 2. Add club_id to all relevant tables
ALTER TABLE public.athletes ADD COLUMN club_id UUID REFERENCES public.clubs(id);
ALTER TABLE public.events ADD COLUMN club_id UUID REFERENCES public.clubs(id);
ALTER TABLE public.attendances ADD COLUMN club_id UUID REFERENCES public.clubs(id);
ALTER TABLE public.training_confirmations ADD COLUMN club_id UUID REFERENCES public.clubs(id);
ALTER TABLE public.rotation_duties ADD COLUMN club_id UUID REFERENCES public.clubs(id);
ALTER TABLE public.debts ADD COLUMN club_id UUID REFERENCES public.clubs(id);
ALTER TABLE public.user_roles ADD COLUMN club_id UUID REFERENCES public.clubs(id);

-- 3. Insert default club and migrate existing data
INSERT INTO public.clubs (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Hóquei Clube Desterro', 'hoquei-clube-desterro');

UPDATE public.athletes SET club_id = '00000000-0000-0000-0000-000000000001' WHERE club_id IS NULL;
UPDATE public.events SET club_id = '00000000-0000-0000-0000-000000000001' WHERE club_id IS NULL;
UPDATE public.attendances SET club_id = '00000000-0000-0000-0000-000000000001' WHERE club_id IS NULL;
UPDATE public.training_confirmations SET club_id = '00000000-0000-0000-0000-000000000001' WHERE club_id IS NULL;
UPDATE public.rotation_duties SET club_id = '00000000-0000-0000-0000-000000000001' WHERE club_id IS NULL;
UPDATE public.debts SET club_id = '00000000-0000-0000-0000-000000000001' WHERE club_id IS NULL;
UPDATE public.user_roles SET club_id = '00000000-0000-0000-0000-000000000001' WHERE club_id IS NULL;

-- 4. Make club_id NOT NULL
ALTER TABLE public.athletes ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public.events ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public.attendances ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public.training_confirmations ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public.rotation_duties ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public.debts ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN club_id SET NOT NULL;

-- 5. Create indexes
CREATE INDEX idx_athletes_club_id ON public.athletes(club_id);
CREATE INDEX idx_events_club_id ON public.events(club_id);
CREATE INDEX idx_attendances_club_id ON public.attendances(club_id);
CREATE INDEX idx_training_confirmations_club_id ON public.training_confirmations(club_id);
CREATE INDEX idx_rotation_duties_club_id ON public.rotation_duties(club_id);
CREATE INDEX idx_debts_club_id ON public.debts(club_id);
CREATE INDEX idx_user_roles_club_id ON public.user_roles(club_id);

-- 6. Helper functions
CREATE OR REPLACE FUNCTION public.get_user_club_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT club_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- 7. RLS Policies

-- == clubs ==
CREATE POLICY "Super admins can manage all clubs"
  ON public.clubs FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own club"
  ON public.clubs FOR SELECT
  USING (id = get_user_club_id(auth.uid()));

-- == athletes ==
DROP POLICY IF EXISTS "Admins can manage athletes" ON public.athletes;
DROP POLICY IF EXISTS "athletes_read_authenticated" ON public.athletes;

CREATE POLICY "Admin can manage club athletes"
  ON public.athletes FOR ALL
  USING (
    club_id = get_user_club_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'club_admin'))
  );

CREATE POLICY "Super admin manage all athletes"
  ON public.athletes FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Club members view athletes"
  ON public.athletes FOR SELECT
  USING (deleted_at IS NULL AND club_id = get_user_club_id(auth.uid()));

-- == events ==
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;

CREATE POLICY "Admin can manage club events"
  ON public.events FOR ALL
  USING (
    club_id = get_user_club_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'club_admin'))
  );

CREATE POLICY "Super admin manage all events"
  ON public.events FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Club members view events"
  ON public.events FOR SELECT
  USING (club_id = get_user_club_id(auth.uid()));

-- == attendances ==
DROP POLICY IF EXISTS "Admins can manage attendances" ON public.attendances;
DROP POLICY IF EXISTS "Authenticated users can view non-deleted attendances" ON public.attendances;

CREATE POLICY "Admin can manage club attendances"
  ON public.attendances FOR ALL
  USING (
    club_id = get_user_club_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'club_admin'))
  );

CREATE POLICY "Super admin manage all attendances"
  ON public.attendances FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Club members view attendances"
  ON public.attendances FOR SELECT
  USING (deleted_at IS NULL AND club_id = get_user_club_id(auth.uid()));

-- == debts ==
DROP POLICY IF EXISTS "Admins can manage debts" ON public.debts;
DROP POLICY IF EXISTS "Athletes can view their own debts" ON public.debts;

CREATE POLICY "Admin can manage club debts"
  ON public.debts FOR ALL
  USING (
    club_id = get_user_club_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'club_admin'))
  );

CREATE POLICY "Super admin manage all debts"
  ON public.debts FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Athletes view own debts"
  ON public.debts FOR SELECT
  USING (
    deleted_at IS NULL
    AND club_id = get_user_club_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles p JOIN athletes a ON a.email = p.email
      WHERE p.user_id = auth.uid() AND a.id = debts.athlete_id
    )
  );

-- == rotation_duties ==
DROP POLICY IF EXISTS "Authenticated users can view rotation duties" ON public.rotation_duties;
DROP POLICY IF EXISTS "Admins can manage rotation duties" ON public.rotation_duties;

CREATE POLICY "Admin can manage club rotation"
  ON public.rotation_duties FOR ALL
  USING (
    club_id = get_user_club_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'club_admin'))
  );

CREATE POLICY "Super admin manage all rotation"
  ON public.rotation_duties FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Club members view rotation"
  ON public.rotation_duties FOR SELECT
  USING (club_id = get_user_club_id(auth.uid()));

-- == training_confirmations ==
DROP POLICY IF EXISTS "Admins can manage training confirmations" ON public.training_confirmations;
DROP POLICY IF EXISTS "Athletes can manage their own confirmations" ON public.training_confirmations;
DROP POLICY IF EXISTS "training_confirmations_read_authenticated" ON public.training_confirmations;

CREATE POLICY "Admin can manage club confirmations"
  ON public.training_confirmations FOR ALL
  USING (
    club_id = get_user_club_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'club_admin'))
  );

CREATE POLICY "Super admin manage all confirmations"
  ON public.training_confirmations FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Athletes manage own confirmations"
  ON public.training_confirmations FOR ALL
  USING (
    club_id = get_user_club_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles p JOIN athletes a ON a.email = p.email
      WHERE p.user_id = auth.uid() AND a.id = training_confirmations.athlete_id
    )
  );

CREATE POLICY "Club members view confirmations"
  ON public.training_confirmations FOR SELECT
  USING (club_id = get_user_club_id(auth.uid()));

-- == user_roles ==
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Club admin view club roles"
  ON public.user_roles FOR SELECT
  USING (
    club_id = get_user_club_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'club_admin'))
  );

CREATE POLICY "Super admin manage all roles"
  ON public.user_roles FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Club admin manage club roles"
  ON public.user_roles FOR ALL
  USING (
    club_id = get_user_club_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'club_admin'))
  );

-- 8. Update handle_new_user to include club_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id uuid;
BEGIN
  SELECT club_id INTO v_club_id
  FROM public.athletes
  WHERE LOWER(email) = LOWER(NEW.email)
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_club_id IS NULL THEN
    SELECT id INTO v_club_id FROM public.clubs LIMIT 1;
  END IF;

  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role, club_id)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'athlete'),
    v_club_id
  );
  
  RETURN NEW;
END;
$$;

-- 9. Update soft_delete for club_admin
CREATE OR REPLACE FUNCTION public.soft_delete(p_table_name text, p_record_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sql TEXT;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role) OR is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can soft delete records';
  END IF;
  
  IF p_table_name NOT IN ('athletes', 'events', 'rotation_duties', 'debts', 'attendances') THEN
    RAISE EXCEPTION 'Invalid table name';
  END IF;
  
  v_sql := format('UPDATE public.%I SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL', p_table_name);
  EXECUTE v_sql USING p_record_id;
  
  RETURN FOUND;
END;
$$;

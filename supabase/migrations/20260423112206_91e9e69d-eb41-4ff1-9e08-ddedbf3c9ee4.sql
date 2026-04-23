-- Create coaches table
CREATE TABLE public.coaches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Unique email per club (case-insensitive), only for non-deleted coaches
CREATE UNIQUE INDEX coaches_unique_email_per_club
  ON public.coaches (club_id, LOWER(email))
  WHERE deleted_at IS NULL;

CREATE INDEX coaches_club_id_idx ON public.coaches(club_id);
CREATE INDEX coaches_email_idx ON public.coaches(LOWER(email));

-- Enable RLS
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin can manage club coaches"
  ON public.coaches
  FOR ALL
  USING (
    (club_id = public.get_user_club_id(auth.uid()))
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'club_admin'::app_role)
    )
  );

CREATE POLICY "Super admin manage all coaches"
  ON public.coaches
  FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Club members view coaches"
  ON public.coaches
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND club_id = public.get_user_club_id(auth.uid())
  );

-- Trigger to auto-update updated_at
CREATE TRIGGER update_coaches_updated_at
  BEFORE UPDATE ON public.coaches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: check whether an email is registered as a coach (used during signup)
CREATE OR REPLACE FUNCTION public.check_coach_email_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.coaches
    WHERE LOWER(email) = LOWER(p_email)
      AND deleted_at IS NULL
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.check_coach_email_exists(text) TO anon, authenticated;

-- Update handle_new_user: if signup email matches a coach record, assign 'coach' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_club_id uuid;
  v_is_coach boolean := false;
  v_resolved_role app_role;
BEGIN
  -- 1) Look for an athlete with this email
  SELECT club_id INTO v_club_id
  FROM public.athletes
  WHERE LOWER(email) = LOWER(NEW.email)
    AND deleted_at IS NULL
  LIMIT 1;

  -- 2) If no athlete, look for a coach with this email
  IF v_club_id IS NULL THEN
    SELECT club_id INTO v_club_id
    FROM public.coaches
    WHERE LOWER(email) = LOWER(NEW.email)
      AND deleted_at IS NULL
    LIMIT 1;

    IF v_club_id IS NOT NULL THEN
      v_is_coach := true;
    END IF;
  ELSE
    -- Athlete exists, but check if also registered as coach in same club
    SELECT EXISTS (
      SELECT 1 FROM public.coaches
      WHERE LOWER(email) = LOWER(NEW.email)
        AND deleted_at IS NULL
    ) INTO v_is_coach;
  END IF;

  -- 3) Default fallback club
  IF v_club_id IS NULL THEN
    SELECT id INTO v_club_id FROM public.clubs LIMIT 1;
  END IF;

  -- 4) Resolve role: coach > metadata > athlete
  IF v_is_coach THEN
    v_resolved_role := 'coach'::app_role;
  ELSE
    v_resolved_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'athlete');
  END IF;

  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );

  INSERT INTO public.user_roles (user_id, role, club_id)
  VALUES (NEW.id, v_resolved_role, v_club_id);

  RETURN NEW;
END;
$function$;
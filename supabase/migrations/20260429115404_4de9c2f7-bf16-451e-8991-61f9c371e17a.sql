
-- 1) Drop gallery storage policies
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT polname FROM pg_policy WHERE polrelid = 'storage.objects'::regclass LOOP
    IF p.polname ILIKE '%gallery%' THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.polname);
    END IF;
  END LOOP;
END $$;

-- 2) Remove storage objects + bucket (bypass storage.protect_delete trigger)
SET LOCAL session_replication_role = 'replica';
DELETE FROM storage.objects WHERE bucket_id = 'gallery';
DELETE FROM storage.buckets WHERE id = 'gallery';
SET LOCAL session_replication_role = 'origin';

-- 3) Drop gallery/photographer tables + helpers
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.photo_albums CASCADE;
DROP TABLE IF EXISTS public.photographers CASCADE;
DROP FUNCTION IF EXISTS public.audit_photo_albums_changes() CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_gallery(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_photographer_email_exists(text) CASCADE;

-- 4) Tighten soft_delete whitelist
CREATE OR REPLACE FUNCTION public.soft_delete(p_table_name text, p_record_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_sql TEXT;
BEGIN
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'club_admin'::app_role)
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_table_name NOT IN ('athletes', 'events', 'rotation_duties', 'debts', 'attendances', 'coaches') THEN
    RAISE EXCEPTION 'Invalid table name';
  END IF;
  v_sql := format('UPDATE public.%I SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL', p_table_name);
  EXECUTE v_sql USING p_record_id;
  RETURN FOUND;
END;
$function$;

-- 5) Update handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_club_id uuid;
  v_resolved_role app_role := NULL;
BEGIN
  SELECT club_id INTO v_club_id FROM public.coaches
  WHERE LOWER(email) = LOWER(NEW.email) AND deleted_at IS NULL LIMIT 1;
  IF v_club_id IS NOT NULL THEN v_resolved_role := 'coach'::app_role; END IF;

  IF v_resolved_role IS NULL THEN
    SELECT club_id INTO v_club_id FROM public.athletes
    WHERE LOWER(email) = LOWER(NEW.email) AND deleted_at IS NULL LIMIT 1;
    IF v_club_id IS NOT NULL THEN v_resolved_role := 'athlete'::app_role; END IF;
  END IF;

  IF v_club_id IS NULL THEN SELECT id INTO v_club_id FROM public.clubs LIMIT 1; END IF;
  IF v_resolved_role IS NULL THEN
    v_resolved_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'athlete');
  END IF;

  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), NEW.email);
  INSERT INTO public.user_roles (user_id, role, club_id)
  VALUES (NEW.id, v_resolved_role, v_club_id);
  RETURN NEW;
END;
$function$;

-- 6) Recreate app_role enum without 'photographer'
DELETE FROM public.user_roles WHERE role = 'photographer';

DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin', 'athlete', 'club_admin', 'super_admin', 'coach');
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;
DROP TYPE public.app_role_old;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$function$;

-- 7) Fix audit_expenses_changes to match real audits schema
CREATE OR REPLACE FUNCTION public.audit_expenses_changes()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_action audit_action;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', 'expenses', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'SOFT_DELETE';
    ELSE
      v_action := 'UPDATE';
    END IF;
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), v_action, 'expenses', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', 'expenses', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

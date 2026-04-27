-- Photo albums
CREATE TABLE public.photo_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  album_date DATE NOT NULL,
  cover_photo_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_photo_albums_club ON public.photo_albums(club_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_photo_albums_date ON public.photo_albums(album_date DESC) WHERE deleted_at IS NULL;

-- Photos
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.photo_albums(id) ON DELETE CASCADE,
  club_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  thumb_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_photos_album ON public.photos(album_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_photos_club ON public.photos(club_id) WHERE deleted_at IS NULL;

ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.can_manage_gallery(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role, 'club_admin'::app_role, 'photographer'::app_role, 'super_admin'::app_role)
  )
$$;

-- RLS photo_albums
CREATE POLICY "Club members view albums" ON public.photo_albums FOR SELECT
USING (deleted_at IS NULL AND club_id = public.get_user_club_id(auth.uid()));

CREATE POLICY "Gallery managers manage club albums" ON public.photo_albums FOR ALL
USING (club_id = public.get_user_club_id(auth.uid()) AND public.can_manage_gallery(auth.uid()))
WITH CHECK (club_id = public.get_user_club_id(auth.uid()) AND public.can_manage_gallery(auth.uid()));

CREATE POLICY "Super admin manage all albums" ON public.photo_albums FOR ALL
USING (public.is_super_admin(auth.uid()));

-- RLS photos
CREATE POLICY "Club members view photos" ON public.photos FOR SELECT
USING (deleted_at IS NULL AND club_id = public.get_user_club_id(auth.uid()));

CREATE POLICY "Gallery managers manage club photos" ON public.photos FOR ALL
USING (club_id = public.get_user_club_id(auth.uid()) AND public.can_manage_gallery(auth.uid()))
WITH CHECK (club_id = public.get_user_club_id(auth.uid()) AND public.can_manage_gallery(auth.uid()));

CREATE POLICY "Super admin manage all photos" ON public.photos FOR ALL
USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_photo_albums_updated_at
BEFORE UPDATE ON public.photo_albums
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit
CREATE OR REPLACE FUNCTION public.audit_photo_albums_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_action audit_action;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', 'photo_albums', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN v_action := 'SOFT_DELETE';
    ELSE v_action := 'UPDATE'; END IF;
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), v_action, 'photo_albums', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', 'photo_albums', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_photo_albums
AFTER INSERT OR UPDATE OR DELETE ON public.photo_albums
FOR EACH ROW EXECUTE FUNCTION public.audit_photo_albums_changes();

-- Update soft_delete whitelist
CREATE OR REPLACE FUNCTION public.soft_delete(p_table_name text, p_record_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_sql TEXT;
BEGIN
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'club_admin'::app_role)
    OR is_super_admin(auth.uid())
    OR (p_table_name IN ('photo_albums', 'photos') AND has_role(auth.uid(), 'photographer'::app_role))
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_table_name NOT IN ('athletes', 'events', 'rotation_duties', 'debts', 'attendances', 'photo_albums', 'photos', 'coaches', 'photographers') THEN
    RAISE EXCEPTION 'Invalid table name';
  END IF;
  v_sql := format('UPDATE public.%I SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL', p_table_name);
  EXECUTE v_sql USING p_record_id;
  RETURN FOUND;
END;
$$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Club members read gallery" ON storage.objects FOR SELECT
USING (bucket_id = 'gallery' AND (storage.foldername(name))[1]::uuid = public.get_user_club_id(auth.uid()));

CREATE POLICY "Gallery managers upload" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gallery' AND (storage.foldername(name))[1]::uuid = public.get_user_club_id(auth.uid()) AND public.can_manage_gallery(auth.uid()));

CREATE POLICY "Gallery managers delete" ON storage.objects FOR DELETE
USING (bucket_id = 'gallery' AND (storage.foldername(name))[1]::uuid = public.get_user_club_id(auth.uid()) AND public.can_manage_gallery(auth.uid()));

CREATE POLICY "Gallery managers update" ON storage.objects FOR UPDATE
USING (bucket_id = 'gallery' AND (storage.foldername(name))[1]::uuid = public.get_user_club_id(auth.uid()) AND public.can_manage_gallery(auth.uid()));

-- Photographers table
CREATE TABLE public.photographers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_photographers_club ON public.photographers(club_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_photographers_email ON public.photographers(LOWER(email)) WHERE deleted_at IS NULL;

ALTER TABLE public.photographers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage club photographers" ON public.photographers FOR ALL
USING (club_id = public.get_user_club_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)))
WITH CHECK (club_id = public.get_user_club_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'club_admin'::app_role)));

CREATE POLICY "Super admin manage all photographers" ON public.photographers FOR ALL
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Club members view photographers" ON public.photographers FOR SELECT
USING (deleted_at IS NULL AND club_id = public.get_user_club_id(auth.uid()));

CREATE TRIGGER update_photographers_updated_at
BEFORE UPDATE ON public.photographers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.check_photographer_email_exists(p_email text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.photographers WHERE LOWER(email) = LOWER(p_email) AND deleted_at IS NULL);
END;
$$;

-- Update handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_club_id uuid;
  v_resolved_role app_role := NULL;
BEGIN
  SELECT club_id INTO v_club_id FROM public.photographers
  WHERE LOWER(email) = LOWER(NEW.email) AND deleted_at IS NULL LIMIT 1;
  IF v_club_id IS NOT NULL THEN v_resolved_role := 'photographer'::app_role; END IF;

  IF v_resolved_role IS NULL THEN
    SELECT club_id INTO v_club_id FROM public.coaches
    WHERE LOWER(email) = LOWER(NEW.email) AND deleted_at IS NULL LIMIT 1;
    IF v_club_id IS NOT NULL THEN v_resolved_role := 'coach'::app_role; END IF;
  END IF;

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
$$;
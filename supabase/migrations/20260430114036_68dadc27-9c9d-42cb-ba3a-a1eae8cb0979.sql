
-- Add logo_url column to clubs
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS logo_url text;

-- Create public bucket for club logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-logos', 'club-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for logos
DROP POLICY IF EXISTS "Club logos are publicly readable" ON storage.objects;
CREATE POLICY "Club logos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-logos');

-- Only admins can upload/update/delete logos for their club
DROP POLICY IF EXISTS "Admins can upload club logos" ON storage.objects;
CREATE POLICY "Admins can upload club logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'club-logos'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

DROP POLICY IF EXISTS "Admins can update club logos" ON storage.objects;
CREATE POLICY "Admins can update club logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'club-logos'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

DROP POLICY IF EXISTS "Admins can delete club logos" ON storage.objects;
CREATE POLICY "Admins can delete club logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'club-logos'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

-- Allow anyone (anon + authenticated) to read clubs (needed on login page before auth)
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clubs are publicly readable" ON public.clubs;
CREATE POLICY "Clubs are publicly readable"
ON public.clubs FOR SELECT
USING (true);

-- Allow admins to update their own club (for setting logo)
DROP POLICY IF EXISTS "Admins can update own club" ON public.clubs;
CREATE POLICY "Admins can update own club"
ON public.clubs FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (has_role(auth.uid(), 'admin'::app_role) AND id = get_user_club_id(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (has_role(auth.uid(), 'admin'::app_role) AND id = get_user_club_id(auth.uid()))
);

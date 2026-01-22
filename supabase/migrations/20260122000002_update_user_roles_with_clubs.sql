-- Update app_role enum to include club_admin and super_admin
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'club_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Add club_id to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

-- Set default club for existing user roles
UPDATE public.user_roles 
SET club_id = '00000000-0000-0000-0000-000000000001'
WHERE club_id IS NULL;

-- Make club_id required (except for super_admin)
-- Super admin doesn't belong to a specific club
ALTER TABLE public.user_roles 
ALTER COLUMN club_id SET NOT NULL;

-- However, we need to allow NULL for super_admin
ALTER TABLE public.user_roles 
ALTER COLUMN club_id DROP NOT NULL;

-- Add constraint: club_id is required unless role is super_admin
ALTER TABLE public.user_roles
ADD CONSTRAINT check_club_id_required 
CHECK (
  (role = 'super_admin' AND club_id IS NULL) OR
  (role != 'super_admin' AND club_id IS NOT NULL)
);

-- Update unique constraint to include club_id
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- New unique constraint: user can have only one role per club
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_club_unique UNIQUE (user_id, club_id, role);

-- Create index
CREATE INDEX idx_user_roles_club_id ON public.user_roles(club_id);
CREATE INDEX idx_user_roles_user_club ON public.user_roles(user_id, club_id);

-- Drop old has_role function
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role);

-- Create new has_role function that considers club
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role, _club_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (
        role = 'super_admin' OR  -- super_admin has access to all clubs
        club_id = _club_id OR    -- specific club access
        _club_id IS NULL         -- if club not specified, just check role
      )
  )
$$;

-- Update get_user_role to return role for specific club
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID, _club_id UUID DEFAULT NULL)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND (
      role = 'super_admin' OR
      club_id = _club_id OR
      _club_id IS NULL
    )
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'club_admin' THEN 2
      WHEN 'admin' THEN 3
      WHEN 'athlete' THEN 4
    END
  LIMIT 1
$$;

-- Helper functions for RLS policies

-- Function to get user's club_id
CREATE OR REPLACE FUNCTION public.get_user_club_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- If user is athlete, get club from athletes table
  SELECT a.club_id
  FROM public.athletes a
  WHERE a.email = (
    SELECT email FROM auth.users WHERE id = _user_id
  )
  LIMIT 1;
$$;

-- Alternative: get club from user_roles
CREATE OR REPLACE FUNCTION public.get_user_club_from_role(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT club_id
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role != 'super_admin'
  LIMIT 1;
$$;

-- Check if user is club admin
CREATE OR REPLACE FUNCTION public.is_club_admin(_user_id UUID, _club_id UUID)
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
      AND (role = 'club_admin' OR role = 'admin')
      AND club_id = _club_id
  )
$$;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
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
      AND role = 'super_admin'
  )
$$;

-- Check if user can access a specific club's data
CREATE OR REPLACE FUNCTION public.can_access_club(_user_id UUID, _club_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Super admin can access all clubs
    public.is_super_admin(_user_id) OR
    -- User belongs to this club
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND club_id = _club_id
    ) OR
    -- User is an athlete in this club
    EXISTS (
      SELECT 1
      FROM public.athletes a
      INNER JOIN auth.users u ON u.email = a.email
      WHERE u.id = _user_id
        AND a.club_id = _club_id
    )
  )
$$;

-- Check if email belongs to a registered athlete
CREATE OR REPLACE FUNCTION public.is_registered_athlete(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.athletes a
    INNER JOIN auth.users u ON u.email = a.email
    WHERE u.id = _user_id
  )
$$;

-- Get athlete's club_id by user_id
CREATE OR REPLACE FUNCTION public.get_athlete_club_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.club_id
  FROM public.athletes a
  INNER JOIN auth.users u ON u.email = a.email
  WHERE u.id = _user_id
  LIMIT 1;
$$;

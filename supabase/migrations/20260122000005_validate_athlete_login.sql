-- Function to validate athlete login
-- This function checks if a user who just logged in is a registered athlete

CREATE OR REPLACE FUNCTION public.validate_athlete_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_athlete BOOLEAN;
  is_admin_user BOOLEAN;
BEGIN
  -- Check if user has admin or super_admin role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.id
    AND role IN ('admin', 'club_admin', 'super_admin')
  ) INTO is_admin_user;
  
  -- If user is admin, allow login
  IF is_admin_user THEN
    RETURN NEW;
  END IF;
  
  -- Check if user email exists in athletes table
  SELECT EXISTS (
    SELECT 1 FROM public.athletes
    WHERE email = NEW.email
  ) INTO is_athlete;
  
  -- If user is not a registered athlete, prevent login by raising exception
  IF NOT is_athlete THEN
    RAISE EXCEPTION 'Only registered athletes can login. Please contact your club administrator.'
      USING HINT = 'unauthorized_athlete';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate on auth state change
-- NOTE: This trigger runs on auth.users which requires special privileges
-- If this fails, we'll implement the validation in the application layer instead
DO $$
BEGIN
  -- Try to create trigger on auth.users
  -- This might fail if we don't have permissions
  CREATE TRIGGER validate_athlete_on_signin
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.validate_athlete_login();
  
  EXCEPTION WHEN insufficient_privilege THEN
    -- If we can't create trigger on auth.users, that's okay
    -- We'll implement validation in the application layer
    RAISE NOTICE 'Could not create trigger on auth.users - will validate in application layer';
END $$;

-- Alternative: Create a function that can be called from the application
CREATE OR REPLACE FUNCTION public.check_user_athlete_access(_user_id UUID)
RETURNS TABLE (
  is_registered BOOLEAN,
  athlete_id UUID,
  club_id UUID,
  role app_role
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(
      SELECT 1 FROM public.athletes a
      INNER JOIN auth.users u ON u.email = a.email
      WHERE u.id = _user_id
    ) as is_registered,
    a.id as athlete_id,
    a.club_id,
    COALESCE(ur.role, 'athlete'::app_role) as role
  FROM auth.users u
  LEFT JOIN public.athletes a ON a.email = u.email
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE u.id = _user_id
  LIMIT 1;
END;
$$;

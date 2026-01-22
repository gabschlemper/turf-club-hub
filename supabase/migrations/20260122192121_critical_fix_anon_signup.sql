-- CRITICAL FIX: Ensure anonymous users can check if email exists for signup
-- This is required for the signup flow to work

-- First, drop any existing anonymous policy to avoid conflicts
DROP POLICY IF EXISTS "Anonymous users can verify email exists for signup" ON public.athletes;
DROP POLICY IF EXISTS "Anonymous can verify email for signup" ON public.athletes;
DROP POLICY IF EXISTS "anon_can_verify_email" ON public.athletes;

-- Create a simple, working policy for anonymous users
-- This allows signup validation by checking if email exists
CREATE POLICY "anon_signup_email_check"
ON public.athletes FOR SELECT
TO anon
USING (true);

-- Also ensure RLS is enabled (it should be, but just in case)
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

-- Grant basic select permission to anon role
GRANT SELECT ON public.athletes TO anon;

-- Create a function that can be called by anyone to check if an email exists
-- This bypasses RLS and is specifically for signup validation
CREATE OR REPLACE FUNCTION public.check_athlete_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.athletes 
    WHERE LOWER(email) = LOWER(p_email)
    AND deleted_at IS NULL -- Only check non-deleted athletes
  );
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.check_athlete_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_athlete_email_exists(TEXT) TO authenticated;

COMMENT ON FUNCTION public.check_athlete_email_exists IS 'Checks if an email exists in the athletes table. Used for signup validation. Bypasses RLS.';
COMMENT ON POLICY "anon_signup_email_check" ON public.athletes 
IS 'CRITICAL: Allows anonymous users to verify email exists during signup. Without this, new athletes cannot create accounts.';

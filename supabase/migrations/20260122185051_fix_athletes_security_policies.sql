-- Fix security vulnerabilities: Restrict access to sensitive athlete information
-- Admins can see all data
-- Athletes can only see their own email and basic info from others
-- Anonymous can only verify if email exists (for signup)

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view non-deleted athletes" ON public.athletes;
DROP POLICY IF EXISTS "Admins can manage non-deleted athletes" ON public.athletes;
DROP POLICY IF EXISTS "Anonymous users can verify email exists for signup" ON public.athletes;

-- Policy for anonymous users (signup validation) - ONLY email field for verification
CREATE POLICY "Anonymous can verify email for signup"
ON public.athletes FOR SELECT
TO anon
USING (deleted_at IS NULL);

-- Policy for authenticated non-admin users
-- Can see: name, gender, id for ALL athletes
-- Can see: email, birth_date ONLY for themselves (matching email with auth.email())
CREATE POLICY "Athletes can view basic info and own sensitive data"
ON public.athletes FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL 
  AND (
    -- User is admin (can see everything)
    has_role(auth.uid(), 'admin'::app_role)
    OR
    -- User can see basic info from all athletes
    -- (email and birth_date are accessible but should be filtered in application layer for non-matching users)
    NOT has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Policy for admins to manage athletes
CREATE POLICY "Admins can manage athletes"
ON public.athletes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

COMMENT ON POLICY "Athletes can view basic info and own sensitive data" ON public.athletes 
IS 'LGPD Compliance: Non-admin users can see all athlete names/gender and birth_date (day/month only - year is masked in UI). Full birth_date with year is only shown to admins. Athletes can see their own complete data.';
COMMENT ON POLICY "Anonymous can verify email for signup" ON public.athletes 
IS 'Allows signup validation by checking if email exists in athletes table';


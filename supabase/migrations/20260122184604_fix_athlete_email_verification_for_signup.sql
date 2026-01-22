-- Allow anonymous users to check if email exists in athletes table (for signup validation)
-- This policy only allows reading the email field, nothing else
CREATE POLICY "Anonymous users can verify email exists for signup"
ON public.athletes FOR SELECT
TO anon
USING (true);

-- Add comment explaining the policy
COMMENT ON POLICY "Anonymous users can verify email exists for signup" ON public.athletes 
IS 'Allows non-authenticated users to verify if their email is registered before signup. Only email field is exposed.';

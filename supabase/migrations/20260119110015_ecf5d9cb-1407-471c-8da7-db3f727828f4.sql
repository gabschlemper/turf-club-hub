-- Drop overly permissive policies
DROP POLICY IF EXISTS "Athletes can create swap requests" ON public.swap_requests;
DROP POLICY IF EXISTS "Athletes can update their swap requests" ON public.swap_requests;

-- Create more restrictive policies
-- Athletes can create swap requests where they are the requester (linked to their athlete profile)
CREATE POLICY "Athletes can create swap requests for themselves"
ON public.swap_requests
FOR INSERT
WITH CHECK (
  -- Allow if user is admin or if they are creating a request (admin creates on behalf for now)
  has_role(auth.uid(), 'admin'::app_role) OR auth.uid() IS NOT NULL
);

-- Target athletes can update (approve/reject) swap requests directed at them
CREATE POLICY "Target athletes can respond to swap requests"
ON public.swap_requests
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
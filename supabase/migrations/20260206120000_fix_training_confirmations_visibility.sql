-- Fix RLS policy to allow all authenticated users to view training confirmations
-- This is needed so athletes can see all confirmations for each training event
-- (who confirmed, who declined, who didn't respond)

DROP POLICY IF EXISTS "training_confirmations_select" ON public.training_confirmations;

CREATE POLICY "training_confirmations_read_authenticated" 
ON public.training_confirmations FOR SELECT
TO authenticated
USING (
  -- All authenticated users can view all training confirmations
  -- This allows athletes to see who else confirmed/declined for each training
  true
);

-- Keep admin-only management policy for INSERT/UPDATE/DELETE operations
-- (Existing policies for these operations should remain unchanged)
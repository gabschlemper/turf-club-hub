-- Fix RLS policy to allow all authenticated users to view athletes for birthdays
DROP POLICY IF EXISTS "athletes_select" ON athletes;

-- New policy: All authenticated users can read athletes (for birthdays, confirmations, etc.)
CREATE POLICY "athletes_read_authenticated"
ON athletes
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- Keep admin-only management policy
-- (The "Admins can manage athletes" policy already exists for INSERT/UPDATE/DELETE)

-- Fix case-sensitive email comparison in RLS policies

-- 1. training_confirmations: drop and recreate with LOWER()
DROP POLICY IF EXISTS "Athletes manage own confirmations" ON public.training_confirmations;
CREATE POLICY "Athletes manage own confirmations"
  ON public.training_confirmations
  FOR ALL
  TO authenticated
  USING (
    (club_id = get_user_club_id(auth.uid()))
    AND EXISTS (
      SELECT 1
      FROM profiles p
      JOIN athletes a ON LOWER(a.email) = LOWER(p.email)
      WHERE p.user_id = auth.uid()
        AND a.id = training_confirmations.athlete_id
    )
  );

-- 2. debts: drop and recreate with LOWER()
DROP POLICY IF EXISTS "Athletes view own debts" ON public.debts;
CREATE POLICY "Athletes view own debts"
  ON public.debts
  FOR SELECT
  TO authenticated
  USING (
    (deleted_at IS NULL)
    AND (club_id = get_user_club_id(auth.uid()))
    AND EXISTS (
      SELECT 1
      FROM profiles p
      JOIN athletes a ON LOWER(a.email) = LOWER(p.email)
      WHERE p.user_id = auth.uid()
        AND a.id = debts.athlete_id
    )
  );

-- 3. Normalize existing athlete emails to lowercase
UPDATE public.athletes SET email = LOWER(email) WHERE email != LOWER(email);

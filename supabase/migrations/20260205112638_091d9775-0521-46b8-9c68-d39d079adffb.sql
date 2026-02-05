-- ============================================
-- SECURITY FIX: Remove critical vulnerabilities
-- ============================================

-- 1. CRITICAL: Remove anonymous access to athletes table
-- The RPC function check_athlete_email_exists already provides safe email validation
DROP POLICY IF EXISTS "anon_signup_email_check" ON public.athletes;

-- Revoke direct table access from anon (keep RPC function access only)
REVOKE SELECT ON public.athletes FROM anon;

-- 2. Fix soft_delete function to require admin authorization
CREATE OR REPLACE FUNCTION public.soft_delete(
  p_table_name TEXT,
  p_record_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sql TEXT;
BEGIN
  -- Require admin role
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can soft delete records';
  END IF;
  
  -- Validate table name against whitelist
  IF p_table_name NOT IN ('athletes', 'events', 'rotation_duties', 'debts', 'attendances') THEN
    RAISE EXCEPTION 'Invalid table name';
  END IF;
  
  -- Execute soft delete
  v_sql := format('UPDATE public.%I SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL', p_table_name);
  EXECUTE v_sql USING p_record_id;
  
  RETURN FOUND;
END;
$$;

-- 3. Fix training_confirmations RLS - restrict to own data or admin
DROP POLICY IF EXISTS "Users can view all training confirmations" ON public.training_confirmations;
DROP POLICY IF EXISTS "Authenticated users can view training confirmations" ON public.training_confirmations;
DROP POLICY IF EXISTS "training_confirmations_select" ON public.training_confirmations;

CREATE POLICY "training_confirmations_select" 
ON public.training_confirmations FOR SELECT
USING (
  -- Admins can view all
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Athletes can only view their own confirmations
  athlete_id IN (
    SELECT a.id FROM athletes a
    JOIN profiles p ON LOWER(TRIM(p.email)) = LOWER(TRIM(a.email))
    WHERE p.user_id = auth.uid() AND a.deleted_at IS NULL
  )
);

-- 4. Fix athletes table RLS - restrict personal data to own or admin
DROP POLICY IF EXISTS "Admins can view all athletes" ON public.athletes;
DROP POLICY IF EXISTS "Athletes can view own data" ON public.athletes;
DROP POLICY IF EXISTS "Authenticated users can view athletes" ON public.athletes;
DROP POLICY IF EXISTS "athletes_select" ON public.athletes;

CREATE POLICY "athletes_select" 
ON public.athletes FOR SELECT
USING (
  -- Admins can view all
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Athletes can view their own data
  LOWER(TRIM(email)) IN (
    SELECT LOWER(TRIM(p.email)) FROM profiles p WHERE p.user_id = auth.uid()
  )
);

-- 5. Fix audits table - only admins can view, block direct inserts
DROP POLICY IF EXISTS "Admins can view audits" ON public.audits;
DROP POLICY IF EXISTS "Admins can view all audits" ON public.audits;
DROP POLICY IF EXISTS "Authenticated users can insert audits" ON public.audits;
DROP POLICY IF EXISTS "audits_select" ON public.audits;
DROP POLICY IF EXISTS "audits_insert" ON public.audits;
DROP POLICY IF EXISTS "audits_insert_blocked" ON public.audits;

-- Only admins can view audit logs
CREATE POLICY "audits_select" 
ON public.audits FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Prevent direct inserts from clients - only triggers/functions should insert
-- Note: Triggers use SECURITY DEFINER and bypass RLS, so this blocks client-side inserts
CREATE POLICY "audits_insert_blocked" 
ON public.audits FOR INSERT
WITH CHECK (false);

-- 6. Add database-level input validation for athletes table
ALTER TABLE public.athletes
DROP CONSTRAINT IF EXISTS athletes_name_length,
DROP CONSTRAINT IF EXISTS athletes_email_length,
DROP CONSTRAINT IF EXISTS athletes_birth_date_range;

ALTER TABLE public.athletes
ADD CONSTRAINT athletes_name_length CHECK (length(trim(name)) BETWEEN 2 AND 100),
ADD CONSTRAINT athletes_email_length CHECK (length(email) BETWEEN 5 AND 255),
ADD CONSTRAINT athletes_birth_date_range CHECK (birth_date BETWEEN '1900-01-01' AND CURRENT_DATE);
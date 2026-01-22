-- Update RLS policies for multi-tenant access control

-- ==========================================
-- ATHLETES TABLE POLICIES
-- ==========================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can manage athletes" ON public.athletes;
DROP POLICY IF EXISTS "Authenticated users can view athletes" ON public.athletes;

-- Club admins can manage athletes in their club
CREATE POLICY "Club admins can manage their club athletes"
ON public.athletes FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  (
    (public.is_club_admin(auth.uid(), club_id) OR public.has_role(auth.uid(), 'admin'::app_role, club_id))
    AND public.can_access_club(auth.uid(), club_id)
  )
);

-- Athletes can view athletes from their own club
CREATE POLICY "Users can view athletes from their club"
ON public.athletes FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  public.can_access_club(auth.uid(), club_id)
);

-- ==========================================
-- EVENTS TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;

-- Club admins can manage events in their club
CREATE POLICY "Club admins can manage their club events"
ON public.events FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  (
    (public.is_club_admin(auth.uid(), club_id) OR public.has_role(auth.uid(), 'admin'::app_role, club_id))
    AND public.can_access_club(auth.uid(), club_id)
  )
);

-- Users can view events from their club
CREATE POLICY "Users can view events from their club"
ON public.events FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  public.can_access_club(auth.uid(), club_id)
);

-- ==========================================
-- ATTENDANCES TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can manage attendances" ON public.attendances;
DROP POLICY IF EXISTS "Authenticated users can view attendances" ON public.attendances;

-- Club admins can manage attendances in their club
CREATE POLICY "Club admins can manage their club attendances"
ON public.attendances FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  (
    (public.is_club_admin(auth.uid(), club_id) OR public.has_role(auth.uid(), 'admin'::app_role, club_id))
    AND public.can_access_club(auth.uid(), club_id)
  )
);

-- Athletes can view their own attendances
CREATE POLICY "Athletes can view their own attendances"
ON public.attendances FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  (
    public.can_access_club(auth.uid(), club_id) AND
    athlete_id IN (
      SELECT id FROM public.athletes a
      INNER JOIN auth.users u ON u.email = a.email
      WHERE u.id = auth.uid()
    )
  )
);

-- Club admins can view all attendances in their club
CREATE POLICY "Club admins can view club attendances"
ON public.attendances FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  (
    (public.is_club_admin(auth.uid(), club_id) OR public.has_role(auth.uid(), 'admin'::app_role, club_id))
    AND public.can_access_club(auth.uid(), club_id)
  )
);

-- ==========================================
-- TRAINING CONFIRMATIONS POLICIES (if exists)
-- ==========================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'training_confirmations') THEN
    -- Drop old policies
    EXECUTE 'DROP POLICY IF EXISTS "Athletes can manage their confirmations" ON public.training_confirmations';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all confirmations" ON public.training_confirmations';
    
    -- Athletes can manage their own confirmations
    EXECUTE '
    CREATE POLICY "Athletes can manage their own confirmations"
    ON public.training_confirmations FOR ALL
    TO authenticated
    USING (
      public.can_access_club(auth.uid(), club_id) AND
      athlete_id IN (
        SELECT id FROM public.athletes a
        INNER JOIN auth.users u ON u.email = a.email
        WHERE u.id = auth.uid()
      )
    )';
    
    -- Club admins can view all confirmations in their club
    EXECUTE '
    CREATE POLICY "Club admins can view club confirmations"
    ON public.training_confirmations FOR SELECT
    TO authenticated
    USING (
      public.is_super_admin(auth.uid()) OR
      (
        (public.is_club_admin(auth.uid(), club_id) OR public.has_role(auth.uid(), ''admin''::app_role, club_id))
        AND public.can_access_club(auth.uid(), club_id)
      )
    )';
  END IF;
END $$;

-- ==========================================
-- PROFILES & USER_ROLES POLICIES UPDATE
-- ==========================================

-- Update profiles policies (no club_id, but user should only see their club's users)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Club admins can view profiles from their club"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  auth.uid() = user_id OR
  user_id IN (
    SELECT ur.user_id 
    FROM public.user_roles ur
    WHERE ur.club_id = public.get_athlete_club_id(auth.uid())
  )
);

-- Update user_roles policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Club admins can manage roles in their club"
ON public.user_roles FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  (
    (public.is_club_admin(auth.uid(), club_id) OR public.has_role(auth.uid(), 'admin'::app_role, club_id))
    AND club_id IS NOT NULL
  )
);

CREATE POLICY "Users can view roles from their club"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid()) OR
  auth.uid() = user_id OR
  club_id = public.get_athlete_club_id(auth.uid())
);

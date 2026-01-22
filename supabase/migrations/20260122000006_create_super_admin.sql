-- Create super admin user (project owner)
-- This migration promotes the project owner to super_admin role

-- First, ensure the user exists (they need to sign up first)
-- Then promote to super_admin

DO $$
DECLARE
  owner_user_id UUID;
BEGIN
  -- Get user ID for gabrielaschlemper@icloud.com
  SELECT id INTO owner_user_id
  FROM auth.users
  WHERE email = 'gabrielaschlemper@icloud.com';
  
  -- Only proceed if user exists
  IF owner_user_id IS NOT NULL THEN
    -- Remove any existing role for this user
    DELETE FROM public.user_roles WHERE user_id = owner_user_id;
    
    -- Create super_admin role (no club_id - super admin manages all clubs)
    INSERT INTO public.user_roles (user_id, role, club_id)
    VALUES (owner_user_id, 'super_admin', NULL);
    
    RAISE NOTICE 'Super admin created for gabrielaschlemper@icloud.com';
  ELSE
    RAISE NOTICE 'User gabrielaschlemper@icloud.com not found. Please sign up first.';
  END IF;
END $$;

-- Create audit action enum
CREATE TYPE public.audit_action AS ENUM (
  'INSERT',
  'UPDATE',
  'DELETE',
  'SOFT_DELETE',
  'LOGIN',
  'LOGOUT',
  'SIGNUP',
  'PASSWORD_RESET',
  'PASSWORD_CHANGE'
);

-- Create audits table
CREATE TABLE public.audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_audits_user_id ON public.audits(user_id);
CREATE INDEX idx_audits_action ON public.audits(action);
CREATE INDEX idx_audits_table_name ON public.audits(table_name);
CREATE INDEX idx_audits_record_id ON public.audits(record_id);
CREATE INDEX idx_audits_created_at ON public.audits(created_at DESC);

-- Enable RLS
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Audit policies (only admins can view audits)
CREATE POLICY "Admins can view all audits"
ON public.audits FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can manage audits"
ON public.audits FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add deleted_at column to tables for soft delete
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.rotation_duties ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for soft delete queries
CREATE INDEX idx_athletes_deleted_at ON public.athletes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_deleted_at ON public.events(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_rotation_duties_deleted_at ON public.rotation_duties(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_debts_deleted_at ON public.debts(deleted_at) WHERE deleted_at IS NULL;

-- Function to create audit log
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action audit_action,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.audits (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- Generic trigger function for audit logging on INSERT
CREATE OR REPLACE FUNCTION public.audit_insert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_audit_log(
    'INSERT'::audit_action,
    TG_TABLE_NAME,
    NEW.id,
    NULL,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

-- Generic trigger function for audit logging on UPDATE
CREATE OR REPLACE FUNCTION public.audit_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is a soft delete
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    PERFORM create_audit_log(
      'SOFT_DELETE'::audit_action,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSE
    PERFORM create_audit_log(
      'UPDATE'::audit_action,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Generic trigger function for audit logging on DELETE
CREATE OR REPLACE FUNCTION public.audit_delete_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_audit_log(
    'DELETE'::audit_action,
    TG_TABLE_NAME,
    OLD.id,
    to_jsonb(OLD),
    NULL
  );
  RETURN OLD;
END;
$$;

-- Create triggers for athletes table
CREATE TRIGGER audit_athletes_insert
AFTER INSERT ON public.athletes
FOR EACH ROW
EXECUTE FUNCTION public.audit_insert_trigger();

CREATE TRIGGER audit_athletes_update
AFTER UPDATE ON public.athletes
FOR EACH ROW
EXECUTE FUNCTION public.audit_update_trigger();

CREATE TRIGGER audit_athletes_delete
AFTER DELETE ON public.athletes
FOR EACH ROW
EXECUTE FUNCTION public.audit_delete_trigger();

-- Create triggers for events table
CREATE TRIGGER audit_events_insert
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.audit_insert_trigger();

CREATE TRIGGER audit_events_update
AFTER UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.audit_update_trigger();

CREATE TRIGGER audit_events_delete
AFTER DELETE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.audit_delete_trigger();

-- Create triggers for rotation_duties table
CREATE TRIGGER audit_rotation_duties_insert
AFTER INSERT ON public.rotation_duties
FOR EACH ROW
EXECUTE FUNCTION public.audit_insert_trigger();

CREATE TRIGGER audit_rotation_duties_update
AFTER UPDATE ON public.rotation_duties
FOR EACH ROW
EXECUTE FUNCTION public.audit_update_trigger();

CREATE TRIGGER audit_rotation_duties_delete
AFTER DELETE ON public.rotation_duties
FOR EACH ROW
EXECUTE FUNCTION public.audit_delete_trigger();

-- Create triggers for debts table
CREATE TRIGGER audit_debts_insert
AFTER INSERT ON public.debts
FOR EACH ROW
EXECUTE FUNCTION public.audit_insert_trigger();

CREATE TRIGGER audit_debts_update
AFTER UPDATE ON public.debts
FOR EACH ROW
EXECUTE FUNCTION public.audit_update_trigger();

CREATE TRIGGER audit_debts_delete
AFTER DELETE ON public.debts
FOR EACH ROW
EXECUTE FUNCTION public.audit_delete_trigger();

-- Create triggers for swap_requests table
CREATE TRIGGER audit_swap_requests_insert
AFTER INSERT ON public.swap_requests
FOR EACH ROW
EXECUTE FUNCTION public.audit_insert_trigger();

CREATE TRIGGER audit_swap_requests_update
AFTER UPDATE ON public.swap_requests
FOR EACH ROW
EXECUTE FUNCTION public.audit_update_trigger();

CREATE TRIGGER audit_swap_requests_delete
AFTER DELETE ON public.swap_requests
FOR EACH ROW
EXECUTE FUNCTION public.audit_delete_trigger();

-- Create triggers for attendances table
CREATE TRIGGER audit_attendances_insert
AFTER INSERT ON public.attendances
FOR EACH ROW
EXECUTE FUNCTION public.audit_insert_trigger();

CREATE TRIGGER audit_attendances_update
AFTER UPDATE ON public.attendances
FOR EACH ROW
EXECUTE FUNCTION public.audit_update_trigger();

CREATE TRIGGER audit_attendances_delete
AFTER DELETE ON public.attendances
FOR EACH ROW
EXECUTE FUNCTION public.audit_delete_trigger();

-- Update RLS policies to exclude soft deleted records
-- Athletes policies
DROP POLICY IF EXISTS "Authenticated users can view athletes" ON public.athletes;
CREATE POLICY "Authenticated users can view non-deleted athletes"
ON public.athletes FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins can manage athletes" ON public.athletes;
CREATE POLICY "Admins can manage non-deleted athletes"
ON public.athletes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND deleted_at IS NULL)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Events policies
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
CREATE POLICY "Authenticated users can view non-deleted events"
ON public.events FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage non-deleted events"
ON public.events FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND deleted_at IS NULL)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Rotation duties policies
DROP POLICY IF EXISTS "Authenticated users can view rotation duties" ON public.rotation_duties;
CREATE POLICY "Authenticated users can view non-deleted rotation duties"
ON public.rotation_duties FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins can manage rotation duties" ON public.rotation_duties;
CREATE POLICY "Admins can manage non-deleted rotation duties"
ON public.rotation_duties FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND deleted_at IS NULL)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Debts policies
DROP POLICY IF EXISTS "Authenticated users can view debts" ON public.debts;
CREATE POLICY "Authenticated users can view non-deleted debts"
ON public.debts FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins can manage debts" ON public.debts;
CREATE POLICY "Admins can manage non-deleted debts"
ON public.debts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND deleted_at IS NULL)
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to soft delete a record
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
  -- Validate table name to prevent SQL injection
  IF p_table_name NOT IN ('athletes', 'events', 'rotation_duties', 'debts') THEN
    RAISE EXCEPTION 'Invalid table name';
  END IF;
  
  -- Build and execute UPDATE query
  v_sql := format('UPDATE public.%I SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL', p_table_name);
  EXECUTE v_sql USING p_record_id;
  
  RETURN FOUND;
END;
$$;

-- Function to restore a soft deleted record
CREATE OR REPLACE FUNCTION public.restore_soft_deleted(
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
  -- Only admins can restore
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can restore deleted records';
  END IF;
  
  -- Validate table name to prevent SQL injection
  IF p_table_name NOT IN ('athletes', 'events', 'rotation_duties', 'debts') THEN
    RAISE EXCEPTION 'Invalid table name';
  END IF;
  
  -- Build and execute UPDATE query
  v_sql := format('UPDATE public.%I SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL', p_table_name);
  EXECUTE v_sql USING p_record_id;
  
  -- Log restoration as INSERT audit
  IF FOUND THEN
    PERFORM create_audit_log(
      'INSERT'::audit_action,
      p_table_name,
      p_record_id,
      NULL,
      jsonb_build_object('restored', true)
    );
  END IF;
  
  RETURN FOUND;
END;
$$;

-- Update handle_new_user to log signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  
  -- Default role is athlete unless specified
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'athlete')
  );
  
  -- Log signup action
  INSERT INTO public.audits (user_id, action, new_data)
  VALUES (
    NEW.id,
    'SIGNUP'::audit_action,
    jsonb_build_object(
      'email', NEW.email,
      'name', COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
      'role', COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'athlete')
    )
  );
  
  RETURN NEW;
END;
$$;

COMMENT ON TABLE public.audits IS 'Audit log for tracking all user actions and data changes';
COMMENT ON COLUMN public.athletes.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN public.events.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN public.rotation_duties.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN public.debts.deleted_at IS 'Timestamp when record was soft deleted';

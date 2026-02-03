-- ============================================
-- MIGRAÇÃO: Soft Delete em Attendances + Limpeza swap_status
-- ============================================

-- 1. Adicionar coluna deleted_at em attendances para soft delete
ALTER TABLE public.attendances 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Criar índice parcial para consultas eficientes (registros não deletados)
CREATE INDEX IF NOT EXISTS idx_attendances_deleted_at 
ON public.attendances(deleted_at) 
WHERE deleted_at IS NULL;

-- 3. Atualizar RLS policy de attendances para excluir soft deleted
DROP POLICY IF EXISTS "Authenticated users can view attendances" ON public.attendances;

CREATE POLICY "Authenticated users can view non-deleted attendances"
ON public.attendances FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- 4. Criar trigger para auditoria de attendances (se não existir)
CREATE OR REPLACE FUNCTION public.audit_attendances_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action audit_action;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', 'attendances', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if this is a soft delete
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'SOFT_DELETE';
    ELSE
      v_action := 'UPDATE';
    END IF;
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), v_action, 'attendances', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', 'attendances', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 5. Criar trigger na tabela attendances
DROP TRIGGER IF EXISTS audit_attendances_trigger ON public.attendances;
CREATE TRIGGER audit_attendances_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.attendances
FOR EACH ROW EXECUTE FUNCTION public.audit_attendances_changes();

-- 6. Criar triggers de auditoria para events (se não existir)
CREATE OR REPLACE FUNCTION public.audit_events_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action audit_action;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', 'events', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'SOFT_DELETE';
    ELSE
      v_action := 'UPDATE';
    END IF;
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), v_action, 'events', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', 'events', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_events_trigger ON public.events;
CREATE TRIGGER audit_events_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.audit_events_changes();

-- 7. Criar triggers de auditoria para rotation_duties (se não existir)
CREATE OR REPLACE FUNCTION public.audit_rotation_duties_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action audit_action;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', 'rotation_duties', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'SOFT_DELETE';
    ELSE
      v_action := 'UPDATE';
    END IF;
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), v_action, 'rotation_duties', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', 'rotation_duties', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_rotation_duties_trigger ON public.rotation_duties;
CREATE TRIGGER audit_rotation_duties_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.rotation_duties
FOR EACH ROW EXECUTE FUNCTION public.audit_rotation_duties_changes();

-- 8. Remover enum swap_status não utilizado
DROP TYPE IF EXISTS public.swap_status CASCADE;
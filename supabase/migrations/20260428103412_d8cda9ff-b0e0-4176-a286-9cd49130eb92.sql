-- 1) Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id),
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_amount NUMERIC(10,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_expenses_club_id ON public.expenses(club_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON public.expenses(deleted_at) WHERE deleted_at IS NULL;

-- 2) Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 3) Policies (admin-only, no athlete visibility)
CREATE POLICY "Admin can manage club expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (
  club_id = public.get_user_club_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'club_admin'::app_role))
)
WITH CHECK (
  club_id = public.get_user_club_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'club_admin'::app_role))
);

CREATE POLICY "Super admin manage all expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- 4) updated_at trigger (reuse existing function)
CREATE TRIGGER expenses_set_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Audit trigger — reuse generic audit pattern used for debts
CREATE OR REPLACE FUNCTION public.audit_expenses_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id UUID;
  v_action TEXT;
  v_entity_desc TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_club_id := NEW.club_id;
    v_action := 'create';
    v_entity_desc := NEW.name;
  ELSIF TG_OP = 'UPDATE' THEN
    v_club_id := NEW.club_id;
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'delete';
    ELSIF OLD.paid_at IS NULL AND NEW.paid_at IS NOT NULL THEN
      v_action := 'mark_paid';
    ELSE
      v_action := 'update';
    END IF;
    v_entity_desc := NEW.name;
  ELSE
    v_club_id := OLD.club_id;
    v_action := 'delete';
    v_entity_desc := OLD.name;
  END IF;

  INSERT INTO public.audits (club_id, user_id, entity_type, entity_id, action, description)
  VALUES (
    v_club_id,
    auth.uid(),
    'expense',
    COALESCE(NEW.id, OLD.id),
    v_action,
    v_entity_desc
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_expenses_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.audit_expenses_changes();
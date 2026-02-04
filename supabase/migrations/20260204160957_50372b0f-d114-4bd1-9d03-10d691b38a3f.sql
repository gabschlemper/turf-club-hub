-- Create debts table for financial management
CREATE TABLE public.debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id),
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_amount NUMERIC(10, 2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_debts_athlete_id ON public.debts(athlete_id);
CREATE INDEX idx_debts_due_date ON public.debts(due_date);
CREATE INDEX idx_debts_deleted_at ON public.debts(deleted_at) WHERE deleted_at IS NULL;

-- RLS Policies

-- Admins can manage all debts
CREATE POLICY "Admins can manage debts"
ON public.debts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Athletes can view their own debts (via profile email match)
CREATE POLICY "Athletes can view their own debts"
ON public.debts FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL AND
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN athletes a ON a.email = p.email
    WHERE p.user_id = auth.uid() AND a.id = debts.athlete_id
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_debts_updated_at
BEFORE UPDATE ON public.debts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Audit trigger for debts
CREATE OR REPLACE FUNCTION public.audit_debts_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action audit_action;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', 'debts', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'SOFT_DELETE';
    ELSE
      v_action := 'UPDATE';
    END IF;
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), v_action, 'debts', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audits (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', 'debts', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_debts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.debts
FOR EACH ROW EXECUTE FUNCTION public.audit_debts_changes();
-- Create enum for confirmation status
CREATE TYPE public.confirmation_status AS ENUM ('confirmed', 'declined');

-- Create training confirmations table
CREATE TABLE public.training_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  status public.confirmation_status NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_id, athlete_id)
);

-- Enable RLS
ALTER TABLE public.training_confirmations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all confirmations
CREATE POLICY "Admins can manage training confirmations"
ON public.training_confirmations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Athletes can view all confirmations (to see who else confirmed)
CREATE POLICY "Authenticated users can view training confirmations"
ON public.training_confirmations
FOR SELECT
USING (true);

-- Policy: Athletes can manage their own confirmations
CREATE POLICY "Athletes can manage their own confirmations"
ON public.training_confirmations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.athletes a ON a.email = p.email
    WHERE p.user_id = auth.uid() AND a.id = training_confirmations.athlete_id
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_training_confirmations_updated_at
BEFORE UPDATE ON public.training_confirmations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for training confirmations
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_confirmations;
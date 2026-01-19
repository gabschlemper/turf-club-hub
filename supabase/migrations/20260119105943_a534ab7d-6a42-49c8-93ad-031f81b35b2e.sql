-- Create rotation_duties table for base training rotation
CREATE TABLE public.rotation_duties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duty_date DATE NOT NULL,
  athlete1_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  athlete2_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_athletes CHECK (athlete1_id != athlete2_id),
  CONSTRAINT unique_duty_date UNIQUE (duty_date)
);

-- Create swap_requests table for athlete swap requests
CREATE TYPE public.swap_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.swap_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rotation_duty_id UUID NOT NULL REFERENCES public.rotation_duties(id) ON DELETE CASCADE,
  requester_athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  target_athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  status swap_status NOT NULL DEFAULT 'pending',
  message TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rotation_duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for rotation_duties
CREATE POLICY "Authenticated users can view rotation duties"
ON public.rotation_duties
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage rotation duties"
ON public.rotation_duties
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for swap_requests
CREATE POLICY "Authenticated users can view swap requests"
ON public.swap_requests
FOR SELECT
USING (true);

CREATE POLICY "Athletes can create swap requests"
ON public.swap_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Athletes can update their swap requests"
ON public.swap_requests
FOR UPDATE
USING (true);

CREATE POLICY "Admins can manage swap requests"
ON public.swap_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at triggers
CREATE TRIGGER update_rotation_duties_updated_at
BEFORE UPDATE ON public.rotation_duties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_swap_requests_updated_at
BEFORE UPDATE ON public.swap_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
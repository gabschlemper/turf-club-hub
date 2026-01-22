-- Create clubs table for multi-tenancy
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clubs
-- Super admins can manage all clubs
CREATE POLICY "Super admins can manage clubs"
ON public.clubs FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Users can view their own club
CREATE POLICY "Users can view their own club"
ON public.clubs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.club_id = clubs.id
  )
);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_clubs_updated_at
BEFORE UPDATE ON public.clubs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index
CREATE INDEX idx_clubs_slug ON public.clubs(slug);

-- Insert a default club (you can modify this)
INSERT INTO public.clubs (id, name, slug, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Hóquei Clube Desterro',
  'hoquei-clube-desterro',
  'Hóquei Clube Desterro - Florianópolis'
);

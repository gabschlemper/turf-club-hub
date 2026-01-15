-- Create enum for event types
CREATE TYPE public.event_type AS ENUM ('championship', 'training', 'social');

-- Create enum for gender/naipe
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'both');

-- Create enum for attendance status
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'justified');

-- Create athletes table
CREATE TABLE public.athletes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  gender gender_type NOT NULL,
  birth_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  event_type event_type NOT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  gender gender_type NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendances table (prepares for future attendance tracking)
CREATE TABLE public.attendances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'absent',
  marked_by UUID REFERENCES auth.users(id),
  marked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, athlete_id)
);

-- Enable RLS on all tables
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- Athletes policies
CREATE POLICY "Admins can manage athletes"
ON public.athletes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view athletes"
ON public.athletes FOR SELECT
TO authenticated
USING (true);

-- Events policies
CREATE POLICY "Admins can manage events"
ON public.events FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view events"
ON public.events FOR SELECT
TO authenticated
USING (true);

-- Attendances policies
CREATE POLICY "Admins can manage attendances"
ON public.attendances FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view attendances"
ON public.attendances FOR SELECT
TO authenticated
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_athletes_updated_at
BEFORE UPDATE ON public.athletes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_events_start_datetime ON public.events(start_datetime);
CREATE INDEX idx_events_event_type ON public.events(event_type);
CREATE INDEX idx_events_gender ON public.events(gender);
CREATE INDEX idx_athletes_gender ON public.athletes(gender);
CREATE INDEX idx_attendances_event_id ON public.attendances(event_id);
CREATE INDEX idx_attendances_athlete_id ON public.attendances(athlete_id);
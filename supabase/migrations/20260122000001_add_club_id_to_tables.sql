-- Add club_id to all main tables

-- Add club_id to athletes
ALTER TABLE public.athletes 
ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

-- Set default club for existing athletes
UPDATE public.athletes 
SET club_id = '00000000-0000-0000-0000-000000000001'
WHERE club_id IS NULL;

-- Make club_id required
ALTER TABLE public.athletes 
ALTER COLUMN club_id SET NOT NULL;

-- Add club_id to events
ALTER TABLE public.events 
ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

UPDATE public.events 
SET club_id = '00000000-0000-0000-0000-000000000001'
WHERE club_id IS NULL;

ALTER TABLE public.events 
ALTER COLUMN club_id SET NOT NULL;

-- Add club_id to attendances (via event relationship, but explicit is better)
ALTER TABLE public.attendances 
ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

UPDATE public.attendances 
SET club_id = '00000000-0000-0000-0000-000000000001'
WHERE club_id IS NULL;

ALTER TABLE public.attendances 
ALTER COLUMN club_id SET NOT NULL;

-- Add club_id to training_confirmations if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'training_confirmations'
  ) THEN
    ALTER TABLE public.training_confirmations 
    ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;
    
    UPDATE public.training_confirmations 
    SET club_id = '00000000-0000-0000-0000-000000000001'
    WHERE club_id IS NULL;
    
    ALTER TABLE public.training_confirmations 
    ALTER COLUMN club_id SET NOT NULL;
  END IF;
END $$;

-- Add club_id to rotation_duties if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rotation_duties'
  ) THEN
    ALTER TABLE public.rotation_duties 
    ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;
    
    UPDATE public.rotation_duties 
    SET club_id = '00000000-0000-0000-0000-000000000001'
    WHERE club_id IS NULL;
    
    ALTER TABLE public.rotation_duties 
    ALTER COLUMN club_id SET NOT NULL;
  END IF;
END $$;

-- Add club_id to swap_requests if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'swap_requests'
  ) THEN
    ALTER TABLE public.swap_requests 
    ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;
    
    UPDATE public.swap_requests 
    SET club_id = '00000000-0000-0000-0000-000000000001'
    WHERE club_id IS NULL;
    
    ALTER TABLE public.swap_requests 
    ALTER COLUMN club_id SET NOT NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX idx_athletes_club_id ON public.athletes(club_id);
CREATE INDEX idx_events_club_id ON public.events(club_id);
CREATE INDEX idx_attendances_club_id ON public.attendances(club_id);

-- Create composite indexes for common queries
CREATE INDEX idx_athletes_club_gender ON public.athletes(club_id, gender);
CREATE INDEX idx_events_club_type_date ON public.events(club_id, event_type, start_datetime);

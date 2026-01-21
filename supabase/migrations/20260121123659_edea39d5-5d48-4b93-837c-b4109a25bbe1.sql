-- Create enum for athlete category
CREATE TYPE public.athlete_category AS ENUM ('GF', 'SC', 'OE');

-- Create enum for training type
CREATE TYPE public.training_type AS ENUM ('principal', 'extra');

-- Add category column to athletes table
ALTER TABLE public.athletes 
ADD COLUMN category public.athlete_category NOT NULL DEFAULT 'GF';

-- Add training_type and weight columns to events table
ALTER TABLE public.events 
ADD COLUMN training_type public.training_type,
ADD COLUMN weight DECIMAL(3,2);

-- Migrate existing events: Sunday = principal (1.0), others = extra (0.25)
UPDATE public.events 
SET 
  training_type = CASE 
    WHEN EXTRACT(DOW FROM start_datetime) = 0 THEN 'principal'::training_type 
    ELSE 'extra'::training_type 
  END,
  weight = CASE 
    WHEN EXTRACT(DOW FROM start_datetime) = 0 THEN 1.0 
    ELSE 0.25 
  END
WHERE event_type = 'training';

-- Create function to automatically set training_type and weight based on date
CREATE OR REPLACE FUNCTION public.set_training_defaults()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'training' THEN
    IF NEW.training_type IS NULL THEN
      NEW.training_type := CASE 
        WHEN EXTRACT(DOW FROM NEW.start_datetime) = 0 THEN 'principal'::training_type 
        ELSE 'extra'::training_type 
      END;
    END IF;
    IF NEW.weight IS NULL THEN
      NEW.weight := CASE 
        WHEN NEW.training_type = 'principal' THEN 1.0 
        ELSE 0.25 
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic defaults
CREATE TRIGGER set_training_defaults_trigger
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.set_training_defaults();
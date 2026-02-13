-- Create Purpose Enum
CREATE TYPE public.property_purpose AS ENUM ('sale', 'investment');

-- Add Purpose Column
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS purpose public.property_purpose DEFAULT 'investment';

-- Add specific index for filtering by purpose
CREATE INDEX IF NOT EXISTS idx_properties_purpose ON public.properties(purpose);

-- Update RLS Policy for Public View (Safety Net)
-- Ensure that only 'sale' properties can be seen by public if listed.
-- The existing policy "Public properties are viewable by everyone" checks (is_listed = true).
-- We can refine it, or just rely on the fact that we won't list investment properties.
-- For now, we'll keep the existing policy as is, but ensuring app logic doesn't list investment properties.

-- Rename stratum to physical_condition
ALTER TABLE public.properties RENAME COLUMN stratum TO physical_condition;

-- Update constraint if it exists or just modify column type/comment
-- Since it's a numeric field, we just change the label in UI. 
-- In the DB it will store 1-5 instead of 1-6.

COMMENT ON COLUMN public.properties.physical_condition IS 'Condición física del inmueble: 1 (Para demoler) a 5 (Propiedad nueva)';

NOTIFY pgrst, 'reload schema';

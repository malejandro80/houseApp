-- Add explicit terms acceptance for public listings
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS accepted_listing_terms BOOLEAN DEFAULT FALSE;

-- Update RLS to ensure only properties with accepted terms can be viewed publicly
-- Note: is_listed already handles public visibility, but we can add this as a secondary safety 
-- or use it to enforce that is_listed can only be TRUE if accepted_listing_terms is TRUE.

-- Trigger to enforce terms before listing
CREATE OR REPLACE FUNCTION public.check_listing_terms()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_listed = TRUE AND NEW.accepted_listing_terms = FALSE THEN
        RAISE EXCEPTION 'Debe aceptar los términos de publicación antes de listar la propiedad.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_listing_terms ON public.properties;
CREATE TRIGGER tr_check_listing_terms
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE PROCEDURE public.check_listing_terms();

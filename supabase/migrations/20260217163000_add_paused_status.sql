-- ==========================================
-- Add 'paused' to Listing Status Check
-- ==========================================

DO $$
BEGIN
    -- Drop all known variations of this constraint to be safe
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS listing_status_check;
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS check_listing_status;
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_listing_status_check; -- The one from your error message
    
    -- Re-add the constraint with 'paused' included
    ALTER TABLE public.properties
    ADD CONSTRAINT properties_listing_status_check 
    CHECK (listing_status IN ('active', 'sold', 'rented', 'inactive', 'reserved', 'paused'));
END $$;

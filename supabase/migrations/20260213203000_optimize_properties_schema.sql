-- Migration: Optimize properties schema for Normalization and Performance

-- 1. Create triggers for automatic timestamp updates (Consistency)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to properties
DROP TRIGGER IF EXISTS on_update_properties ON public.properties;
CREATE TRIGGER on_update_properties
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Apply trigger to property_owners
DROP TRIGGER IF EXISTS on_update_property_owners ON public.property_owners;
CREATE TRIGGER on_update_property_owners
  BEFORE UPDATE ON public.property_owners
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Apply trigger to profiles
DROP TRIGGER IF EXISTS on_update_profiles ON public.profiles;
CREATE TRIGGER on_update_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- 2. Normalize 'properties' table (3NF)
-- Extract common fields from JSONB 'metadata' to top-level columns for indexing and constraints.

-- Add new columns
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bathrooms NUMERIC DEFAULT 0, -- Numeric for half-baths
ADD COLUMN IF NOT EXISTS parking INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS listing_status TEXT DEFAULT 'active' CHECK (listing_status IN ('active', 'sold', 'rented', 'inactive'));

-- 3. Data Migration (Atomicity)
-- Move data from JSONB to new columns.
-- Using a DO block to ensure it runs as a single transaction unit.
DO $$
BEGIN
    -- Update columns from metadata if they act as source of truth currently
    -- This assumes 'metadata' might have these fields. If not, this is safe (returns null/default).
    UPDATE public.properties
    SET 
        bedrooms = COALESCE((metadata->>'bedrooms')::INTEGER, 0),
        bathrooms = COALESCE((metadata->>'bathrooms')::NUMERIC, 0),
        parking = COALESCE((metadata->>'parking')::INTEGER, 0),
        description = COALESCE(metadata->>'description', description);
        
    -- Optional: Remove keys from metadata to avoid redundancy (Normalization)
    -- UPDATE public.properties
    -- SET metadata = metadata - 'bedrooms' - 'bathrooms' - 'parking' - 'description';
END $$;

-- 4. Create Indexes for new columns (Performance)
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON public.properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_bathrooms ON public.properties(bathrooms);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(listing_status);

-- 5. Add Constraints (Integrity)
ALTER TABLE public.properties
ADD CONSTRAINT check_positive_values 
CHECK (
    sale_price >= 0 AND 
    rent_price >= 0 AND 
    bedrooms >= 0 AND 
    bathrooms >= 0 AND 
    parking >= 0
);

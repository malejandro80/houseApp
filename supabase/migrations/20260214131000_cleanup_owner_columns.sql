-- Migration: Cleanup Properties Table and Rely on Property Owners Table
-- Purpose: Remove redundant owner columns from properties table.

-- 1. Remove redundant columns if they exist
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='properties' AND column_name='owner_name') THEN
        ALTER TABLE public.properties DROP COLUMN owner_name;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='properties' AND column_name='owner_phone') THEN
        ALTER TABLE public.properties DROP COLUMN owner_phone;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='properties' AND column_name='owner_email') THEN
        ALTER TABLE public.properties DROP COLUMN owner_email;
    END IF;
END $$;

-- 2. Ensure owner_id exists (it should from 20260213194500)
-- But let's be double sure it has the right reference
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='properties' AND column_name='owner_id') THEN
        ALTER TABLE public.properties ADD COLUMN owner_id UUID REFERENCES public.property_owners(id);
    END IF;
END $$;

-- 3. Reload schema cache
NOTIFY pgrst, 'reload schema';

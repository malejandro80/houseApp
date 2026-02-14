-- Migration: Aggressive Schema Cache Refresh and Column Verification
-- Created: 2026-02-14 13:00:00 (UTC-5)
-- Purpose: Force PostgREST to recognize 'owner_email' column.

-- 1. Verify and Add Columns (Idempotent)
DO $$ 
BEGIN 
    -- Ensure owner_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='properties' AND column_name='owner_name') THEN
        ALTER TABLE public.properties ADD COLUMN owner_name TEXT;
    END IF;

    -- Ensure owner_phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='properties' AND column_name='owner_phone') THEN
        ALTER TABLE public.properties ADD COLUMN owner_phone TEXT;
    END IF;

    -- Ensure owner_email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='properties' AND column_name='owner_email') THEN
        ALTER TABLE public.properties ADD COLUMN owner_email TEXT;
    END IF;
END $$;

-- 2. Force Schema Cache Reload
-- We run multiple common notification channels to be sure.
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 3. Verify specifically for the user (Check output in SQL Editor)
-- SELECT column_name FROM information_schema.columns WHERE table_name='properties' AND column_name IN ('owner_name', 'owner_phone', 'owner_email');

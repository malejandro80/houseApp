-- Migration: Ensure all owner contact columns exist and REFRESH PostgREST cache
-- Run this if you see "column not found in schema cache" errors.

-- 1. Ensure columns exist (Safety)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_phone TEXT,
ADD COLUMN IF NOT EXISTS owner_email TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stratum INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS legal_status TEXT DEFAULT 'deed_ready',
ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- 2. Force PostgREST to reload the schema cache
-- Note: This command is specific to Supabase/PostgREST. 
-- It works when executed in the Supabase SQL Editor.
NOTIFY pgrst, 'reload schema';

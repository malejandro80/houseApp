-- Migration: Add owner contact columns to properties table
-- To support capturing owner details for potential purchases and sales.

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_phone TEXT,
ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- Index for searching/filtering
CREATE INDEX IF NOT EXISTS idx_properties_owner_name ON public.properties(owner_name);

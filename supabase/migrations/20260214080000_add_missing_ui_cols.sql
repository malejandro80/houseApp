-- Migration: Add missing metadata columns to properties table
-- To support detailed property analysis and tracking.

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stratum INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS legal_status TEXT DEFAULT 'deed_ready',
ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Index for searching
CREATE INDEX IF NOT EXISTS idx_properties_stratum ON public.properties(stratum);
CREATE INDEX IF NOT EXISTS idx_properties_legal_status ON public.properties(legal_status);

-- Migration to add closed_price to properties for tracking final transaction amounts
-- This field is used to calculate "Ingresos Realizados" for advisors

ALTER TABLE IF EXISTS public.properties
ADD COLUMN IF NOT EXISTS closed_price numeric;

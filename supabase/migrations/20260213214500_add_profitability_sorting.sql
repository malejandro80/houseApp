-- Migration: Add profitability field and default sorting
-- Add 'profitability' column to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS profitability NUMERIC DEFAULT 0;

-- Create function to calculate profitability
CREATE OR REPLACE FUNCTION calculate_profitability(sale_price numeric, rent_price numeric)
RETURNS numeric AS $$
BEGIN
  IF sale_price = 0 THEN
    RETURN 0;
  END IF;
  RETURN ((rent_price * 12) / sale_price) * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update profitability on insert or update
CREATE OR REPLACE FUNCTION update_profitability()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profitability = calculate_profitability(NEW.sale_price, NEW.rent_price);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profitability ON public.properties;
CREATE TRIGGER trigger_update_profitability
BEFORE INSERT OR UPDATE OF sale_price, rent_price ON public.properties
FOR EACH ROW
EXECUTE FUNCTION update_profitability();

-- Initial calculation for existing rows
UPDATE public.properties
SET profitability = calculate_profitability(sale_price, rent_price);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_properties_profitability ON public.properties(profitability DESC);

-- Migration to add optional 'title' and 'contact_phone' columns
-- This migration adheres to the English-Only standard for column names

ALTER TABLE datahouse
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- No new policies needed as existing RLS for UPDATE/INSERT covers these fields.

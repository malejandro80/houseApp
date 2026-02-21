BEGIN;
  -- Add a column to store the scheduled visit date
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ;
COMMIT;

-- Force enable replica identity and realtime for lead_messages
ALTER TABLE lead_messages REPLICA IDENTITY FULL;

-- Ensure Publication exists for realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Add tracking for lead_messages
ALTER PUBLICATION supabase_realtime ADD TABLE lead_messages;
